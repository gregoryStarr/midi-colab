import React, { useCallback, useRef } from 'react';
import { WebContainerEngine } from './lib/midi-colab/web-container-engine';
import type { ContainerInput } from './lib/midi-colab/types';

interface VirtualPianoProps {
  engine: WebContainerEngine;
  onProcessed?: (output: any) => void;
}

export const VirtualPiano: React.FC<VirtualPianoProps> = ({ engine, onProcessed }) => {
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

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [getAudioContext]);

  const NOTES = [
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
  ];

  const playNote = useCallback(async (midiNote: number, velocity: number = 127) => {
    // Play local sound
    playTone(midiNote);

    try {
      const input: ContainerInput = {
        type: 'midi',
        data: {
          type: 'noteon',
          data: [midiNote, velocity]
        }
      };

      const output = await engine.process(input);
      onProcessed?.(output);

      // Note off after 500ms
      setTimeout(async () => {
        const offInput: ContainerInput = {
          type: 'midi',
          data: {
            type: 'noteoff',
            data: [midiNote, 0]
          }
        };
        await engine.process(offInput);
      }, 500);
    } catch (error) {
      console.error('Failed to process MIDI:', error);
    }
  }, [engine, onProcessed, playTone]);

  return (
    <div style={{ display: 'flex', position: 'relative', height: '200px', background: '#f0f0f0', border: '1px solid #ccc' }}>
      {NOTES.map((note) => (
        <button
          key={note.note}
          onClick={() => playNote(note.midi)}
          style={{
            position: note.type === 'black' ? 'absolute' : 'relative',
            left: note.type === 'black' ? `${(NOTES.indexOf(note) - 0.5) * 40}px` : 'auto',
            width: note.type === 'black' ? '30px' : '40px',
            height: note.type === 'black' ? '120px' : '200px',
            background: note.type === 'black' ? '#333' : '#fff',
            color: note.type === 'black' ? '#fff' : '#000',
            border: '1px solid #000',
            cursor: 'pointer',
            zIndex: note.type === 'black' ? 2 : 1,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: '10px',
          }}
        >
          {note.note}
        </button>
      ))}
    </div>
  );
};