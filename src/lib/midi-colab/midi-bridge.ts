import { WebMidi } from 'webmidi';
import type { Input, Output } from 'webmidi';
import type { MidiEvent, ContainerInput } from './types';
import type { WebContainerEngine } from './web-container-engine';

export class MidiBridge {
  private inputs: Input[] = [];
  private outputs: Output[] = [];
  private eventCallbacks: ((event: MidiEvent) => void)[] = [];

  async init(): Promise<void> {
    try {
      await WebMidi.enable();
      WebMidi.addListener('connected', (e) => this.onDeviceConnected(e));
      WebMidi.addListener('disconnected', (e) => this.onDeviceDisconnected(e));
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
    input.addListener('midimessage', (e) => {
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

  onEvent(cb: (event: MidiEvent) => void) {
    this.eventCallbacks.push(cb);
  }

  offEvent(cb: (event: MidiEvent) => void) {
    const index = this.eventCallbacks.indexOf(cb);
    if (index > -1) this.eventCallbacks.splice(index, 1);
  }

  getInputs(): Input[] {
    return this.inputs;
  }

  getOutputs(): Output[] {
    return this.outputs;
  }

  selectInput(name: string): Input | null {
    return this.inputs.find(i => i.name === name) || null;
  }

  send(event: MidiEvent, outputName?: string) {
    const output = outputName ? this.outputs.find(o => o.name === outputName) : this.outputs[0];
    if (output) {
      output.send(new Uint8Array(event.data));
    }
  }

  async pipeToContainer(engine: WebContainerEngine, cb?: (output: any) => void) {
    this.onEvent(async (event) => {
      const input: ContainerInput = { type: 'midi', data: event };
      const output = await engine.process(input);
      cb?.(output);
    });
  }
}