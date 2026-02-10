import React from 'react';

type SoundType = 'piano' | 'electric-guitar' | 'sax' | 'synth' | 'hard-synth' | 'synth-bass';

interface SoundSelectionProps {
  soundType: SoundType;
  onSoundTypeChange: (type: SoundType) => void;
}

export const SoundSelection: React.FC<SoundSelectionProps> = ({ soundType, onSoundTypeChange }) => {
  const instruments = [
    {
      value: 'piano' as SoundType,
      label: 'Piano',
      icon: '🎹',
      gradient: 'from-blue-500 to-cyan-400',
      description: 'Classic acoustic piano',
      notes: ['C4', 'E4', 'G4']
    },
    {
      value: 'electric-guitar' as SoundType,
      label: 'Electric Guitar',
      icon: '🎸',
      gradient: 'from-red-500 to-pink-400',
      description: 'Rock electric guitar',
      notes: ['E2', 'A2', 'D3']
    },
    {
      value: 'sax' as SoundType,
      label: 'Saxophone',
      icon: '🎷',
      gradient: 'from-yellow-500 to-orange-400',
      description: 'Smooth jazz saxophone',
      notes: ['D4', 'F#4', 'A4']
    },
    {
      value: 'synth' as SoundType,
      label: 'Synth',
      icon: '🎛️',
      gradient: 'from-purple-500 to-indigo-400',
      description: 'Digital synthesizer',
      notes: ['C3', 'F3', 'A3']
    },
    {
      value: 'hard-synth' as SoundType,
      label: 'Hard Synth',
      icon: '⚡',
      gradient: 'from-pink-500 to-rose-400',
      description: 'Aggressive synth lead',
      notes: ['C2', 'G2', 'C3']
    },
    {
      value: 'synth-bass' as SoundType,
      label: 'Synth Bass',
      icon: '🔊',
      gradient: 'from-green-500 to-teal-400',
      description: 'Deep bass synthesizer',
      notes: ['C1', 'E1', 'G1']
    }
  ];

  return (
    <div className="relative group">
      {/* Container with glassmorphism */}
      <div className="relative rounded-3xl overflow-hidden">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>

        {/* Content */}
        <div className="relative bg-gradient-to-br from-slate-900/95 via-green-900/90 to-slate-900/95 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 hover:bg-white/5 transition-all duration-500">
          {/* Header */}
          <div className="flex items-center mb-8 relative z-10">
            <div className="relative mr-5 group/icon">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/40 transform group-hover/icon:scale-110 transition-all duration-500">
                <span className="text-white text-2xl drop-shadow-xl">🎼</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-green-300 to-emerald-400 rounded-3xl blur-lg opacity-50 animate-pulse scale-110"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1 bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
                Sound Selection
              </h3>
              <p className="text-base text-gray-400 font-medium">Choose your instrument and create music</p>
            </div>
          </div>

          {/* Instrument Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {instruments.map(({ value, label, icon, gradient, description, notes }) => (
              <label key={value} className="relative group/instrument cursor-pointer block">
                <input
                  type="radio"
                  name="soundType"
                  value={value}
                  checked={soundType === value}
                  onChange={(e) => onSoundTypeChange(e.target.value as SoundType)}
                  className="sr-only peer"
                />

                {/* Main card */}
                <div className={`relative p-6 rounded-3xl border-2 transition-all duration-500 transform hover:scale-105 group-hover:shadow-2xl ${
                  soundType === value
                    ? `bg-gradient-to-br ${gradient} border-white/60 text-white shadow-2xl shadow-purple-500/30 animate-success-glow`
                    : `bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl text-gray-300 hover:bg-white/10 hover:border-white/40 hover:shadow-xl hover:shadow-white/10`
                }`}>

                  {/* Background effects */}
                  <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover/instrument:opacity-20 transition-opacity duration-300 ${
                    soundType === value ? 'bg-white/10' : `bg-gradient-to-br ${gradient}`
                  }`}></div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        <div className={`text-4xl mb-2 transform group-hover/instrument:scale-110 transition-transform duration-300 ${
                          soundType === value ? 'animate-bounce' : ''
                        }`}>
                          {icon}
                        </div>
                        {soundType === value && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>
                        )}
                      </div>

                      {/* Selection indicator */}
                      {soundType === value && (
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <h4 className={`text-lg font-bold mb-1 ${
                        soundType === value ? 'text-white' : 'text-gray-200 group-hover/instrument:text-white'
                      } transition-colors duration-300`}>
                        {label}
                      </h4>
                      <p className={`text-sm font-medium ${
                        soundType === value ? 'text-white/90' : 'text-gray-400 group-hover/instrument:text-gray-300'
                      } transition-colors duration-300`}>
                        {description}
                      </p>
                    </div>

                    {/* Musical notes visualization */}
                    <div className="flex items-center space-x-1">
                      {notes.map((note, i) => (
                        <div
                          key={note}
                          className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            soundType === value
                              ? 'bg-white/20 text-white'
                              : 'bg-white/10 text-gray-400 group-hover/instrument:bg-white/20 group-hover/instrument:text-gray-300'
                          } transition-all duration-300`}
                          style={{ animationDelay: `${i * 0.1}s` }}
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hover particles */}
                  <div className="absolute inset-0 opacity-0 group-hover/instrument:opacity-100 transition-opacity duration-500 pointer-events-none">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={`instrument-particle-${value}-${i}`}
                        className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                        style={{
                          left: `${20 + i * 20}%`,
                          top: `${30 + i * 15}%`,
                          animationDelay: `${i * 0.15}s`
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Selection glow */}
                  {soundType === value && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-3xl blur-xl opacity-30 animate-pulse`}></div>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Current selection info */}
          <div className="mt-8 p-4 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Currently Selected</div>
                <div className="text-lg font-bold text-white">
                  {instruments.find(inst => inst.value === soundType)?.label}
                </div>
              </div>
              <div className="text-3xl animate-pulse">
                {instruments.find(inst => inst.value === soundType)?.icon}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};