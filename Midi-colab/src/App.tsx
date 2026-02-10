import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { User } from './lib/midi-colab/types';
import { NetworkClient } from './lib/midi-colab/network-client';
import { WebContainerEngine } from './lib/midi-colab/web-container-engine';
import { VirtualPiano } from './VirtualPiano';
import { WebContainerStarter } from './WebContainerStarter';

type SoundType = 'piano' | 'electric-guitar' | 'sax' | 'synth' | 'hard-synth' | 'synth-bass';

const WS_URL = `ws://${window.location.hostname}:1234`; // Use current host for WebSocket

function App(): JSX.Element {
  const [engine] = useState(() => WebContainerEngine.getInstance());
  const [network, setNetwork] = useState<NetworkClient | null>(null);
  const [users] = useState<User[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isWebContainerStarted, setIsWebContainerStarted] = useState(false);
  const [networkActiveKeys, setNetworkActiveKeys] = useState<Set<number>>(new Set());
  const [soundType, setSoundType] = useState<SoundType>('piano');
  const [volume, setVolume] = useState<number>(0.7);
  const [isConnected, setIsConnected] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Audio unlock on user interaction
  useEffect(() => {
    const unlockHandler = async () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
          console.log('App: Audio context unlocked');
        } catch (error) {
          console.error('App: Failed to unlock audio context:', error);
        }
      }
    };

    document.addEventListener('click', unlockHandler);
    document.addEventListener('touchstart', unlockHandler);
    document.addEventListener('keydown', unlockHandler);

    // Try to unlock immediately
    unlockHandler();

    return () => {
      document.removeEventListener('click', unlockHandler);
      document.removeEventListener('touchstart', unlockHandler);
      document.removeEventListener('keydown', unlockHandler);
    };
  }, []);

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
    console.log('VirtualPiano: playTone called for midiNote:', midiNote, 'duration:', duration);

    const audioContext = await getAudioContext();
    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(volume, audioContext.currentTime);
    masterGain.connect(audioContext.destination);

    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    const now = audioContext.currentTime;

    // Create ADSR envelope
    const createEnvelope = (attack = 0.01, decay = 0.1, sustain = 0.3, release = 0.2) => {
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(1, now + attack);
      gainNode.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);
      gainNode.gain.setValueAtTime(sustain, now + duration - release);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
      return gainNode;
    };

    switch (soundType) {
      case 'piano': {
        // Piano: Multiple harmonics with quick attack
        const fundamental = audioContext.createOscillator();
        const octave = audioContext.createOscillator();
        const fifth = audioContext.createOscillator();

        const envelope = createEnvelope(0.005, 0.1, 0.1, 0.3);

        fundamental.frequency.setValueAtTime(frequency, now);
        fundamental.type = 'sine';

        octave.frequency.setValueAtTime(frequency * 2, now);
        octave.type = 'sine';

        fifth.frequency.setValueAtTime(frequency * 1.5, now);
        fifth.type = 'triangle';

        fundamental.connect(envelope);
        octave.connect(envelope);
        fifth.connect(envelope);
        envelope.connect(masterGain);

        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(0.4, now + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.05, now + 0.1);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + duration);

        fundamental.start(now);
        octave.start(now);
        fifth.start(now);
        fundamental.stop(now + duration);
        octave.stop(now + duration);
        fifth.stop(now + duration);
        break;
      }

      case 'electric-guitar': {
        // Guitar: Distorted sawtooth with filter sweep
        const osc = audioContext.createOscillator();
        const filter = audioContext.createBiquadFilter();
        const envelope = createEnvelope(0.001, 0.05, 0.3, 0.1);

        osc.frequency.setValueAtTime(frequency, now);
        osc.type = 'sawtooth';

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(2000, now + 0.1);
        filter.Q.setValueAtTime(2, now);

        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration);
        break;
      }

      case 'sax': {
        // Sax: Warm, breathy tone with vibrato
        const osc = audioContext.createOscillator();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        const envelope = createEnvelope(0.05, 0.2, 0.4, 0.3);

        osc.frequency.setValueAtTime(frequency, now);
        osc.type = 'sawtooth';

        lfo.frequency.setValueAtTime(5, now); // Vibrato
        lfoGain.gain.setValueAtTime(10, now); // Vibrato depth

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.Q.setValueAtTime(1, now);

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(masterGain);

        osc.start(now);
        lfo.start(now);
        osc.stop(now + duration);
        lfo.stop(now + duration);
        break;
      }

      case 'synth': {
        // Synth: Rich pad sound with chorus effect
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        const envelope = createEnvelope(0.1, 0.2, 0.6, 0.4);

        osc1.frequency.setValueAtTime(frequency, now);
        osc1.type = 'triangle';

        osc2.frequency.setValueAtTime(frequency * 1.01, now); // Slight detune
        osc2.type = 'triangle';

        lfo.frequency.setValueAtTime(0.5, now); // Slow chorus
        lfoGain.gain.setValueAtTime(5, now);

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfoGain.connect(osc2.frequency);

        osc1.connect(envelope);
        osc2.connect(envelope);
        envelope.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        lfo.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
        lfo.stop(now + duration);
        break;
      }

      case 'hard-synth': {
        // Hard Synth: Aggressive square wave with filter
        const osc = audioContext.createOscillator();
        const subOsc = audioContext.createOscillator();
        const filter = audioContext.createBiquadFilter();
        const envelope = createEnvelope(0.001, 0.05, 0.8, 0.1);

        osc.frequency.setValueAtTime(frequency, now);
        osc.type = 'square';

        subOsc.frequency.setValueAtTime(frequency * 0.5, now);
        subOsc.type = 'square';

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.linearRampToValueAtTime(800, now + 0.2);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(envelope);
        envelope.connect(masterGain);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + duration);
        subOsc.stop(now + duration);
        break;
      }

      case 'synth-bass': {
        // Synth Bass: Deep sub-bass with harmonics
        const osc = audioContext.createOscillator();
        const subOsc = audioContext.createOscillator();
        const envelope = createEnvelope(0.005, 0.1, 0.9, 0.2);

        osc.frequency.setValueAtTime(frequency, now);
        osc.type = 'sawtooth';

        subOsc.frequency.setValueAtTime(frequency * 0.25, now); // Deep sub
        subOsc.type = 'sine';

        osc.connect(envelope);
        subOsc.connect(envelope);
        envelope.connect(masterGain);

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + duration);
        subOsc.stop(now + duration);
        break;
      }

      default: {
        // Simple sine wave fallback
        const osc = audioContext.createOscillator();
        const envelope = createEnvelope();

        osc.frequency.setValueAtTime(frequency, now);
        osc.type = 'sine';

        osc.connect(envelope);
        envelope.connect(masterGain);

        osc.start(now);
        osc.stop(now + duration);
      }
    }
  }, [getAudioContext, soundType, volume]);

  // Initialize app
  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      if (!isWebContainerStarted) return;

      try {
        // Init Network
        const net = new NetworkClient(WS_URL, engine);
        net.connect();
        if (mounted) setNetwork(net);

        // Listen to network
        net.provider?.on('status', (evt: { status: string }) => {
          console.log('App: Yjs connection status changed to:', evt.status);
          setIsConnected(evt.status === 'connected');
        });

        const processedMap = net.getLogs() as any;
        console.log('App: setting up network observe on processedMap, current size:', processedMap.size);
        const offLogs = processedMap.observe((event: any) => {
          event.changes.keys.forEach((change: any, key: any) => {
            if (change.action === 'add' || change.action === 'update') {
              const log = processedMap.get(key);
              if (log.type === 'midi' && log.data) {
                const activeNotes = new Set<number>();
                log.data.forEach((event: any) => {
                  if (event.type === 'noteon' && event.data) {
                    playTone(event.data[0]);
                    activeNotes.add(event.data[0]);
                  }
                });
                if (activeNotes.size > 0) {
                  setNetworkActiveKeys(activeNotes);
                  setTimeout(() => {
                    setNetworkActiveKeys(new Set());
                  }, 200);
                }
              }
            }
          });
        });

        return () => {
          offLogs();
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
  }, [isWebContainerStarted, engine, playTone]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-300 p-6 font-sans">
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            cursor: pointer;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }

          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 8px rgba(251, 191, 36, 0.4);
          }

          .slider::-moz-range-thumb {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            cursor: pointer;
            border: 2px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
        `
      }} />
      {/* Top Navigation */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex gap-6 text-sm font-medium">
          {['All', 'Producers', 'Vocalists', 'Artists', 'Industry', 'Technology'].map((item, i) => (
            <span key={i} className={`${item === 'All' ? 'text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full' : 'hover:text-white cursor-pointer'}`}>
              {item}
            </span>
          ))}
        </div>
        <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition">
          Session Active
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[500px]">
        {/* Left Sidebar: Session & Collaborators */}
        <div className="col-span-2 bg-[#121216] rounded-xl p-4 border border-white/5">
          <h3 className="text-lg font-semibold mb-4 text-white">Session</h3>

          {/* Status Indicators */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-[#1a1a20] rounded-lg">
              <span className="text-sm text-gray-400">Connection</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs text-white">{isConnected ? 'Live' : 'Offline'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1a1a20] rounded-lg">
              <span className="text-sm text-gray-400">Engine</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isWebContainerStarted ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
                <span className="text-xs text-white">{isWebContainerStarted ? 'Ready' : 'Starting'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-[#1a1a20] rounded-lg">
              <span className="text-sm text-gray-400">Audio</span>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${audioContextRef.current?.state === 'running' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                <span className="text-xs text-white">{audioContextRef.current?.state === 'running' ? 'Active' : 'Locked'}</span>
              </div>
            </div>
          </div>

          {/* Collaborators */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white mb-3">Collaborators ({users.length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {users.length === 0 ? (
                <div className="text-xs text-gray-500 p-2 bg-[#1a1a20] rounded">No other players</div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 p-2 bg-[#1a1a20] rounded">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs text-white">{user.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Engine Control */}
          {!isWebContainerStarted && (
            <div className="mb-4">
              <WebContainerStarter
                onStarted={() => setIsWebContainerStarted(true)}
                onError={(error: string) => setLogs(prev => [...prev, `WebContainer error: ${error}`])}
              />
            </div>
          )}
        </div>

        {/* Center: Waveform Visualizer */}
        <div className="col-span-7 bg-[#121216] rounded-xl flex items-center justify-center relative overflow-hidden border border-white/5">
           {isWebContainerStarted ? (
             <>
               {/* Live Session Indicator */}
               <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                   <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                   <span className="text-sm text-white font-medium">LIVE SESSION</span>
                 </div>
                 <div className="text-sm text-gray-400">
                   {networkActiveKeys.size} notes • {users.length} players
                 </div>
               </div>

               {/* Waveform Visualization */}
               <div className="w-full h-64 flex items-center justify-center">
                 <svg viewBox="0 0 400 200" className="w-full h-full">
                   <defs>
                     <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="#40a9ff" stopOpacity="0.8" />
                       <stop offset="50%" stopColor="#40a9ff" stopOpacity="0.4" />
                       <stop offset="100%" stopColor="#40a9ff" stopOpacity="0.8" />
                     </linearGradient>
                   </defs>

                   {/* Dynamic waveform based on active keys */}
                   <path
                     d={`M 0 100 ${networkActiveKeys.size > 0 ?
                       Array.from(networkActiveKeys).map((key, i) => {
                         const x = (i / Math.max(networkActiveKeys.size, 1)) * 400;
                         const y = 100 + (Math.sin(Date.now() * 0.001 + i) * 30);
                         return `L ${x} ${y}`;
                       }).join(' ') + ' L 400 100'
                       : 'Q 50 100, 100 100 T 150 40 T 200 160 T 250 40 T 300 100 T 400 100'
                     }`}
                     fill="none"
                     stroke="url(#waveformGradient)"
                     strokeWidth="3"
                     className="drop-shadow-[0_0_10px_rgba(64,169,255,0.8)]"
                   />
                 </svg>
               </div>
             </>
           ) : (
             <div className="text-center">
               <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                 <span className="text-2xl">🎵</span>
               </div>
               <h3 className="text-xl font-semibold text-white mb-2">Initialize Engine</h3>
               <p className="text-gray-400 text-sm">Start the music engine to begin collaborating</p>
             </div>
           )}
        </div>

        {/* Right Sidebar: Controls & FX */}
        <div className="col-span-3 bg-[#121216] rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Controls & FX</h3>
          </div>

          {/* Sound Selection */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white mb-3">Instrument</h4>
            <div className="space-y-2">
              {[
                { value: 'piano' as SoundType, label: 'Piano', icon: '🎹' },
                { value: 'electric-guitar' as SoundType, label: 'Guitar', icon: '🎸' },
                { value: 'sax' as SoundType, label: 'Sax', icon: '🎷' },
                { value: 'synth' as SoundType, label: 'Synth', icon: '🎛️' },
                { value: 'hard-synth' as SoundType, label: 'Hard Synth', icon: '⚡' },
                { value: 'synth-bass' as SoundType, label: 'Bass', icon: '🔊' }
              ].map(({ value, label, icon }) => (
                <label key={value} className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{icon}</span>
                    <span className="text-sm text-white">{label}</span>
                  </div>
                  <input
                    type="radio"
                    name="soundType"
                    value={value}
                    checked={soundType === value}
                    onChange={(e) => setSoundType(e.target.value as SoundType)}
                    className="w-4 h-4 text-yellow-500 bg-gray-100 border-gray-300 focus:ring-yellow-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Volume Control */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-white mb-3">Volume</h4>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400">🔊</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-white w-8">{Math.round(volume * 100)}</span>
            </div>
          </div>

          {/* Test Sound */}
          <button
            onClick={() => playTone(60)}
            className="w-full bg-yellow-500 text-black py-3 rounded-lg font-bold hover:bg-yellow-400 transition mb-4"
          >
            Test Sound
          </button>

          {/* Session Stats */}
          <div className="bg-[#1a1a20] p-3 rounded-lg text-xs text-gray-500">
            MIDI Colab v1.0<br />
            Session: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Piano Keyboard - Full Width Bottom */}
      {isWebContainerStarted && (
        <div className="mt-6 bg-[#121216] rounded-xl p-4 border border-white/5">
          <VirtualPiano
            networkActiveKeys={networkActiveKeys}
            soundType={soundType}
            volume={volume}
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
      )}
    </div>
  );
}

export default App;