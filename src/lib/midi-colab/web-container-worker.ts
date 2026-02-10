import type { ContainerInput, MidiEvent } from './types';

// Worker message handling for MIDI interception and proxying
interface WorkerMessage {
  type: 'interceptMidi' | 'processMidi';
  data?: any;
  id?: string;
}

class MidiInterceptorWorker {
  private midiStream: MidiEvent[] = [];

  constructor() {
    this.setupMessageHandler();
  }

  private setupMessageHandler(): void {
    self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
      const { type, data, id } = event.data;

      try {
        switch (type) {
          case 'interceptMidi':
            // Buffer MIDI events
            this.midiStream.push(data);
            // Throttle processing - send batch every 10ms
            if (this.midiStream.length >= 1) {
              this.processMidiBatch();
            }
            break;

          case 'processMidi':
            // Proxy to main thread for WebContainer processing
            self.postMessage({
              type: 'midiBatch',
              data: this.midiStream.splice(0),
              id
            });
            break;

          default:
            throw new Error(`Unknown message type: ${type}`);
        }

      } catch (error) {
        self.postMessage({
          type: 'error',
          error: error instanceof Error ? error.message : String(error),
          id
        });
      }
    };
  }

  private processMidiBatch(): void {
    if (this.midiStream.length > 0) {
      self.postMessage({
        type: 'midiBatch',
        data: this.midiStream.splice(0)
      });
    }
  }

}

// Initialize worker
new MidiInterceptorWorker();