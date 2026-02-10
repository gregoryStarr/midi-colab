import { WebMidi } from 'webmidi';
export class MidiBridge {
    constructor() {
        this.inputs = [];
        this.outputs = [];
        this.eventCallbacks = [];
    }
    async init() {
        try {
            await WebMidi.enable();
            WebMidi.addListener('connected', (e) => this.onDeviceConnected(e));
            WebMidi.addListener('disconnected', (e) => this.onDeviceDisconnected(e));
            this.inputs = [...WebMidi.inputs];
            this.outputs = [...WebMidi.outputs];
            this.setupListeners();
        }
        catch (err) {
            console.error('MIDI access denied:', err);
            throw err;
        }
    }
    onDeviceConnected(e) {
        if (e.port.type === 'input') {
            this.inputs.push(e.port);
            this.setupInputListener(e.port);
        }
        else if (e.port.type === 'output') {
            this.outputs.push(e.port);
        }
    }
    onDeviceDisconnected(e) {
        this.inputs = this.inputs.filter(i => i !== e.port);
        this.outputs = this.outputs.filter(o => o !== e.port);
    }
    setupListeners() {
        this.inputs.forEach(input => this.setupInputListener(input));
    }
    setupInputListener(input) {
        input.addListener('midimessage', (e) => {
            const message = e.message;
            const event = {
                type: this.getMessageType(message.data),
                data: Array.from(message.data),
                timestamp: Date.now(),
                source: input.name || 'unknown'
            };
            this.eventCallbacks.forEach(cb => cb(event));
        });
    }
    getMessageType(data) {
        const status = data[0] & 0xf0;
        switch (status) {
            case 0x80: return 'noteoff';
            case 0x90: return 'noteon';
            case 0xb0: return 'cc';
            default: return 'noteon'; // fallback
        }
    }
    onEvent(cb) {
        this.eventCallbacks.push(cb);
    }
    offEvent(cb) {
        const index = this.eventCallbacks.indexOf(cb);
        if (index > -1)
            this.eventCallbacks.splice(index, 1);
    }
    getInputs() {
        return this.inputs;
    }
    getOutputs() {
        return this.outputs;
    }
    selectInput(name) {
        return this.inputs.find(i => i.name === name) || null;
    }
    send(event, outputName) {
        const output = outputName ? this.outputs.find(o => o.name === outputName) : this.outputs[0];
        if (output) {
            output.send(new Uint8Array(event.data));
        }
    }
    async pipeToContainer(engine, cb) {
        this.onEvent(async (event) => {
            const input = { type: 'midi', data: event };
            const output = await engine.process(input);
            cb?.(output);
        });
    }
}
//# sourceMappingURL=midi-bridge.js.map