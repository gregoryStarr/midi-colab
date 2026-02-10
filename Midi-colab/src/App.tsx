import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, ContainerInput } from './lib/midi-colab/types';
import { NetworkClient } from './lib/midi-colab/network-client';
import { MidiBridge } from './lib/midi-colab/midi-bridge';
import { WebContainerEngine } from './lib/midi-colab/web-container-engine';
import { PresenceManager } from './lib/midi-colab/presence';
import { WebContainerStarter } from './WebContainerStarter';
import { VirtualPiano } from './VirtualPiano';

const WS_URL = `ws://${window.location.hostname}:1234`; // Use current host for WebSocket

function App(): JSX.Element {
  const [engine] = useState(() => WebContainerEngine.getInstance());
  const [network, setNetwork] = useState<NetworkClient | null>(null);
  const [bridge, setBridge] = useState<MidiBridge | null>(null);
  const [presence, setPresence] = useState<PresenceManager | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isWebContainerStarted, setIsWebContainerStarted] = useState(false);
  const [networkActiveKeys, setNetworkActiveKeys] = useState<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);
  const initialScript = `process.stdout.write(JSON.stringify({ processed: [{ type: 'noteon', data: [60, 127], theory: { note: 'C4', chord: 'test', harmony: 'C4 E4 G4' } }] }));`;

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(async (midiNote: number, duration: number = 0.5) => {
    const audioContext = await getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [getAudioContext]);
  const [script, setScript] = useState(`(async () => {
try {
  const fs = await import('fs/promises');
  const inputStr = await fs.readFile('input.json', 'utf8');
  const input = JSON.parse(inputStr);

  // Ultra-fast processing - just pass through the note
  const processed = [input.data];

  console.log(JSON.stringify({ processed }));
} catch (err) {
  console.log(JSON.stringify({ errors: [err.message] }));
}
})();`);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      if (!isWebContainerStarted) return;

      try {
        // Init Network
        const net = new NetworkClient(WS_URL, engine);
        net.connect();
        if (mounted) setNetwork(net);

        // Init Presence
        const pres = new PresenceManager(net);
        if (mounted) setPresence(pres);

        // Set local user
        pres.setLocalState({
          id: crypto.randomUUID(),
          name: 'User ' + Math.floor(Math.random() * 100),
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
          status: 'online'
        });

        // Listen to presence
        const offPresence = pres.onUpdate((us) => {
          if (mounted) setUsers(us);
        });

        // Init MIDI
        const brid = new MidiBridge();
        await brid.init();
        if (mounted) setBridge(brid);

        // Pipe MIDI to engine for processing
        brid.pipeToContainer(engine, (out) => {
          console.log('App: pipeToContainer received output:', out);
          if (out.processed && network) {
            console.log('App: playing local sounds for processed events');
            // Play sound for local MIDI
            out.processed.forEach((event: any) => {
              if (event.type === 'noteon' && event.data) {
                console.log('App: playing tone for midi:', event.data[0]);
                playTone(event.data[0]);
              }
            });
            console.log('App: broadcasting processed data');
            network.broadcastRaw({ type: 'midi', data: out.processed } as any);
            setLogs(prev => [...prev, `Processed: ${JSON.stringify(out.processed)}`]);
          }
          if (out.errors?.length) {
            console.log('App: processing errors:', out.errors);
            setLogs(prev => [...prev, `Error: ${out.errors.join(', ')}`]);
          }
        });

        // Listen to network logs/broadcasts
        const processedMap = net.getLogs() as any;
        console.log('App: setting up network observe on processedMap, current size:', processedMap.size);
        const offLogs = processedMap.observe((event: any) => {
          console.log('App: network observe triggered with event:', event);
          console.log('App: event.changes:', event.changes);
          event.changes.keys.forEach((change: any, key: any) => {
            console.log('App: processing change:', change.action, 'for key:', key);
            if (change.action === 'add' || change.action === 'update') {
              const log = processedMap.get(key);
              console.log('App: received network log:', log);
              setLogs(prev => [...prev, `Network: ${JSON.stringify(log)}`]);
              // Play sound for received MIDI and light up keys
              if (log.type === 'midi' && log.data) {
                console.log('App: processing network MIDI data');
                const activeNotes = new Set<number>();
                log.data.forEach((event: any) => {
                  if (event.type === 'noteon' && event.data) {
                    console.log('App: playing network tone for midi:', event.data[0]);
                    playTone(event.data[0]);
                    activeNotes.add(event.data[0]);
                  }
                });
                if (activeNotes.size > 0) {
                  console.log('App: setting network active keys:', Array.from(activeNotes));
                  setNetworkActiveKeys(activeNotes);
                  // Clear after 200ms for snappy response
                  setTimeout(() => {
                    console.log('App: clearing network active keys');
                    setNetworkActiveKeys(new Set());
                  }, 200);
                }
              }
            }
          });
        });

        // Connection status
        net.provider?.on('status', (evt) => {
          console.log('App: Yjs connection status changed to:', evt.status);
          setIsConnected(evt.status === 'connected');
        });

        return () => {
          offPresence();
          offLogs;
        };
      } catch (err) {
        console.error('Init failed:', err);
        setLogs(prev => [...prev, `Init error: ${err}`]);
      }
    };

    if (isWebContainerStarted) {
      initApp();
    }

    return () => {
      mounted = false;
      network?.disconnect();
    };
  }, [isWebContainerStarted]);

  const loadScriptHandler = async () => {
    if (!isWebContainerStarted) return;
    try {
      await engine.loadScript({ code: script });
      setLogs(prev => [...prev, 'Script loaded and ready for processing']);
    } catch (err) {
      setLogs(prev => [...prev, `Load script error: ${err}`]);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Axial Cluster: MIDI Colab Demo</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'} | Engine: {isWebContainerStarted ? 'Ready' : 'Not Started'}</p>

      <WebContainerStarter
        script={script}
        onStarted={() => setIsWebContainerStarted(true)}
        onError={(error) => setLogs(prev => [...prev, `WebContainer error: ${error}`])}
      />

      <button onClick={() => playTone(60)}>Test Sound</button>

      <section>
        <h2>Online Users</h2>
        <ul style={{ listStyle: 'none' }}>
          {users.map((u) => (
            <li key={u.id} style={{ color: u.color, margin: '5px 0' }}>
              {u.name} ({u.status})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Event Logs</h2>
        <ul style={{ maxHeight: '200px', overflowY: 'scroll', border: '1px solid #ccc', padding: '10px' }}>
          {logs.slice(-10).map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Custom Processor Script</h2>
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={15}
          cols={80}
          style={{ fontFamily: 'monospace', marginBottom: '10px' }}
          placeholder="Write your Node.js script here..."
        />
        <br />
        <button onClick={loadScriptHandler} disabled={!isWebContainerStarted}>
          Load & Compile Script
        </button>
      </section>

      <section>
        <h2>MIDI Devices</h2>
        {bridge ? (
          <ul>
            {bridge.getInputs().map((input) => (
              <li key={input.id}>{input.name} - {input.connection}</li>
            ))}
          </ul>
        ) : (
          <p>Initializing MIDI...</p>
        )}
        <p>Grant MIDI access in browser console if prompted. Play notes to see processing in logs.</p>
      </section>

      {isWebContainerStarted && (
        <section>
          <h2>Collaboration Test</h2>
          <div style={{ fontFamily: 'monospace', padding: '10px', background: '#f5f5f5', borderRadius: '5px' }}>
            <div>Network Active Keys: {Array.from(networkActiveKeys).map(midi => {
              const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
              const octave = Math.floor(midi / 12) - 1;
              return notes[midi % 12] + octave;
            }).join(', ')}</div>
            <div style={{ marginTop: '10px', color: '#666' }}>
              Play piano keys - this should update when other users play!
            </div>
          </div>
        </section>
      )}

      {isWebContainerStarted && (
        <section>
          <h2>Virtual Piano</h2>
          <VirtualPiano
            engine={engine}
            networkActiveKeys={networkActiveKeys}
            onProcessed={async (output) => {
              if (output.processed) {
                setLogs(prev => [...prev, `Processed: ${JSON.stringify(output.processed)}`]);
                // Broadcast processed MIDI to network
                if (network) {
                  try {
                    network.broadcastRaw({
                      type: 'midi',
                      data: output.processed
                    });
                    console.log('App: broadcast processed MIDI to network');
                  } catch (err) {
                    console.error('App: failed to broadcast processed MIDI:', err);
                  }
                }
              }
              if (output.errors?.length) {
                setLogs(prev => [...prev, `Error: ${output.errors.join(', ')}`]);
              }
            }}
          />
        </section>
      )}
    </div>
  );
}

export default App;