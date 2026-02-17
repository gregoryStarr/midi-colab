import React, { useCallback, useRef, useState } from "react";

type SoundType =
  | "piano"
  | "electric-guitar"
  | "sax"
  | "synth"
  | "hard-synth"
  | "synth-bass";

interface VirtualPianoProps {
  networkActiveKeys?: Set<number>;
  onProcessed?: (output: any) => void;
  soundType?: SoundType;
  volume?: number;
}

export const VirtualPiano: React.FC<VirtualPianoProps> = React.memo(
  ({
    networkActiveKeys = new Set(),
    onProcessed,
    soundType = "piano",
    volume = 0.7,
  }) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set());

    // ... (Keep existing audio context logic)
    const getAudioContext = useCallback(async () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
      }
      if (audioContextRef.current.state === "suspended") {
        try {
          await audioContextRef.current.resume();
        } catch (error) {
          console.error("VirtualPiano: Failed to resume AudioContext:", error);
        }
      }
      return audioContextRef.current;
    }, []);

    const playTone = useCallback(
      async (midiNote: number, duration: number = 0.5) => {
        const audioContext = await getAudioContext();
        const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
        const now = audioContext.currentTime;
        const masterGain = audioContext.createGain();
        masterGain.gain.setValueAtTime(volume, now);
        masterGain.connect(audioContext.destination);

        // Reuse the exact sound generation logic from before or assume it's moved to a helper
        // For now I'll implement a simple one to save space, assuming the user likely wants the App.tsx one to trigger mainly?
        // Wait, the App.tsx has its own playTone. VirtualPiano has its own playTone.
        // The previous file had the FULL switch case. I should preserve it to keep the sound working locally.

        const createEnvelope = (
          attack = 0.01,
          decay = 0.1,
          sustain = 0.3,
          release = 0.2,
        ) => {
          const gainNode = audioContext.createGain();
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(1, now + attack);
          gainNode.gain.exponentialRampToValueAtTime(
            sustain,
            now + attack + decay,
          );
          gainNode.gain.setValueAtTime(sustain, now + duration - release);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
          return gainNode;
        };

        // Fast path for simple sound if needed, but let's paste the logic back in to be safe
        switch (soundType) {
          case "piano": {
            const fundamental = audioContext.createOscillator();
            const octave = audioContext.createOscillator();
            const fifth = audioContext.createOscillator();
            const envelope = createEnvelope(0.005, 0.1, 0.1, 0.3);
            fundamental.frequency.setValueAtTime(frequency, now);
            fundamental.type = "sine";
            octave.frequency.setValueAtTime(frequency * 2, now);
            octave.type = "sine";
            fifth.frequency.setValueAtTime(frequency * 1.5, now);
            fifth.type = "triangle";
            fundamental.connect(envelope);
            octave.connect(envelope);
            fifth.connect(envelope);
            envelope.connect(masterGain);
            fundamental.start(now);
            octave.start(now);
            fifth.start(now);
            fundamental.stop(now + duration);
            octave.stop(now + duration);
            fifth.stop(now + duration);
            break;
          }
          // ... (I'll implement a simple fallback for others to save tokens, or if I must be exact, I should copy all.)
          // Since I want to be safe, I'll implement a generic synth for all others for now, unless requested to be exact.
          // The user said "not to break functionality". The sound difference IS functionality.
          // I will copy the logic.
          case "electric-guitar": {
            const osc = audioContext.createOscillator();
            const filter = audioContext.createBiquadFilter();
            const envelope = createEnvelope(0.001, 0.05, 0.3, 0.1);
            osc.frequency.setValueAtTime(frequency, now);
            osc.type = "sawtooth";
            filter.type = "lowpass";
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
          case "sax": {
            const osc = audioContext.createOscillator();
            const lfo = audioContext.createOscillator();
            const lfoGain = audioContext.createGain();
            const filter = audioContext.createBiquadFilter();
            const envelope = createEnvelope(0.05, 0.2, 0.4, 0.3);
            osc.frequency.setValueAtTime(frequency, now);
            osc.type = "sawtooth";
            lfo.frequency.setValueAtTime(5, now);
            lfoGain.gain.setValueAtTime(10, now);
            filter.type = "lowpass";
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
          case "synth": {
            const osc1 = audioContext.createOscillator();
            const osc2 = audioContext.createOscillator();
            const lfo = audioContext.createOscillator();
            const lfoGain = audioContext.createGain();
            const envelope = createEnvelope(0.1, 0.2, 0.6, 0.4);
            osc1.frequency.setValueAtTime(frequency, now);
            osc1.type = "triangle";
            osc2.frequency.setValueAtTime(frequency * 1.01, now);
            osc2.type = "triangle";
            lfo.frequency.setValueAtTime(0.5, now);
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
          case "hard-synth": {
            const osc = audioContext.createOscillator();
            const subOsc = audioContext.createOscillator();
            const filter = audioContext.createBiquadFilter();
            const envelope = createEnvelope(0.001, 0.05, 0.8, 0.1);
            osc.frequency.setValueAtTime(frequency, now);
            osc.type = "square";
            subOsc.frequency.setValueAtTime(frequency * 0.5, now);
            subOsc.type = "square";
            filter.type = "highpass";
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
          case "synth-bass": {
            const osc = audioContext.createOscillator();
            const subOsc = audioContext.createOscillator();
            const envelope = createEnvelope(0.005, 0.1, 0.9, 0.2);
            osc.frequency.setValueAtTime(frequency, now);
            osc.type = "sawtooth";
            subOsc.frequency.setValueAtTime(frequency * 0.25, now);
            subOsc.type = "sine";
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
            const osc = audioContext.createOscillator();
            const envelope = createEnvelope();
            osc.frequency.setValueAtTime(frequency, now);
            osc.type = "sine";
            osc.connect(envelope);
            envelope.connect(masterGain);
            osc.start(now);
            osc.stop(now + duration);
          }
        }
      },
      [getAudioContext, soundType, volume],
    );

    const NOTES: { note: string; midi: number; type: "white" | "black" }[] = [];
    // Generate notes C2 to C6 for a fuller keyboard
    const startOctave = 2;
    const endOctave = 5;
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];

    for (let oct = startOctave; oct <= endOctave; oct++) {
      noteNames.forEach((note, i) => {
        NOTES.push({
          note: `${note}${oct}`,
          midi: oct * 12 + i + 12, // MIDI note calculation
          type: note.includes("#") ? "black" : "white",
        });
      });
    }
    // Add C6
    NOTES.push({ note: "C6", midi: 84, type: "white" });

    const playNote = useCallback(
      async (midiNote: number, velocity: number = 127) => {
        playTone(midiNote);
        try {
          const midiData = {
            type: "noteon",
            data: [midiNote, velocity],
            timestamp: Date.now(),
          };
          onProcessed?.({ processed: [midiData] });
          setTimeout(
            () =>
              setActiveKeys((prev) => {
                const s = new Set(prev);
                s.delete(midiNote);
                return s;
              }),
            200,
          );
        } catch (error) {
          console.error("Failed to process MIDI:", error);
        }
      },
      [onProcessed, playTone],
    );

    return (
      <div className="virtual-piano-container w-full h-[200px] overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#0f0f13] rounded-lg p-2 relative flex items-start justify-center">
        <div className="flex relative h-full">
          {/* Render Black Keys Logic (handled below) */}

          {/* Render White Keys */}
          {NOTES.filter((n) => n.type === "white").map((note) => {
            const isActive =
              activeKeys.has(note.midi) || networkActiveKeys.has(note.midi);
            return (
              <button
                key={note.midi}
                className={`relative w-12 h-full border border-gray-100/10 rounded-b-lg active:scale-95 transition-all
                        ${isActive ? "bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)] z-10" : "bg-white hover:bg-gray-100"}
                    `}
                onMouseDown={() => {
                  setActiveKeys((s) => new Set(s).add(note.midi));
                  playNote(note.midi);
                }}
                onMouseUp={() =>
                  setActiveKeys((s) => {
                    const n = new Set(s);
                    n.delete(note.midi);
                    return n;
                  })
                }
                onMouseLeave={() =>
                  setActiveKeys((s) => {
                    const n = new Set(s);
                    n.delete(note.midi);
                    return n;
                  })
                }
              >
                <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500">
                  {note.note}
                </span>
              </button>
            );
          })}

          {/* Render Black Keys Absolutely */}
          {NOTES.filter((n) => n.type === "black").map((note) => {
            // Calculate position based on MIDI note relative to start
            // This is tricky without fixed widths.
            // Assumption: White keys are 3rem (w-12 = 3rem = 48px).
            // C3 = 48.
            // We need to find the number of white keys before this black key.

            // Count white keys before this midi note
            const whiteKeysBefore = NOTES.filter(
              (n) => n.type === "white" && n.midi < note.midi,
            ).length;
            const leftPos = whiteKeysBefore * 48 - 14; // 48px width, minus half black key width (approx)

            const isActive =
              activeKeys.has(note.midi) || networkActiveKeys.has(note.midi);

            return (
              <button
                key={note.midi}
                className={`absolute w-7 h-[60%] border border-gray-800 rounded-b-lg active:scale-95 transition-all z-20
                        ${isActive ? "bg-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.6)]" : "bg-gray-900 hover:bg-gray-800"}
                    `}
                style={{ left: `${leftPos}px` }}
                onMouseDown={() => {
                  setActiveKeys((s) => new Set(s).add(note.midi));
                  playNote(note.midi);
                }}
                onMouseUp={() =>
                  setActiveKeys((s) => {
                    const n = new Set(s);
                    n.delete(note.midi);
                    return n;
                  })
                }
                onMouseLeave={() =>
                  setActiveKeys((s) => {
                    const n = new Set(s);
                    n.delete(note.midi);
                    return n;
                  })
                }
              ></button>
            );
          })}
        </div>
      </div>
    );
  },
);
