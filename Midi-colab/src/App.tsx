import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, ContainerInput } from './lib/midi-colab/types';
import { NetworkClient } from './lib/midi-colab/network-client';
import { MidiBridge } from './lib/midi-colab/midi-bridge';
import { WebContainerEngine } from './lib/midi-colab/web-container-engine';
import { PresenceManager } from './lib/midi-colab/presence';
import { WebContainerStarter } from './WebContainerStarter';
import { VirtualPiano } from './VirtualPiano';
import {
  Header,
  HeroSection,
  EngineControl,
  SoundSelection,
  ActivityFeed,
  PianoSection
} from './components';

type SoundType = 'piano' | 'electric-guitar' | 'sax' | 'synth' | 'hard-synth' | 'synth-bass';

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
  const [soundType, setSoundType] = useState<SoundType>('piano');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Righteous&display=swap');

          .font-display {
            font-family: 'Righteous', cursive;
          }

          .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite alternate;
          }

          @keyframes pulse-glow {
            from { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
            to { box-shadow: 0 0 30px rgba(139, 92, 246, 0.6); }
          }

          .glass-card {
            backdrop-filter: blur(16px);
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
        `
      }} />

      <Header isConnected={isConnected} isWebContainerStarted={isWebContainerStarted} />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <HeroSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <EngineControl
            script={script}
            isWebContainerStarted={isWebContainerStarted}
            onStarted={() => setIsWebContainerStarted(true)}
            onError={(error) => setLogs(prev => [...prev, `WebContainer error: ${error}`])}
            onTestSound={() => playTone(60)}
          />

          <SoundSelection
            soundType={soundType}
            onSoundTypeChange={setSoundType}
          />

          <ActivityFeed
            logs={logs}
            networkActiveKeys={networkActiveKeys}
            users={users}
          />
        </div>

        <PianoSection
          engine={engine}
          networkActiveKeys={networkActiveKeys}
          soundType={soundType}
          isWebContainerStarted={isWebContainerStarted}
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
      </main>
    </div>
  );
}

export default App;