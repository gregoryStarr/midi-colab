/*
 * Welcome to @webcontainer/api!
 * This file bootstraps your WebContainer-based environment. Learn more here: https://webcontainer.io/api
 */

import { WebContainer } from '@webcontainer/api';

const webcontainerInstance = await WebContainer.boot();

await webcontainerInstance.ready;

await webcontainerInstance.mount({
  'package.json': {
    name: 'midi-collab-server',
    version: '1.0.0',
    type: 'module',
    dependencies: {},
    scripts: {
      start: 'node server.js'
    }
  },
  'server.js': {
    file: {
      contents: `
import { WebsocketProvider } from 'y-websocket';
import * as http from 'http';
import * as WebSocket from 'ws';

const server = http.createServer((request, response) => {
  response.writeHead(200, {
    'Content-Type': 'text/plain',
  });
  response.end('Yjs WebSocket Server running on port 1234');
});

const wss = new WebSocket.Server({ server });

const yWebsocket = new WebsocketProvider('ws://localhost:1234', 'room', new Y.Doc(), { WebSocketPolyfill: WebSocket });
yWebsocket.ws.on('connection', (conn, req) => {
  console.log('Client connected');
});

server.listen(1234, () => {
  console.log('Yjs server running on port 1234');
});
      `.trim()
    }
  },
  'node_modules/': {
    dir: {
      'y-websocket': {
        file: {
          contents: '' // Mount actual if needed, but for POC assume installed
        }
      },
      'yjs': {},
      'ws': {}
    }
  }
});

await webcontainerInstance.spawn('npm', ['install', 'y-websocket', 'yjs', 'ws']);

const process = await webcontainerInstance.spawn('npm', ['start']);

process.output.pipeTo(new WritableStream({
  write(data) {
    console.log(data);
  }
}));

// This is a placeholder for the y-websocket server in WebContainer for demo purposes.
// In production, deploy a Node.js y-websocket server separately (e.g., on Cloudflare Workers or Vercel).