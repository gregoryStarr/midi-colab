import React from 'react';

interface HeaderProps {
  isConnected: boolean;
  isWebContainerStarted: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, isWebContainerStarted }) => {
  return (
    <header className="backdrop-blur-md bg-black/30 border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-2xl flex items-center justify-center animate-pulse-glow">
              <span className="text-white font-display text-2xl">♪</span>
            </div>
            <div>
              <h1 className="text-3xl font-display text-white tracking-wide">MIDI Colab</h1>
              <p className="text-sm text-gray-400 font-medium">Real-time collaborative music creation</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold glass-card transition-all duration-300 ${
              isConnected
                ? 'bg-green-500/20 text-green-300 border-green-500/30 shadow-lg shadow-green-500/20'
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              <div className={`w-3 h-3 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            <div className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold glass-card transition-all duration-300 ${
              isWebContainerStarted
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 shadow-lg shadow-blue-500/20'
                : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            }`}>
              <div className={`w-3 h-3 rounded-full animate-pulse ${isWebContainerStarted ? 'bg-blue-400' : 'bg-yellow-400'}`}></div>
              <span>{isWebContainerStarted ? 'Engine Ready' : 'Engine Starting'}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};