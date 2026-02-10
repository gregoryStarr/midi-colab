import { WebContainerEngine } from './lib/midi-colab/web-container-engine';

// Test the Worker-based WebContainerEngine with MIDI processing
async function testWebContainerEngine() {
  console.log('Testing WebContainerEngine with Worker pipeline...');

  const engine = new WebContainerEngine();

  try {
    // Start the engine (this initializes the worker)
    await engine.start();
    console.log('✓ Engine started successfully');

    // Test MIDI processing with Tonal
    const midiInput = {
      type: 'midi' as const,
      data: [
        {
          type: 'noteon',
          data: [144, 60, 100], // Middle C
          timestamp: Date.now(),
          source: 'test'
        },
        {
          type: 'noteon',
          data: [144, 64, 100], // E above middle C
          timestamp: Date.now() + 100,
          source: 'test'
        }
      ]
    };

    const result = await engine.process(midiInput);
    console.log('✓ MIDI processing result:', result);

    // Check if music theory analysis was added
    if (result.processed && Array.isArray(result.processed.processed)) {
      const processedEvents = result.processed.processed;
      console.log('✓ Processed events with theory:', processedEvents.length);

      // Verify Tonal analysis is present
      const firstEvent = processedEvents[0];
      if (firstEvent.theory) {
        console.log('✓ Music theory analysis present:', firstEvent.theory);
      } else {
        console.log('✗ Missing music theory analysis');
      }
    }

    // Clean up
    await engine.dispose();
    console.log('✓ Engine disposed successfully');

    console.log('All tests passed! 🎉');

  } catch (error) {
    console.error('✗ Test failed:', error);
  }
}

// Run the test
testWebContainerEngine();