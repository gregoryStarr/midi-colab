import React from 'react';
import { WebContainerStarter } from '../WebContainerStarter';

interface EngineControlProps {
  script: string;
  isWebContainerStarted: boolean;
  onStarted: () => void;
  onError: (error: string) => void;
  onTestSound: () => void;
}

export const EngineControl: React.FC<EngineControlProps> = ({
  script,
  isWebContainerStarted,
  onStarted,
  onError,
  onTestSound
}) => {
  return (
    <div className="glass-card rounded-3xl p-8 hover:bg-white/10 transition-all duration-300 group">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
          <span className="text-white text-xl">⚙️</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Engine Control</h3>
          <p className="text-sm text-gray-400">Initialize the music engine</p>
        </div>
      </div>

      <div className="space-y-4">
        <WebContainerStarter
          script={script}
          onStarted={onStarted}
          onError={onError}
        />
        <button
          onClick={onTestSound}
          className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
        >
          <span className="flex items-center justify-center space-x-2">
            <span className="text-xl">🎵</span>
            <span>Test Sound</span>
          </span>
        </button>
      </div>
    </div>
  );
};