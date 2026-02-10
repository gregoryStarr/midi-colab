#!/usr/bin/env node

import pkg from 'ws';
const { Server } = pkg;
import { setupWSConnection } from 'y-websocket/bin/utils';

console.log('🚀 Starting MIDI Colab WebSocket Server with enhanced logging...');
console.log('📡 Listening on port 1234');
console.log('🎵 Room: midi-collab-room');

const wss = new Server({ port: 1234 });

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const timestamp = new Date().toISOString();

  console.log(`🔗 [${timestamp}] New connection from ${ip}`);
  console.log(`   User-Agent: ${userAgent}`);
  console.log(`   Total connections: ${wss.clients.size}`);

  ws.on('message', (message) => {
    try {
      // Log message size and type for debugging
      let msgSize = 'unknown';
      let msgType = 'unknown';

      if (typeof message === 'string') {
        msgSize = message.length;
        msgType = 'text';
      } else if (message instanceof ArrayBuffer) {
        msgSize = message.byteLength;
        msgType = 'binary';
      } else if (message instanceof Buffer) {
        msgSize = message.length;
        msgType = 'buffer';
      }

      console.log(`📨 [${new Date().toISOString()}] ${msgType} message received (${msgSize} bytes) from ${ip}`);

      // Try to parse as JSON for more detailed logging
      try {
        const data = JSON.parse(message.toString());
        if (data?.type === 'sync' || data?.type === 'awareness') {
          console.log(`   Type: ${data.type}, Room: ${data.room || 'unknown'}`);
        }
      } catch (parseError) {
        // Binary message, just log size
      }
    } catch (error) {
      console.log(`❌ [${new Date().toISOString()}] Error logging message: ${error}`);
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`👋 [${new Date().toISOString()}] Connection closed from ${ip}`);
    console.log(`   Code: ${code}, Reason: ${reason.toString() || 'No reason'}`);
    console.log(`   Remaining connections: ${wss.clients.size - 1}`);
  });

  ws.on('error', (error) => {
    console.error(`❌ [${new Date().toISOString()}] WebSocket error from ${ip}:`, error);
  });

  // Setup Yjs connection with logging
  setupWSConnection(ws, req, { gc: true });
});

wss.on('error', (error) => {
  console.error('❌ WebSocket Server Error:', error);
});

console.log('✅ MIDI Colab WebSocket Server ready!');
console.log('💡 Open multiple browser tabs to https://localhost:3001 to test collaboration');
console.log('🔍 Watch the logs above for connection and message activity');