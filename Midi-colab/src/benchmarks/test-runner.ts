// Simple test runner for the MIDI latency benchmark
// This can be run in Node.js or browser environment

import { MidiLatencyBenchmark } from './midi-latency-benchmark.js';

async function runBenchmarkTest() {
  console.log('Testing MIDI Latency Benchmark...');

  const benchmark = new MidiLatencyBenchmark();

  try {
    // Run a quick test with fewer events
    const stats = await benchmark.runBenchmark(10, 50); // 10 events, 50ms intervals
    benchmark.logResults(stats);

    console.log('✅ Benchmark test completed successfully');
  } catch (error) {
    console.error('❌ Benchmark test failed:', error);
  } finally {
    benchmark.dispose();
  }
}

// Run if this script is executed directly
if (typeof process !== 'undefined' && process.argv) {
  // Node.js environment
  runBenchmarkTest();
} else if (typeof window !== 'undefined') {
  // Browser environment - run on load
  window.addEventListener('load', runBenchmarkTest);
}

export { runBenchmarkTest };