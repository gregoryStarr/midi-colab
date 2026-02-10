// Web Worker for MIDI event interception and routing
// Prevents main thread blocking by handling MIDI event processing asynchronously

interface MidiEvent {
  type: 'noteon' | 'noteoff' | 'cc';
  data: number[];
  timestamp: number;
  source: string;
}

interface WorkerMessage {
  type: 'midi-event' | 'init' | 'stop';
  data?: MidiEvent;
  config?: {
    throttleMs?: number;
    filterTypes?: ('noteon' | 'noteoff' | 'cc')[];
  };
}

interface RoutedMidiEvent extends MidiEvent {
  routed: boolean;
  priority: 'high' | 'normal' | 'low';
}

let throttleMs = 10; // Default throttle to prevent overwhelming
let filterTypes: ('noteon' | 'noteoff' | 'cc')[] = ['noteon', 'noteoff', 'cc'];
let lastProcessedTime = 0;
let isActive = false;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, data, config } = e.data;

  switch (type) {
    case 'init':
      if (config) {
        throttleMs = config.throttleMs || throttleMs;
        filterTypes = config.filterTypes || filterTypes;
      }
      isActive = true;
      self.postMessage({ type: 'initialized' });
      break;

    case 'stop':
      isActive = false;
      self.postMessage({ type: 'stopped' });
      break;

    case 'midi-event':
      if (!isActive || !data) return;

      const routedEvent = processMidiEvent(data);
      if (routedEvent) {
        // Apply throttling to prevent main thread blocking
        const now = Date.now();
        if (now - lastProcessedTime >= throttleMs) {
          lastProcessedTime = now;
          self.postMessage({
            type: 'routed-midi-event',
            data: routedEvent
          });
        }
      }
      break;
  }
};

function processMidiEvent(event: MidiEvent): RoutedMidiEvent | null {
  // Filter events based on configured types
  if (!filterTypes.includes(event.type)) {
    return null;
  }

  // Determine priority based on event type
  let priority: 'high' | 'normal' | 'low' = 'normal';
  if (event.type === 'noteon') {
    priority = 'high'; // Note on events are most important
  } else if (event.type === 'cc') {
    priority = 'low'; // CC events can be lower priority
  }

  // Apply routing logic (could be extended for more complex rules)
  const routedEvent: RoutedMidiEvent = {
    ...event,
    routed: true,
    priority
  };

  return routedEvent;
}

// Keep worker alive
setInterval(() => {
  // Heartbeat to prevent worker termination
}, 30000);