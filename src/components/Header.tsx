import React from 'react';

interface HeaderProps {
  isConnected: boolean;
  isWebContainerStarted: boolean;
  audioContextState?: string;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, isWebContainerStarted, audioContextState }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-display text-2xl">♪</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">MIDI Colab</h1>
              <p className="text-sm text-slate-400">Real-time collaborative music</p>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm text-slate-300 font-medium">
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>

            {/* Engine Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isWebContainerStarted ? 'bg-blue-400' : 'bg-yellow-400'
              }`}></div>
              <span className="text-sm text-slate-300 font-medium">
                {isWebContainerStarted ? 'Engine Ready' : 'Initializing...'}
              </span>
            </div>

            {/* Audio Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                audioContextState === 'running' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></div>
              <span className="text-sm text-slate-300 font-medium">
                Audio {audioContextState === 'running' ? 'Active' : 'Locked'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};