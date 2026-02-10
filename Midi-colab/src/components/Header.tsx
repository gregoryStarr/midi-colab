import React from 'react';

interface HeaderProps {
  isConnected: boolean;
  isWebContainerStarted: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, isWebContainerStarted }) => {
  return (
    <header className="relative overflow-hidden">
      {/* Dynamic Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-2xl border-b border-white/20"></div>

      {/* Animated Gradient Mesh */}
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-600/30 to-pink-500/20 animate-gradient-x"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-orange-500/10 animate-gradient-xy"></div>
      </div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-30 animate-float-random"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          >
            {i % 4 === 0 && (
              <div className="w-16 h-16 border border-cyan-400/20 rounded-full animate-spin-slow"></div>
            )}
            {i % 4 === 1 && (
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rotate-45 animate-pulse"></div>
            )}
            {i % 4 === 2 && (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400/15 to-cyan-400/15 rounded-lg animate-bounce-slow"></div>
            )}
            {i % 4 === 3 && (
              <div className="w-6 h-6 border-2 border-orange-400/20 rounded-full animate-ping"></div>
            )}
          </div>
        ))}
      </div>

      {/* Particle System */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-particle-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Enhanced Logo Section */}
          <div className="flex items-center space-x-6">
            <div className="relative group">
              {/* Main Logo Container */}
              <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/40 transform group-hover:scale-110 transition-all duration-700 ease-out">
                <span className="text-white font-display text-4xl drop-shadow-2xl animate-pulse-glow">♪</span>
                {/* Inner glow */}
                <div className="absolute inset-2 bg-gradient-to-br from-cyan-300/20 to-purple-300/20 rounded-xl blur-sm animate-pulse"></div>
              </div>

              {/* Multiple Glow Rings */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl blur-xl opacity-60 animate-pulse scale-110"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-pink-400 to-orange-500 rounded-2xl blur-2xl opacity-40 animate-pulse scale-125" style={{ animationDelay: '0.5s' }}></div>

              {/* Floating Music Notes */}
              <div className="absolute -top-2 -right-2 w-4 h-4 text-cyan-300 animate-bounce opacity-80" style={{ animationDelay: '0.2s' }}>♪</div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 text-purple-300 animate-bounce opacity-60" style={{ animationDelay: '0.8s' }}>♫</div>
            </div>

            <div className="relative z-10">
              <h1 className="text-5xl font-display text-white tracking-wider mb-2 bg-gradient-to-r from-white via-cyan-200 via-purple-200 to-pink-200 bg-clip-text text-transparent animate-gradient-text">
                MIDI Colab
              </h1>
              <p className="text-base text-gray-300 font-medium tracking-widest uppercase text-sm bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                Real-time collaborative music creation
              </p>
            </div>
          </div>

          {/* Enhanced Status Indicators */}
          <div className="flex items-center space-x-4 relative z-10">
            {/* Connection Status */}
            <div className={`group relative flex items-center space-x-4 px-6 py-4 rounded-2xl text-sm font-bold backdrop-blur-xl border transition-all duration-700 hover:scale-105 ${
              isConnected
                ? 'bg-gradient-to-r from-emerald-500/25 to-green-500/25 text-emerald-100 border-emerald-400/40 shadow-2xl shadow-emerald-500/30 animate-success-glow'
                : 'bg-gradient-to-r from-red-500/25 to-pink-500/25 text-red-100 border-red-400/40 shadow-xl shadow-red-500/20'
            }`}>
              <div className="relative">
                <div className={`w-4 h-4 rounded-full animate-pulse ${isConnected ? 'bg-emerald-300 shadow-lg shadow-emerald-300/60' : 'bg-red-300'}`}></div>
                {isConnected && (
                  <div className="absolute inset-0 bg-emerald-300 rounded-full animate-ping opacity-75"></div>
                )}
              </div>
              <span className="font-semibold tracking-wide">{isConnected ? 'Connected' : 'Disconnected'}</span>
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Engine Status */}
            <div className={`group relative flex items-center space-x-4 px-6 py-4 rounded-2xl text-sm font-bold backdrop-blur-xl border transition-all duration-700 hover:scale-105 ${
              isWebContainerStarted
                ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-100 border-cyan-400/40 shadow-2xl shadow-cyan-500/30 animate-engine-glow'
                : 'bg-gradient-to-r from-yellow-500/25 to-orange-500/25 text-yellow-100 border-yellow-400/40 shadow-xl shadow-yellow-500/20'
            }`}>
              <div className="relative">
                <div className={`w-4 h-4 rounded-full animate-pulse ${isWebContainerStarted ? 'bg-cyan-300 shadow-lg shadow-cyan-300/60' : 'bg-yellow-300'}`}></div>
                {isWebContainerStarted && (
                  <div className="absolute inset-0 bg-cyan-300 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.3s' }}></div>
                )}
              </div>
              <span className="font-semibold tracking-wide">{isWebContainerStarted ? 'Engine Ready' : 'Engine Starting'}</span>
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Bottom Border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/60 via-purple-400/60 via-pink-400/60 to-transparent animate-gradient-flow"></div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
    </header>
  );
};