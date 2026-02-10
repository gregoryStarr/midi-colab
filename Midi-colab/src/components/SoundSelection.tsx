import React from 'react';

type SoundType = 'piano' | 'electric-guitar' | 'sax' | 'synth' | 'hard-synth' | 'synth-bass';

interface SoundSelectionProps {
  soundType: SoundType;
  onSoundTypeChange: (type: SoundType) => void;
}

export const SoundSelection: React.FC<SoundSelectionProps> = ({ soundType, onSoundTypeChange }) => {
  return (
    <div className="glass-card rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 group">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
          <span className="text-white text-xl">🎼</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Sound Selection</h3>
          <p className="text-sm text-gray-400">Choose your instrument</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { value: 'piano' as SoundType, label: 'Piano', icon: '🎹', color: 'from-blue-500 to-cyan-400' },
          { value: 'electric-guitar' as SoundType, label: 'Electric Guitar', icon: '🎸', color: 'from-red-500 to-pink-400' },
          { value: 'sax' as SoundType, label: 'Saxophone', icon: '🎷', color: 'from-yellow-500 to-orange-400' },
          { value: 'synth' as SoundType, label: 'Synth', icon: '🎛️', color: 'from-purple-500 to-indigo-400' },
          { value: 'hard-synth' as SoundType, label: 'Hard Synth', icon: '⚡', color: 'from-pink-500 to-rose-400' },
          { value: 'synth-bass' as SoundType, label: 'Synth Bass', icon: '🔊', color: 'from-green-500 to-teal-400' }
        ].map(({ value, label, icon, color }) => (
          <label key={value} className="relative group cursor-pointer">
            <input
              type="radio"
              name="soundType"
              value={value}
              checked={soundType === value}
              onChange={(e) => onSoundTypeChange(e.target.value as SoundType)}
              className="sr-only peer"
            />
            <div className={`p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
              soundType === value
                ? `bg-gradient-to-br ${color} border-white/50 text-white shadow-2xl shadow-purple-500/20`
                : 'glass-card text-gray-300 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10'
            }`}>
              <div className="text-center">
                <div className="text-3xl mb-2">{icon}</div>
                <div className="text-sm font-semibold leading-tight">{label}</div>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};