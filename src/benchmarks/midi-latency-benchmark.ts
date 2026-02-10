// MIDI Latency Benchmark Script
// Measures end-to-end latency: Hardware -> Worker -> Container -> UI
// Target: < 50ms for real-time feel

interface BenchmarkResult {
  eventId: string;
  startTime: number;
  hardwareTime: number;
  workerTime: number;
  containerTime: number;
  uiTime: number;
  totalLatency: number;
}

interface LatencyStats {
  average: number;
  min: number;
  max: number;
  median: number;
  p95: number;
  count: number;
  within50ms: number;
}

class MidiLatencyBenchmark {
  private results: BenchmarkResult[] = [];
  private midiWorker: Worker | null = null;
  private containerWorker: Worker | null = null;
  private eventCounter = 0;
  private pendingEvents = new Map<string, BenchmarkResult>();

  constructor() {
    this.initializeWorkers();
  }

  private async initializeWorkers(): Promise<void> {
    try {
      // Initialize MIDI Interceptor Worker
      this.midiWorker = new Worker('/src/workers/midi-interceptor.ts', { type: 'module' });

      // Initialize WebContainer Worker
      this.containerWorker = new Worker('/src/lib/midi-colab/web-container-worker.ts', { type: 'module' });

      // Set up message handlers
      this.setupWorkerHandlers();

      // Initialize workers
      await this.initializeMidiWorker();
      await this.initializeContainerWorker();

      console.log('Workers initialized successfully');
    } catch (error) {
      console.error('Failed to initialize workers:', error);
    }
  }

  private setupWorkerHandlers(): void {
    if (this.midiWorker) {
      this.midiWorker.onmessage = (e) => {
        if (e.data.type === 'routed-midi-event' && e.data.data) {
          this.onMidiWorkerOutput(e.data.data);
        }
      };
    }

    if (this.containerWorker) {
      this.containerWorker.onmessage = (e) => {
        if (e.data.type === 'response' && e.data.id) {
          this.onContainerWorkerOutput(e.data.id);
        }
      };
    }
  }

