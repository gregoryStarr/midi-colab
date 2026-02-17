# MIDI Colab Library

`midi-colab` is a modular TypeScript library designed for building real-time collaborative MIDI applications in the browser. It combines Web MIDI, Yjs for CRDT-based state synchronization, and WebContainers for isolated code execution.

## Features

- **MIDI Device Management**: Streamlined interface for Web MIDI API (inputs, outputs, event listeners).
- **Real-time Collaboration**: Sync state (chat, logs, files, presence) across clients using Yjs & WebSockets.
- **Offline-First**: Robust offline support using IndexedDB to queue operations and sync when back online.
- **Isomorphic Code Execution**: Run Node.js scripts directly in the browser using WebContainers to process MIDI data.
- **Typed API**: Fully written in TypeScript with comprehensive type definitions.

## Installation

```bash
npm install midi-colab
# Peer dependencies
npm install yjs y-websocket webmidi @webcontainer/api
```

## Core Modules

### 1. MidiBridge

Manages physical and virtual MIDI devices.

```typescript
import { MidiBridge } from "midi-colab";

const midi = new MidiBridge();

// Initialize (requests browser permission)
await midi.init();

// Listen for MIDI events from all inputs
midi.onEvent((event) => {
  console.log("MIDI Event:", event.type, event.data);
});

// Send MIDI data
// Note On: Channel 1, Note 60 (C4), Velocity 127
const noteOn = { type: "noteon", data: [0x90, 60, 127], timestamp: Date.now() };
midi.send(noteOn);
```

### 2. NetworkClient

Handles real-time sync, rooms, and presence.

```typescript
import { NetworkClient } from "midi-colab";

// Connect to a WebSocket server
const client = new NetworkClient("ws://localhost:1234");
await client.connect();

// Set local user presence
client.setLocalUser({ id: "user1", name: "Alice", color: "#ff0000" });

// Listen for other users
client.onPresenceChange((users) => {
  console.log("Online users:", users);
});

// Send a chat message (offline-supported)
await client.sendMessageOfflineFirst("Hello world!");

// Broadcast MIDI events to other users
client.broadcastRaw({ type: "midi", data: someMidiEvent });

// Listen for remote MIDI events
client.onMidiEvent((data, clientId) => {
  console.log(`Received MIDI from ${clientId}:`, data);
});
```

### 3. WebContainerEngine

Run Node.js scripts in the browser to process MIDI data.

```typescript
import { WebContainerEngine } from "midi-colab";

const engine = WebContainerEngine.getInstance();
await engine.start();

// Load a processing script
await engine.loadScript({
  code: `
    import { Note } from "tonal";
    
    // Simple transposer script
    console.log(JSON.stringify({ 
      processed: true, 
      note: "C4" 
    }));
  `,
});

// Process data
const result = await engine.process({ type: "midi", data: event });
console.log(result);
```

## Use Cases

### Real-time Jam Session

Connect multiple users in a "room". Use `NetworkClient` to sync presence and broadcast MIDI events. One user plays a note on their keyboard, `MidiBridge` captures it, `NetworkClient` broadcasts it, and other users' browsers receive it and play the sound.

### Collaborative MIDI Processing

Users can write Node.js scripts (using `tonal` or other libraries) to transform MIDI data in real-time. The `WebContainerEngine` executes this code safely in the browser. You can even sync these scripts across clients using `NetworkClient`'s file sharing capabilities.

### Offline MIDI Logger

Even without an internet connection, `midi-colab` uses `storage.ts` (IndexedDB) to log MIDI events and chat messages. When the connection is restored, `NetworkClient` automatically syncs the offline queue with the server.

## Dependencies

- **webmidi**: Wrapper for the Web MIDI API.
- **yjs & y-websocket**: CRDT-based state synchronization.
- **@webcontainer/api**: Browser-based Node.js runtime.
- **tonal**: Music theory library (used in default processing environment).

## Developing & Publishing

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the demo server**:
   ```bash
   npm run dev
   ```
   This will start a local server where you can test the library in the context of the demo application.

### Building

To build the library for production (outputs to `dist/`):

```bash
npm run build
```

This runs the TypeScript compiler and Vite in library mode to generate UMD and ES module bundles.

### Publishing to npm

1. **Login to npm** (if not already logged in):
   ```bash
   npm login
   ```
2. **Update version**:
   Update the `version` field in `package.json`.
3. **Build the package**:
   ```bash
   npm run build
   ```
4. **Publish**:
   ```bash
   npm publish --access public
   ```

> **Note**: Make sure to update the `name` field in `package.json` if you are publishing a fork or a new package, as `midi-colab` might already be taken.
