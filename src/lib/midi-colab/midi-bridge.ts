import { WebMidi } from 'webmidi';
import type { Input, Output } from 'webmidi';
import type { MidiEvent, ContainerInput } from './types';
import type { WebContainerEngine } from './web-container-engine';

/**
 * Manages MIDI entry/exit points and device connections.
 * 
 * The MidiBridge class uses the Web MIDI API to interact with physical
 * and virtual MIDI devices. It handles device connection/disconnection events,
 * routes MIDI messages, and provides a streamlined interface for sending
 * and receiving MIDI data.
 */
export class MidiBridge {
  private inputs: Input[] = [];
  private outputs: Output[] = [];
  private eventCallbacks: ((event: MidiEvent) => void)[] = [];

  /**
   * Initializes the MIDI subsystem.
   * Requests MIDI access from the browser and sets up event listeners
   * for device connection changes.
   * 
   * @throws Will throw an error if MIDI access is denied or unavailable.
   */
  async init(): Promise<void> {
    try {
      await WebMidi.enable();
      WebMidi.addListener('connected', (e: any) => this.onDeviceConnected(e));
      WebMidi.addListener('disconnected', (e: any) => this.onDeviceDisconnected(e));
      this.inputs = [...WebMidi.inputs];
      this.outputs = [...WebMidi.outputs];
      this.setupListeners();
    } catch (err) {
      console.error('MIDI access denied:', err);
      throw err;
    }
  }

  private onDeviceConnected(e: { port: Input | Output }) {
    if (e.port.type === 'input') {
      this.inputs.push(e.port as Input);
      this.setupInputListener(e.port as Input);
    } else if (e.port.type === 'output') {
      this.outputs.push(e.port as Output);
    }
  }

  private onDeviceDisconnected(e: { port: Input | Output }) {
    this.inputs = this.inputs.filter(i => i !== e.port);
    this.outputs = this.outputs.filter(o => o !== e.port);
  }

  private setupListeners() {
    this.inputs.forEach(input => this.setupInputListener(input));
  }

  private setupInputListener(input: Input) {
    input.addListener('midimessage', (e: any) => {
      const message = e.message;
      const event: MidiEvent = {
        type: this.getMessageType(message.data),
        data: Array.from(message.data),
        timestamp: Date.now(),
        source: input.name || 'unknown'
      };
      this.eventCallbacks.forEach(cb => cb(event));
    });
  }

  private getMessageType(data: Uint8Array | number[]): 'noteon' | 'noteoff' | 'cc' {
    const status = data[0] & 0xf0;
    switch (status) {
      case 0x80: return 'noteoff';
      case 0x90: return 'noteon';
      case 0xb0: return 'cc';
      default: return 'noteon'; // fallback
    }
  }

  /**
   * Subscribes to incoming MIDI events from all connected inputs.
   * 
   * @param cb Callback function to be executed when a MIDI event occurs.
   */
  onEvent(cb: (event: MidiEvent) => void) {
    this.eventCallbacks.push(cb);
  }

  /**
   * Unsubscribes from MIDI events.
   * 
   * @param cb The callback function to remove.
   */
  offEvent(cb: (event: MidiEvent) => void) {
    const index = this.eventCallbacks.indexOf(cb);
    if (index > -1) this.eventCallbacks.splice(index, 1);
  }

  /**
   * Returns a list of currently connected MIDI input devices.
   */
  getInputs(): Input[] {
    return this.inputs;
  }

  /**
   * Returns a list of currently connected MIDI output devices.
   */
  getOutputs(): Output[] {
    return this.outputs;
  }

  /**
   * Selects a specific MIDI input device by name.
   * 
   * @param name The name of the input device.
   * @returns The Input object if found, or null otherwise.
   */
  selectInput(name: string): Input | null {
    return this.inputs.find(i => i.name === name) || null;
  }

  /**
   * Sends a MIDI event to a specific output device.
   * If no output name is provided, sends to the first available output.
   * 
   * @param event The MIDI event to send.
   * @param outputName Optional name of the output device to target.
   */
  send(event: MidiEvent, outputName?: string) {
    const output = outputName ? this.outputs.find(o => o.name === outputName) : this.outputs[0];
    if (output) {
      output.send(new Uint8Array(event.data));
    }
  }

  /**
   * Pipes incoming MIDI events to a WebContainerEngine for processing.
   * The processed output can be handled via the optional callback.
   * 
   * @param engine The WebContainerEngine instance.
   * @param cb Optional callback for handling the processed output.
   */
  async pipeToContainer(engine: WebContainerEngine, cb?: (output: any) => void) {
    this.onEvent(async (event) => {
      const input: ContainerInput = { type: 'midi', data: event };
      const output = await engine.process(input);
      cb?.(output);
    });
  }
}