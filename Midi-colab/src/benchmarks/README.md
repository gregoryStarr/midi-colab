# MIDI Latency Benchmark

This benchmark measures end-to-end MIDI latency through the MIDI-Colab architecture: Hardware -> Worker -> Container -> UI.

## Architecture Overview

The benchmark tests the complete MIDI processing pipeline:

1. **Hardware Layer**: MIDI input from physical devices (simulated in benchmark)
2. **Worker Layer**: MIDI Interceptor Web Worker for message routing
3. **Container Layer**: WebContainer with Tonal.js music theory processing
4. **UI Layer**: React component updates (simulated timing)

## Usage

### Browser Environment

The benchmark automatically runs when loaded in a browser:

```javascript
import { MidiLatencyBenchmark } from './src/benchmarks/midi-latency-benchmark.js';

const benchmark = new MidiLatencyBenchmark();

// Run benchmark with 100 events at 10ms intervals
const stats = await benchmark.runBenchmark(100, 10);
benchmark.logResults(stats);
benchmark.dispose();
```

### Node.js Environment

For testing without a browser:

```javascript
import { runBenchmarkTest } from './src/benchmarks/test-runner.js';

// Runs a quick test with 10 events
runBenchmarkTest();
```

## Benchmark Parameters

- `eventCount`: Number of MIDI events to test (default: 100)
- `intervalMs`: Milliseconds between events (default: 10)

## Performance Targets

- **Real-time requirement**: < 50ms average end-to-end latency
- **Acceptable range**: 95th percentile < 50ms
- **Test conditions**: Multiple events with realistic timing

## Output Metrics

The benchmark reports:

- **Average latency**: Mean end-to-end time
- **Min/Max latency**: Best/worst case performance
- **Median latency**: 50th percentile
- **95th percentile**: P95 latency (critical for real-time)
- **Real-time compliance**: Percentage of events under 50ms

## Implementation Details

- Uses `performance.now()` for high-resolution timestamps
- Simulates hardware MIDI input with synthetic events
- Tests complete pipeline including worker communication
- Measures UI update timing (simulated)
- Automatically cleans up resources

## Running the Benchmark

1. Build the project: `npm run build`
2. Open the demo: `npm run dev`
3. Check browser console for benchmark results
4. Or run programmatically as shown above

## Troubleshooting

- Ensure Web Workers are supported in your browser
- Check that WebContainer can initialize (requires modern browser)
- Verify MIDI permissions if testing with real hardware
- Benchmark may take time to complete with many events