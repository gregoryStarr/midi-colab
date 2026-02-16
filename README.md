# MIDI-Colab: Modular MIDI Collaboration Library

## Overview

A type-safe TypeScript library for collaborative MIDI processing, leveraging Yjs for real-time sync, WebMIDI for input, Tonal for music theory, and StackBlitz WebContainers for extensible, sandboxed script execution. Includes a React demo app deployable to Cloudflare Pages.

### Key Features

- **Presence & Sync**: Real-time user tracking and event broadcasting via Yjs.
- **MIDI Handling**: Browser MIDI input/output with event normalization.
- **Containerized Processing**: Offload 80%+ of logic (analysis, effects) to user scripts in WebContainers.
- **Demo**: React UI for users, logs, script loading, and MIDI viz.

## Installation

### Library (NPM)

\`\`\`bash
npm install midi-colab
\`\`\`

### Usage

#### Basic Setup

\`\`\`ts
import { NetworkClient, MidiBridge, WebContainerEngine, PresenceManager } from 'midi-colab';

// Initialize the WebContainer engine for script processing
const engine = new WebContainerEngine();
await engine.start();

// Load a custom MIDI processing script
await engine.loadScript({
code: `     // Example: Simple chord detection
    export async function processMidi(input) {
      if (input.type === 'midi' && input.data) {
        // Your MIDI processing logic here
        return { processed: input.data };
      }
      return {};
    }
  `
});

// Initialize MIDI bridge
const bridge = new MidiBridge();
await bridge.init();

// Connect to collaborative session
const client = new NetworkClient('ws://your-server.com');
await client.connect();

// Set up presence tracking
const presence = new PresenceManager(client);
presence.setLocalUser({
id: 'user-1',
name: 'Musician',
color: '#ff6b6b'
});
\`\`\`

#### Processing MIDI Events

\`\`\`ts
// Listen for MIDI events and process them
bridge.onEvent(async (midiEvent) => {
try {
// Process through WebContainer script
const result = await engine.process({
type: 'midi',
data: midiEvent
});

    // Broadcast processed result to other users
    await client.broadcastProcessed({
      type: 'midi',
      data: result.processed
    });

} catch (error) {
console.error('Processing error:', error);
}
});
\`\`\`

#### Real-time Collaboration

\`\`\`ts
// Listen for presence updates
client.onPresenceChange((users) => {
console.log('Online users:', users);
});

// Send chat messages
client.sendMessage('Hello collaborators!');

// Get chat history
const messages = client.getChatMessages();
\`\`\`

### Demo Setup

1. Clone repo.
2. \`npm install\`
3. Start y-websocket server (separate): \`npx y-websocket --port 1234\`
4. \`npm run dev\` (HTTPS for containers/MIDI).
5. Open http://localhost:3000 – grant MIDI, load script, test multi-tab.

## Deployment

### Publishing to NPM

\`\`\`bash

# Build the library

npm run build

# Test the package locally (optional)

npm pack --dry-run

# Publish to NPM

npm publish
\`\`\`

### Demo Deployment (Cloudflare Pages)

1. \`npm run build:demo\`
2. \`npx wrangler pages deploy dist-demo --project-name your-project-name\`
3. Headers are auto-applied via wrangler.toml for WebContainer support.

### Development Server

\`\`\`bash

# Start development server with hot reload

npm run dev

# Start Yjs WebSocket server for collaboration (in separate terminal)

npm run server
\`\`\`

## Architecture

- **Core Modules**: See \`src/lib/midi-colab/\`.
- **Types**: Strict interfaces for events/users.
- **Scripts**: Node.js in container; example processes MIDI to harmony with Tonal.

## Verification

- **Local**: Multi-tab presence/MIDI broadcast.
- **Container**: Load script, play note – see processed output in logs.
- **Edge**: Offline fallback, device hotplug.

## Next Steps

- Deploy y-websocket to Cloudflare Workers.
- Add auth/persistence (Yjs + IndexedDB).
- Tests: Vitest for units, Playwright for E2E.
- Examples: More scripts (quantization, effects).

For issues: https://github.com/your-repo/issues

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
