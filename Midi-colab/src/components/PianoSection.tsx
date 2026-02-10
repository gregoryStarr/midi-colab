import React from 'react';
import { VirtualPiano } from '../VirtualPiano';
import { WebContainerEngine } from '../lib/midi-colab/web-container-engine';

type SoundType = 'piano' | 'electric-guitar' | 'sax' | 'synth' | 'hard-synth' | 'synth-bass';

interface PianoSectionProps {
  engine: WebContainerEngine;
  networkActiveKeys: Set<number>;
  soundType: SoundType;
  isWebContainerStarted: boolean;
  onProcessed: (output: any) => void;
}

export const PianoSection: React.FC<PianoSectionProps> = ({
  engine,
  networkActiveKeys,
  soundType,
  isWebContainerStarted,
  onProcessed
}) => {
  return (
    <div className="glass-card rounded-3xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-3xl flex items-center justify-center animate-pulse-glow">
            <span className="text-white font-display text-3xl">♪</span>
          </div>
          <div>
            <h2 className="text-4xl font-display text-white tracking-wide">Virtual Piano</h2>
            <p className="text-gray-400">Play beautiful music with collaborators worldwide</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
            <span className="text-gray-300 font-medium">Live Session</span>
          </div>
          <div className="text-gray-500">•</div>
          <div className="text-gray-400">{networkActiveKeys.size} active notes</div>
        </div>
      </div>

      {isWebContainerStarted && (
        <VirtualPiano
          engine={engine}
          networkActiveKeys={networkActiveKeys}
          soundType={soundType}
          onProcessed={onProcessed}
        />
      )}
    </div>
  );
};