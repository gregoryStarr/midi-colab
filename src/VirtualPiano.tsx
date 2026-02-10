import React, { useCallback, useRef } from 'react';


type SoundType = 'piano' | 'electric-guitar' | 'sax' | 'synth' | 'hard-synth' | 'synth-bass';

interface VirtualPianoProps {
  networkActiveKeys?: Set<number>;
  onProcessed?: (output: any) => void;
  soundType?: SoundType;
  volume?: number;
}

export const VirtualPiano: React.FC<VirtualPianoProps> = React.memo(({ networkActiveKeys = new Set(), onProcessed, soundType = 'piano', volume = 0.7 }) => {
  console.log('VirtualPiano: rendering with networkActiveKeys:', Array.from(networkActiveKeys));
  const audioContextRef = useRef<AudioContext | null>(null);
  const [activeKeys, setActiveKeys] = React.useState<Set<number>>(new Set());

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('VirtualPiano: Created new AudioContext, state:', audioContextRef.current.state);
    }

    if (audioContextRef.current.state === 'suspended') {
      console.log('VirtualPiano: Resuming suspended AudioContext');
      try {
        await audioContextRef.current.resume();
        console.log('VirtualPiano: AudioContext resumed successfully');
      } catch (error) {
        console.error('VirtualPiano: Failed to resume AudioContext:', error);
      }
    }

    console.log('VirtualPiano: AudioContext state:', audioContextRef.current.state);
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(async (midiNote: number, duration: number = 0.5) => {
    console.log('VirtualPiano: playTone called for midiNote:', midiNote, 'duration:', duration);

    const audioContext = await getAudioContext();
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    const now = audioContext.currentTime;

    const masterGain = audioContext.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(audioContext.destination);

    console.log('VirtualPiano: Playing frequency:', frequency, 'Hz at time:', now);

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
  }, [getAudioContext, soundType]);

  const NOTES = [
    // Extended range: C3 to C6
    { note: 'C3', midi: 48, type: 'white' },
    { note: 'C#3', midi: 49, type: 'black' },
    { note: 'D3', midi: 50, type: 'white' },
    { note: 'D#3', midi: 51, type: 'black' },
    { note: 'E3', midi: 52, type: 'white' },
    { note: 'F3', midi: 53, type: 'white' },
    { note: 'F#3', midi: 54, type: 'black' },
    { note: 'G3', midi: 55, type: 'white' },
    { note: 'G#3', midi: 56, type: 'black' },
    { note: 'A3', midi: 57, type: 'white' },
    { note: 'A#3', midi: 58, type: 'black' },
    { note: 'B3', midi: 59, type: 'white' },
    { note: 'C4', midi: 60, type: 'white' },
    { note: 'C#4', midi: 61, type: 'black' },
    { note: 'D4', midi: 62, type: 'white' },
    { note: 'D#4', midi: 63, type: 'black' },
    { note: 'E4', midi: 64, type: 'white' },
    { note: 'F4', midi: 65, type: 'white' },
    { note: 'F#4', midi: 66, type: 'black' },
    { note: 'G4', midi: 67, type: 'white' },
    { note: 'G#4', midi: 68, type: 'black' },
    { note: 'A4', midi: 69, type: 'white' },
    { note: 'A#4', midi: 70, type: 'black' },
    { note: 'B4', midi: 71, type: 'white' },
    { note: 'C5', midi: 72, type: 'white' },
    { note: 'C#5', midi: 73, type: 'black' },
    { note: 'D5', midi: 74, type: 'white' },
    { note: 'D#5', midi: 75, type: 'black' },
    { note: 'E5', midi: 76, type: 'white' },
    { note: 'F5', midi: 77, type: 'white' },
    { note: 'F#5', midi: 78, type: 'black' },
    { note: 'G5', midi: 79, type: 'white' },
    { note: 'G#5', midi: 80, type: 'black' },
    { note: 'A5', midi: 81, type: 'white' },
    { note: 'A#5', midi: 82, type: 'black' },
    { note: 'B5', midi: 83, type: 'white' },
    { note: 'C6', midi: 84, type: 'white' },
  ];

  const playNote = useCallback(async (midiNote: number, velocity: number = 127) => {
    console.log('VirtualPiano: playNote called with midiNote:', midiNote);
    // Play local sound
    playTone(midiNote);

    try {
      // Zero-latency direct MIDI broadcast - no processing whatsoever
      const midiData = {
        type: 'noteon',
        data: [midiNote, velocity],
        timestamp: Date.now()
      };

      // Direct broadcast without any console logging for max speed
      onProcessed?.({ processed: [midiData] });

      // Note off after 200ms for snappy feel
      setTimeout(() => {
        // Remove from active keys
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(midiNote);
          return newSet;
        });
      }, 200);
    } catch (error) {
      console.error('Failed to process MIDI:', error);
      // Remove from active keys on error
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(midiNote);
        return newSet;
      });
    }
  }, [onProcessed, playTone]);

  return (
    <div className="virtual-piano-container">
      <style dangerouslySetInnerHTML={{
        __html: `
          .virtual-piano-container {
            position: fixed;
            right: 0px;
            top: 50%;
            transform: translateY(-50%) translateX(300px) rotate(90deg);
            display: flex;
            height: 200px;
            backdrop-filter: blur(16px);
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 15px;
            box-shadow:
              0 8px 32px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
            z-index: 1000;
          }

          @media (max-width: 768px) {
            .virtual-piano-container {
              transform: translateY(-50%) translateX(150px) rotate(0deg) scale(0.7);
              right: 10px;
              top: 70%;
            }
          }

          .piano-key {
            position: relative;
            cursor: pointer;
            font-size: 10px;
            font-weight: bold;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 5px;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            border-radius: 0 0 8px 8px;
          }

          .piano-key-white {
            width: 35px;
            height: 200px;
            background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.8));
            border: 1px solid rgba(226,232,240,0.5);
            color: #1e293b;
            z-index: 1;
            box-shadow:
              0 2px 4px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }

          .piano-key-white:hover {
            background: linear-gradient(135deg, rgba(241,245,249,0.9), rgba(226,232,240,0.8));
            transform: translateY(-2px);
            box-shadow:
              0 4px 8px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }

          .piano-key-white.active {
            background: linear-gradient(135deg, rgba(59,130,246,0.8), rgba(37,99,235,0.6));
            transform: translateY(0);
            box-shadow:
              inset 0 2px 4px rgba(0, 0, 0, 0.2),
              0 0 20px rgba(59,130,246, 0.4);
            animation: key-press 0.15s ease-out;
          }

          .piano-key-black {
            position: absolute;
            width: 25px;
            height: 120px;
            background: linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.8));
            border: 1px solid rgba(51,65,85,0.5);
            color: #f1f5f9;
            z-index: 2;
            border-radius: 0 0 6px 6px;
            box-shadow:
              0 2px 4px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
          }

          .piano-key-black:hover {
            background: linear-gradient(135deg, rgba(51,65,85,0.9), rgba(30,41,59,0.8));
            transform: translateY(-1px);
            box-shadow:
              0 4px 8px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
          }

          .piano-key-black.active {
            background: linear-gradient(135deg, rgba(245,158,11,0.8), rgba(217,119,6,0.6));
            transform: translateY(0);
            box-shadow:
              inset 0 2px 4px rgba(0, 0, 0, 0.4),
              0 0 20px rgba(245,158,11, 0.4);
            animation: key-press 0.15s ease-out;
          }

          @keyframes key-press {
            0% { transform: scale(1); }
            50% { transform: scale(0.95); }
            100% { transform: scale(1); }
          }

          @media (max-width: 768px) {
            .piano-key-white, .piano-key-black {
              width: 25px;
              font-size: 8px;
            }
            .piano-key-black {
              width: 18px;
            }
          }
        `
      }} />
      {NOTES.map((note, index) => (
        <button
          key={note.note}
          onClick={() => playNote(note.midi)}
          className={`piano-key ${note.type === 'black' ? 'piano-key-black' : 'piano-key-white'} ${
            (activeKeys.has(note.midi) || networkActiveKeys.has(note.midi)) ? 'active' : ''
          }`}
          style={{
            position: note.type === 'black' ? 'absolute' : 'relative',
            left: note.type === 'black' ? `${(index - 0.5) * 35}px` : 'auto',
          }}
          aria-label={`Play ${note.note} note`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              playNote(note.midi);
            }
          }}
        >
          {note.note}
        </button>
      ))}
    </div>
  );
});