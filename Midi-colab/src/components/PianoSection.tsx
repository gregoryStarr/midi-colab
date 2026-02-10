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
    <div className="relative group">
      {/* Immersive Background */}
      <div className="absolute inset-0 -z-10">
        {/* Dynamic gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95"></div>

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/15 via-pink-600/20 to-orange-500/15 rounded-full blur-3xl animate-float-complex"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-blue-600/15 rounded-full blur-3xl animate-float-reverse"></div>

        {/* Musical staff lines (decorative) */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-400/20 to-transparent animate-pulse-slow" style={{ transform: 'translateY(20px)' }}></div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent animate-pulse-slow" style={{ transform: 'translateY(-20px)' }}></div>

        {/* Floating musical notes */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`music-note-${i}`}
            className="absolute text-2xl opacity-20 animate-float-random text-purple-300"
            style={{
              left: `${10 + i * 12}%`,
              top: `${20 + (i % 3) * 20}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          >
            {['♪', '♫', '♬', '♩'][i % 4]}
          </div>
        ))}

        {/* Particle system */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`piano-particle-${i}`}
            className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400/40 to-purple-400/40 rounded-full animate-particle-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${8 + Math.random() * 6}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main Content Container */}
      <div className="relative backdrop-blur-2xl bg-gradient-to-br from-slate-900/80 via-purple-900/70 to-slate-900/80 rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all duration-700">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center space-x-6">
            {/* Main logo */}
            <div className="relative group/logo">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-500/50 transform group-hover/logo:scale-110 transition-all duration-700 relative z-10">
                <span className="text-white font-display text-5xl drop-shadow-2xl animate-pulse-glow">♪</span>
              </div>

              {/* Multiple glow rings */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300 to-purple-400 rounded-3xl blur-xl opacity-60 animate-pulse scale-110"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-orange-400 rounded-3xl blur-2xl opacity-40 animate-pulse scale-125" style={{ animationDelay: '0.3s' }}></div>

              {/* Musical note accents */}
              <div className="absolute -top-2 -right-2 text-cyan-300 animate-bounce opacity-80">♪</div>
              <div className="absolute -bottom-1 -left-1 text-purple-300 animate-bounce opacity-60" style={{ animationDelay: '0.5s' }}>♫</div>
            </div>

            <div className="flex-1">
              <h2 className="text-5xl font-display text-white tracking-wider mb-2 bg-gradient-to-r from-white via-cyan-200 via-purple-200 via-pink-200 to-white bg-clip-text text-transparent animate-gradient-text">
                Virtual Piano
              </h2>
              <p className="text-xl text-gray-300 font-medium leading-relaxed">
                Play beautiful music with collaborators worldwide
              </p>
            </div>
          </div>

          {/* Enhanced Status Indicators */}
          <div className="flex items-center space-x-8 relative z-10">
            {/* Live Session Badge */}
            <div className="flex items-center space-x-3 px-6 py-3 rounded-full backdrop-blur-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 border border-white/20 shadow-2xl shadow-purple-500/20 group/status">
              <div className="relative">
                <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-300 to-pink-300 rounded-full animate-ping opacity-60"></div>
              </div>
              <span className="text-base font-bold text-white tracking-wide">Live Session</span>
              {/* Hover shimmer */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 opacity-0 group-hover/status:opacity-100 transition-opacity duration-500 animate-shimmer"></div>
            </div>

            {/* Active Notes Counter */}
            <div className="text-center">
              <div className="text-3xl font-black text-cyan-300 mb-1 animate-pulse-glow">
                {networkActiveKeys.size}
              </div>
              <div className="text-sm font-bold text-cyan-400 tracking-wider uppercase">Active Notes</div>
              {/* Visual notes indicator */}
              <div className="flex justify-center mt-2 space-x-1">
                {[...Array(Math.min(networkActiveKeys.size, 6))].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-4 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Current Instrument */}
            <div className="text-center">
              <div className="text-2xl mb-1">
                {soundType === 'piano' && '🎹'}
                {soundType === 'electric-guitar' && '🎸'}
                {soundType === 'sax' && '🎷'}
                {soundType === 'synth' && '🎛️'}
                {soundType === 'hard-synth' && '⚡'}
                {soundType === 'synth-bass' && '🔊'}
              </div>
              <div className="text-sm font-bold text-purple-300 capitalize tracking-wide">
                {soundType.replace('-', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Piano Container with Enhanced Styling */}
        <div className="relative z-10">
          {isWebContainerStarted ? (
            <div className="relative group/piano">
              {/* Piano glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl blur-2xl opacity-0 group-hover/piano:opacity-50 transition-opacity duration-700"></div>

              {/* Piano content */}
              <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-400/20 transition-all duration-500">
                <VirtualPiano
                  engine={engine}
                  networkActiveKeys={networkActiveKeys}
                  soundType={soundType}
                  onProcessed={onProcessed}
                />
              </div>

              {/* Performance indicators */}
              <div className="mt-6 flex items-center justify-center space-x-8 text-sm">
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-400/20">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-300 font-medium">Engine Ready</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-400/20">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-blue-300 font-medium">Network Active</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-400/20">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-purple-300 font-medium">Real-time Sync</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative py-20">
              {/* Loading state with enhanced visuals */}
              <div className="text-center relative z-10">
                {/* Animated piano icon */}
                <div className="relative mb-8 inline-block">
                  <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/40 animate-pulse">
                    <span className="text-white text-6xl drop-shadow-xl">🎹</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-300 to-purple-400 rounded-3xl blur-xl opacity-50 animate-pulse scale-110"></div>
                </div>

                <h3 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                  Initializing Piano Engine
                </h3>
                <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                  Setting up the music engine and connecting to the collaborative network...
                </p>

                {/* Loading animation */}
                <div className="flex justify-center space-x-2 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-12 bg-gradient-to-t from-cyan-400 to-purple-400 rounded-full animate-pulse"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '1.5s'
                      }}
                    ></div>
                  ))}
                </div>

                <div className="text-sm text-gray-400 font-medium">
                  Please wait while we prepare your musical experience
                </div>
              </div>

              {/* Background loading particles */}
              <div className="absolute inset-0 opacity-30">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`loading-particle-${i}`}
                    className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-ping"
                    style={{
                      left: `${20 + i * 12}%`,
                      top: `${30 + (i % 2) * 40}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: '2s'
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 via-purple-400/60 via-pink-400/60 to-transparent animate-gradient-flow"></div>
      </div>
    </div>
  );
};