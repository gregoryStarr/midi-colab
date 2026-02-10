import type { Input, Output } from 'webmidi';
import type { MidiEvent } from './types';
import type { WebContainerEngine } from './web-container-engine';
export declare class MidiBridge {
    private inputs;
    private outputs;
    private eventCallbacks;
    init(): Promise<void>;
    private onDeviceConnected;
    private onDeviceDisconnected;
    private setupListeners;
    private setupInputListener;
    private getMessageType;
    onEvent(cb: (event: MidiEvent) => void): void;
    offEvent(cb: (event: MidiEvent) => void): void;
    getInputs(): Input[];
    getOutputs(): Output[];
    selectInput(name: string): Input | null;
    send(event: MidiEvent, outputName?: string): void;
    pipeToContainer(engine: WebContainerEngine, cb?: (output: any) => void): Promise<void>;
}
//# sourceMappingURL=midi-bridge.d.ts.map