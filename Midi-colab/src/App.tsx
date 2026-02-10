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
  const audioContextRef = useRef<AudioContext | null>(null);
  const initialScript = 'console.log("ok")';

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
  const [script, setScript] = useState(`console.log("ok")`);
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
          console.log('Container output:', out);
          if (out.processed && network) {
            // Play sound for local MIDI
            out.processed.forEach((event: any) => {
              if (event.type === 'noteon' && event.data) {
                playTone(event.data[0]);
              }
            });
            network.broadcastProcessed({ type: 'midi', data: out.processed } as ContainerInput);
            setLogs(prev => [...prev, `Processed: ${JSON.stringify(out.processed)}`]);
          }
          if (out.errors?.length) {
            setLogs(prev => [...prev, `Error: ${out.errors.join(', ')}`]);
          }
        });

        // Listen to network logs/broadcasts
        const offLogs = net.getLogs().forEach((log: any) => {
          setLogs(prev => [...prev, `Network: ${JSON.stringify(log)}`]);
          // Play sound for received MIDI
          if (log.type === 'midi' && log.data) {
            log.data.forEach((event: any) => {
              if (event.type === 'noteon' && event.data) {
                playTone(event.data[0]);
              }
            });
          }
        });

        // Connection status
        net.provider?.on('status', (evt) => {
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
          <h2>Virtual Piano</h2>
          <VirtualPiano
            engine={engine}
            onProcessed={(output) => {
              if (output.processed) {
                setLogs(prev => [...prev, `Processed: ${JSON.stringify(output.processed)}`]);
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