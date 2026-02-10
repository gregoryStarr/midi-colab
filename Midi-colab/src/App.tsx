import { useState, useEffect, useRef, useCallback } from 'react';
import type { User } from './lib/midi-colab/types';
import { NetworkClient } from './lib/midi-colab/network-client';
import { MidiBridge } from './lib/midi-colab/midi-bridge';
import { WebContainerEngine } from './lib/midi-colab/web-container-engine';
import { PresenceManager } from './lib/midi-colab/presence';
import { VirtualPiano } from './VirtualPiano';
import { WebContainerStarter } from './WebContainerStarter';
import { Header } from './components';

type SoundType = 'piano' | 'electric-guitar' | 'sax' | 'synth' | 'hard-synth' | 'synth-bass';

const WS_URL = `ws://${window.location.hostname}:1234`; // Use current host for WebSocket

function App(): JSX.Element {
  const [engine] = useState(() => WebContainerEngine.getInstance());
  const [network, setNetwork] = useState<NetworkClient | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isWebContainerStarted, setIsWebContainerStarted] = useState(false);
  const [networkActiveKeys, setNetworkActiveKeys] = useState<Set<number>>(new Set());
  const [soundType, setSoundType] = useState<SoundType>('piano');
  const audioContextRef = useRef<AudioContext | null>(null);

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
  const [script] = useState(`(async () => {
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
        net.getProvider()?.on('status', (evt: { status: string }) => {
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



  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col overflow-hidden" style={{ fontFamily: "'Poppins', sans-serif" }}>
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
            box-shadow:
              0 8px 32px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          .glass-card:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
            box-shadow:
              0 12px 40px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
          }

          .gradient-border {
            position: relative;
            background: linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
            border-radius: 1rem;
            padding: 1px;
          }

          .gradient-border::before {
            content: '';
            position: absolute;
            inset: 0;
            padding: 1px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: inherit;
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
          }

          .neon-glow {
            box-shadow:
              0 0 20px rgba(139, 92, 246, 0.3),
              0 0 40px rgba(139, 92, 246, 0.2),
              0 0 60px rgba(139, 92, 246, 0.1);
          }

          .floating-animation {
            animation: float 3s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }

          .shimmer {
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.1) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            background-size: 200% 100%;
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          .sidebar-transition {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .piano-key-white {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            border: 1px solid #e2e8f0;
            border-radius: 0 0 4px 4px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.1s ease;
          }

          .piano-key-white:hover {
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
          }

          .piano-key-white.active {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            transform: translateY(0);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .piano-key-black {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border: 1px solid #334155;
            border-radius: 0 0 3px 3px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            transition: all 0.1s ease;
          }

          .piano-key-black:hover {
            background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
          }

          .piano-key-black.active {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            transform: translateY(0);
            box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.4);
          }

          /* New animations for enhanced components */

          .animate-gradient-x {
            animation: gradient-x 8s ease infinite;
          }

          @keyframes gradient-x {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .animate-gradient-xy {
            animation: gradient-xy 12s ease infinite;
          }

          @keyframes gradient-xy {
            0%, 100% { background-position: 0% 0%; }
            25% { background-position: 100% 0%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
          }

          .animate-gradient-text {
            animation: gradient-text 6s ease infinite;
            background-size: 200% 200%;
          }

          @keyframes gradient-text {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .animate-gradient-flow {
            animation: gradient-flow 4s ease infinite;
          }

          @keyframes gradient-flow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          .animate-float-complex {
            animation: float-complex 8s ease-in-out infinite;
          }

          @keyframes float-complex {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            25% { transform: translateY(-10px) rotate(1deg); }
            50% { transform: translateY(-20px) rotate(0deg); }
            75% { transform: translateY(-10px) rotate(-1deg); }
          }

          .animate-float-reverse {
            animation: float-reverse 10s ease-in-out infinite reverse;
          }

          @keyframes float-reverse {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(-2deg); }
          }

          .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
          }

          @keyframes pulse-slow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.7; }
          }

          .animate-float-random {
            animation: float-random 6s ease-in-out infinite;
          }

          @keyframes float-random {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            25% { transform: translateY(-8px) translateX(3px); }
            50% { transform: translateY(-16px) translateX(0px); }
            75% { transform: translateY(-8px) translateX(-3px); }
          }

          .animate-particle-float {
            animation: particle-float 8s ease-in-out infinite;
          }

          @keyframes particle-float {
            0%, 100% {
              transform: translateY(0px) translateX(0px);
              opacity: 0.4;
            }
            25% {
              transform: translateY(-20px) translateX(10px);
              opacity: 0.8;
            }
            50% {
              transform: translateY(-40px) translateX(0px);
              opacity: 0.4;
            }
            75% {
              transform: translateY(-20px) translateX(-10px);
              opacity: 0.8;
            }
          }

          .animate-success-glow {
            animation: success-glow 2s ease-in-out infinite alternate;
          }

          @keyframes success-glow {
            from {
              box-shadow: 0 0 20px rgba(34, 197, 94, 0.4), 0 0 40px rgba(34, 197, 94, 0.2);
            }
            to {
              box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 0 0 60px rgba(34, 197, 94, 0.3);
            }
          }

          .animate-engine-glow {
            animation: engine-glow 2.5s ease-in-out infinite alternate;
          }

          @keyframes engine-glow {
            from {
              box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 0 40px rgba(6, 182, 212, 0.2);
            }
            to {
              box-shadow: 0 0 30px rgba(6, 182, 212, 0.6), 0 0 60px rgba(6, 182, 212, 0.3);
            }
          }

          .animate-shimmer {
            animation: shimmer-flow 3s ease-in-out infinite;
          }

          @keyframes shimmer-flow {
            0% { transform: translateX(-100%) skewX(-12deg); }
            100% { transform: translateX(200%) skewX(-12deg); }
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out forwards;
            opacity: 0;
            transform: translateY(20px);
          }

          @keyframes fade-in-up {
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-spin-slow {
            animation: spin-slow 15s linear infinite;
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .animate-bounce-slow {
            animation: bounce-slow 3s ease-in-out infinite;
          }

          @keyframes bounce-slow {
            0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
            40%, 43% { transform: translateY(-8px); }
            70% { transform: translateY(-4px); }
            90% { transform: translateY(-2px); }
          }
        `
      }} />

      {/* Header */}
      <Header isConnected={isConnected} isWebContainerStarted={isWebContainerStarted} />

      {/* Main Content - Piano Centric Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Compact Header Overlay */}
        <div className="absolute top-4 left-4 right-4 z-40 flex justify-between items-center">
          {/* Minimal Status */}
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold glass-card transition-all duration-300 ${
              isConnected
                ? 'bg-green-500/20 text-green-300 border-green-500/30'
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{isConnected ? 'Live' : 'Offline'}</span>
            </div>

            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold glass-card transition-all duration-300 ${
              isWebContainerStarted
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isWebContainerStarted ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
              <span>{isWebContainerStarted ? 'Ready' : 'Starting'}</span>
            </div>
          </div>

          {/* Minimal Controls */}
          <div className="flex items-center space-x-2">
            {/* Sound Type Selector - Compact */}
            <select
              value={soundType}
              onChange={(e) => setSoundType(e.target.value as SoundType)}
              className="px-3 py-1.5 text-sm bg-black/40 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="piano">🎹 Piano</option>
              <option value="electric-guitar">🎸 Guitar</option>
              <option value="sax">🎷 Sax</option>
              <option value="synth">🎛️ Synth</option>
              <option value="hard-synth">⚡ Hard Synth</option>
              <option value="synth-bass">🔊 Bass</option>
            </select>

            {/* Test Sound Button */}
            <button
              onClick={() => playTone(60)}
              className="px-3 py-1.5 text-sm bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              🎵
            </button>
          </div>
        </div>

        {/* Main Piano Focus Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          {isWebContainerStarted ? (
            <div className="w-full max-w-6xl">
              {/* Piano with Enhanced Visual Feedback */}
              <div className="mb-8 text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 mb-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-purple-200 tracking-wide">COLLABORATIVE SESSION</span>
                </div>

                <div className="flex items-center justify-center space-x-8 text-sm text-gray-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                    <span>{networkActiveKeys.size} active notes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse"></div>
                    <span>{users.length} collaborators</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${
                      isConnected ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span>{isConnected ? 'Synchronized' : 'Disconnected'}</span>
                  </div>
                </div>
              </div>

              {/* The Star: Virtual Piano */}
              <div className="relative">
                {/* Ambient lighting effect */}
                <div className="absolute inset-0 -z-10">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                </div>

                <VirtualPiano
                  engine={engine}
                  networkActiveKeys={networkActiveKeys}
                  soundType={soundType}
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
              </div>
            </div>
          ) : (
            <div className="text-center glass-card rounded-3xl p-16 max-w-lg">
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl flex items-center justify-center animate-pulse-glow">
                  <span className="text-white text-4xl">🎹</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
              </div>

              <h2 className="text-4xl font-display text-white mb-4">MIDI Colab</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Experience real-time collaborative music creation with professional instrument sounds.
              </p>

              {/* Engine Start Button */}
              <div className="mb-8">
                <WebContainerStarter
                  script={script}
                  onStarted={() => setIsWebContainerStarted(true)}
                  onError={(error: string) => setLogs(prev => [...prev, `WebContainer error: ${error}`])}
                />
              </div>

              <div className="text-sm text-gray-400 space-y-2">
                <p>🎵 6 Professional Instrument Sounds</p>
                <p>⚡ Real-time Cross-tab Synchronization</p>
                <p>🌍 Global Collaborative Sessions</p>
              </div>
            </div>
          )}
        </div>

        {/* Minimal Debug Panel - Bottom Right */}
        <div className="absolute bottom-4 right-4 z-30">
          <button
            onClick={() => {
              const debugPanel = document.getElementById('debug-panel');
              if (debugPanel) {
                debugPanel.classList.toggle('hidden');
              }
            }}
            className="p-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/10 transition-all duration-200"
            title="Toggle Debug Panel"
          >
            🐛
          </button>
        </div>

        {/* Collapsible Debug Panel */}
        <div id="debug-panel" className="hidden absolute bottom-16 right-4 w-80 max-h-64 glass-card rounded-2xl p-4 z-30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white">Debug Info</h4>
            <button
              onClick={() => {
                const debugPanel = document.getElementById('debug-panel');
                if (debugPanel) {
                  debugPanel.classList.add('hidden');
                }
              }}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {logs.slice(-3).map((log, i) => (
              <div key={i} className="text-xs text-gray-400 bg-black/30 rounded p-2 font-mono">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;