  private async initializeMidiWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.midiWorker) {
        reject(new Error('MIDI worker not initialized'));
        return;
      }

      const timeout = setTimeout(() => reject(new Error('MIDI worker init timeout')), 5000);

      this.midiWorker.onmessage = (e) => {
        if (e.data.type === 'initialized') {
          clearTimeout(timeout);
          this.midiWorker!.onmessage = (e) => {
            if (e.data.type === 'routed-midi-event' && e.data.data) {
              this.onMidiWorkerOutput(e.data.data);
            }
          };
          resolve();
        }
      };

      this.midiWorker.postMessage({ type: 'init', config: { throttleMs: 0 } });
    });
  }

  private async initializeContainerWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.containerWorker) {
        reject(new Error('Container worker not initialized'));
        return;
      }

      const messageId = 'init-' + Date.now();
      const timeout = setTimeout(() => reject(new Error('Container worker init timeout')), 10000);

      this.containerWorker.onmessage = (e) => {
        if (e.data.id === messageId) {
          clearTimeout(timeout);
          this.containerWorker!.onmessage = (e) => {
            if (e.data.type === 'response' && e.data.id) {
              this.onContainerWorkerOutput(e.data.id);
            }
          };
          resolve();
        }
      };

      this.containerWorker.postMessage({ type: 'start', id: messageId });
    });
  }

  private onMidiWorkerOutput(routedEvent: any): void {
    const eventId = routedEvent.eventId;
    const result = this.pendingEvents.get(eventId);
    if (result) {
      result.workerTime = performance.now();
      // Send to container worker
      this.sendToContainerWorker(result);
    }
  }

  private sendToContainerWorker(result: BenchmarkResult): void {
    if (!this.containerWorker) return;

    const containerInput = {
      type: 'midi',
      data: {
        type: 'noteon',
        data: [144, 60, 100], // Middle C note on
        timestamp: result.hardwareTime,
        source: 'benchmark'
      }
    };

    this.containerWorker.postMessage({
      type: 'process',
      data: containerInput,
      id: result.eventId
    });
  }

  private onContainerWorkerOutput(eventId: string): void {
    const benchmarkResult = this.pendingEvents.get(eventId);
    if (benchmarkResult) {
      benchmarkResult.containerTime = performance.now();
      // Simulate UI update (in real implementation, this would be when React re-renders)
      benchmarkResult.uiTime = performance.now();
      benchmarkResult.totalLatency = benchmarkResult.uiTime - benchmarkResult.startTime;

      this.results.push(benchmarkResult);
      this.pendingEvents.delete(eventId);
    }
  }

  // Simulate hardware MIDI input
  private createSyntheticMidiEvent(): void {
    const eventId = `event-${++this.eventCounter}`;
    const startTime = performance.now();

    const result: BenchmarkResult = {
      eventId,
      startTime,
      hardwareTime: startTime, // Simulate immediate hardware detection
      workerTime: 0,
      containerTime: 0,
      uiTime: 0,
      totalLatency: 0
    };

    this.pendingEvents.set(eventId, result);

    // Send to MIDI worker
    if (this.midiWorker) {
      this.midiWorker.postMessage({
        type: 'midi-event',
        data: {
          eventId,
          type: 'noteon',
          data: [144, 60, 100],
          timestamp: startTime,
          source: 'benchmark-hardware'
        }
      });
    }
  }

  async runBenchmark(eventCount: number = 100, intervalMs: number = 10): Promise<LatencyStats> {
    console.log(`Starting MIDI latency benchmark with ${eventCount} events...`);

    this.results = [];
    this.eventCounter = 0;
    this.pendingEvents.clear();

    // Send events at regular intervals
    for (let i = 0; i < eventCount; i++) {
      this.createSyntheticMidiEvent();
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    // Wait for all events to complete
    while (this.pendingEvents.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return this.calculateStats();
  }

  private calculateStats(): LatencyStats {
    if (this.results.length === 0) {
      throw new Error('No benchmark results to calculate stats from');
    }

    const latencies = this.results.map(r => r.totalLatency).sort((a, b) => a - b);

    const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const min = latencies[0];
    const max = latencies[latencies.length - 1];
    const median = latencies[Math.floor(latencies.length / 2)];
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    const within50ms = latencies.filter(lat => lat < 50).length;

    return {
      average,
      min,
      max,
      median,
      p95,
      count: latencies.length,
      within50ms
    };
  }

  logResults(stats: LatencyStats): void {
    console.log('\n=== MIDI Latency Benchmark Results ===');
    console.log(`Events tested: ${stats.count}`);
    console.log(`Average latency: ${stats.average.toFixed(2)}ms`);
    console.log(`Min latency: ${stats.min.toFixed(2)}ms`);
    console.log(`Max latency: ${stats.max.toFixed(2)}ms`);
    console.log(`Median latency: ${stats.median.toFixed(2)}ms`);
    console.log(`95th percentile: ${stats.p95.toFixed(2)}ms`);
    console.log(`Events < 50ms: ${stats.within50ms}/${stats.count} (${((stats.within50ms / stats.count) * 100).toFixed(1)}%)`);

    if (stats.average < 50) {
      console.log('✅ PASS: Average latency meets real-time requirement (< 50ms)');
    } else {
      console.log('❌ FAIL: Average latency exceeds real-time requirement (>= 50ms)');
    }

    if (stats.p95 < 50) {
      console.log('✅ PASS: 95th percentile latency meets real-time requirement (< 50ms)');
    } else {
      console.log('⚠️  WARNING: 95th percentile latency exceeds real-time requirement (>= 50ms)');
    }
  }

  // Cleanup
  dispose(): void {
    if (this.midiWorker) {
      this.midiWorker.postMessage({ type: 'stop' });
      this.midiWorker.terminate();
    }
    if (this.containerWorker) {
      this.containerWorker.postMessage({ type: 'dispose', id: 'dispose-' + Date.now() });
      this.containerWorker.terminate();
    }
  }
}

// Export for use in main application
export { MidiLatencyBenchmark, type LatencyStats, type BenchmarkResult };

// Auto-run benchmark when script is loaded directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment
  const benchmark = new MidiLatencyBenchmark();

  // Wait for page load, then run benchmark
  window.addEventListener('load', async () => {
    try {
      console.log('Running MIDI latency benchmark...');
      const stats = await benchmark.runBenchmark(50, 20); // 50 events, 20ms intervals
      benchmark.logResults(stats);
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      benchmark.dispose();
    }
  });
}