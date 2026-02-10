import React, { useCallback, useRef } from 'react';
import { WebContainerEngine } from './lib/midi-colab/web-container-engine';
import type { ContainerInput } from './lib/midi-colab/types';

type SoundType = 'piano' | 'electric-guitar' | 'sax' | 'synth' | 'hard-synth' | 'synth-bass';

interface VirtualPianoProps {
  engine: WebContainerEngine;
  networkActiveKeys?: Set<number>;
  onProcessed?: (output: any) => void;
  soundType?: SoundType;
}

export const VirtualPiano: React.FC<VirtualPianoProps> = ({ engine, networkActiveKeys = new Set(), onProcessed, soundType = 'piano' }) => {
  console.log('VirtualPiano: rendering with networkActiveKeys:', Array.from(networkActiveKeys));
  const audioContextRef = useRef<AudioContext | null>(null);
  const [activeKeys, setActiveKeys] = React.useState<Set<number>>(new Set());

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
    const masterGain = audioContext.createGain();
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
      // Skip WebContainer processing for now - go direct for speed
      const processedData = {
        type: 'noteon',
        data: [midiNote, velocity],
        theory: { note: `Note ${midiNote}`, lovely: true }
      };

      console.log('VirtualPiano: direct processing, output:', processedData);
      onProcessed?.({ processed: [processedData] });

      // Note off after 200ms for snappy feel
      setTimeout(async () => {
        console.log('VirtualPiano: clearing local active key:', midiNote);
        // Remove from active keys
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(midiNote);
          return newSet;
        });

        const offInput: ContainerInput = {
          type: 'midi',
          data: {
            type: 'noteoff',
            data: [midiNote, 0]
          }
        };
        await engine.process(offInput);
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
  }, [engine, onProcessed, playTone]);

  return (
    <div style={{
      position: 'fixed',
      right: '0px',
      top: '50%',
      transform: 'translateY(-50%) translateX(300px) rotate(90deg)',
      display: 'flex',
      height: '200px',
      background: '#f0f0f0',
      border: '1px solid #ccc',
      borderRadius: '10px',
      padding: '10px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      {NOTES.map((note) => (
        <button
          key={note.note}
          onClick={() => playNote(note.midi)}
          style={{
            position: note.type === 'black' ? 'absolute' : 'relative',
            left: note.type === 'black' ? `${(NOTES.indexOf(note) - 0.5) * 35}px` : 'auto',
            width: note.type === 'black' ? '25px' : '35px',
            height: note.type === 'black' ? '120px' : '200px',
            background: (activeKeys.has(note.midi) || networkActiveKeys.has(note.midi))
              ? `linear-gradient(to top, #C77B8B, transparent), ${note.type === 'black' ? '#222' : '#fff'}`
              : note.type === 'black' ? '#222' : '#fff',
            color: note.type === 'black' ? '#fff' : '#000',
            border: note.type === 'black' ? '1px solid #000' : '2px solid #000',
            borderRadius: note.type === 'black' ? '0 0 5px 5px' : '0 0 8px 8px',
            cursor: 'pointer',
            zIndex: note.type === 'black' ? 2 : 1,
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '5px',
            transition: 'all 0.1s ease',
            boxShadow: note.type === 'black' ? 'inset 0 2px 4px rgba(255,255,255,0.1)' : '0 2px 4px rgba(0,0,0,0.2)',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.95)';
            e.currentTarget.style.boxShadow = note.type === 'black' ? 'inset 0 1px 2px rgba(255,255,255,0.2)' : '0 1px 2px rgba(0,0,0,0.1)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = note.type === 'black' ? 'inset 0 2px 4px rgba(255,255,255,0.1)' : '0 2px 4px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = note.type === 'black' ? 'inset 0 2px 4px rgba(255,255,255,0.1)' : '0 2px 4px rgba(0,0,0,0.2)';
          }}
        >
          {note.note}
        </button>
      ))}
    </div>
  );
};