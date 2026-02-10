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
    <div className="relative group">
      {/* Multi-layered Glassmorphism Container */}
      <div className="relative rounded-3xl overflow-hidden">
        {/* Outer glow ring */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-600/20 to-pink-500/20 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>

        {/* Gradient border */}
        <div className="absolute inset-0 p-1 bg-gradient-to-r from-cyan-400/30 via-purple-500/30 to-pink-400/30 rounded-3xl">
          <div className="bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-2xl rounded-3xl h-full w-full border border-white/10"></div>
        </div>

        {/* Content container */}
        <div className="relative p-10 hover:bg-white/5 transition-all duration-500">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-xl animate-float-slow"></div>
            <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-lg animate-float-reverse"></div>
          </div>

          {/* Enhanced Header */}
          <div className="flex items-center mb-10 relative z-10">
            <div className="relative mr-6 group/icon">
              {/* Main icon container */}
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/40 transform group-hover/icon:scale-110 transition-all duration-500 relative z-10">
                <span className="text-white text-3xl drop-shadow-xl">⚙️</span>
              </div>

              {/* Multiple glow layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-3xl blur-lg opacity-50 animate-pulse scale-110"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-3xl blur-xl opacity-30 animate-pulse scale-125" style={{ animationDelay: '0.3s' }}></div>

              {/* Rotating elements */}
              <div className="absolute inset-0 border-2 border-cyan-400/30 rounded-3xl animate-spin-slow" style={{ animationDuration: '8s' }}></div>
            </div>

            <div className="flex-1">
              <h3 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                Engine Control
              </h3>
              <p className="text-base text-gray-400 font-medium leading-relaxed">
                Initialize the music engine and test audio output
              </p>
            </div>
          </div>

          {/* Controls Section */}
          <div className="space-y-8 relative z-10">
            {/* WebContainer Starter */}
            <div className="relative group/starter">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover/starter:opacity-50 transition-opacity duration-500"></div>
              <div className="relative">
                <WebContainerStarter
                  script={script}
                  onStarted={onStarted}
                  onError={onError}
                />
              </div>
            </div>

            {/* Enhanced Test Sound Button */}
            <div className="relative group/button">
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 rounded-3xl blur-2xl opacity-0 group-hover/button:opacity-60 transition-opacity duration-500"></div>

              <button
                onClick={onTestSound}
                className="relative w-full overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 text-white font-bold py-6 px-10 rounded-3xl transition-all duration-700 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/40 focus:outline-none focus:ring-4 focus:ring-purple-500/50 group-inner"
              >
                {/* Animated background layers */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 opacity-0 group-hover/button:opacity-50 transition-opacity duration-500" style={{ animationDelay: '0.2s' }}></div>

                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 opacity-0 group-hover/button:opacity-100 transition-opacity duration-300 animate-shimmer"></div>

                <div className="relative flex items-center justify-center space-x-4">
                  <div className="relative">
                    <div className="text-3xl animate-bounce group-hover/button:animate-pulse">🎵</div>
                    <div className="absolute inset-0 text-3xl animate-ping opacity-0 group-hover/button:opacity-60">🎵</div>
                  </div>
                  <span className="text-xl tracking-wider font-extrabold">Test Sound</span>
                </div>

                {/* Particle effects */}
                <div className="absolute inset-0 opacity-0 group-hover/button:opacity-100 transition-opacity duration-500">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={`test-particle-${i}`}
                      className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                      style={{
                        left: `${15 + i * 10}%`,
                        top: `${25 + (i % 3) * 25}%`,
                        animationDelay: `${i * 0.1}s`,
                        animationDuration: '1.5s'
                      }}
                    ></div>
                  ))}
                </div>

                {/* Sound wave visualization */}
                <div className="absolute inset-0 opacity-0 group-hover/button:opacity-30 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={`wave-${i}`}
                        className="w-1 bg-white rounded-full animate-pulse"
                        style={{
                          height: `${20 + i * 8}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.8s'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              </button>
            </div>

            {/* Enhanced Status Indicator */}
            <div className="flex items-center justify-center space-x-3 relative">
              <div className="relative">
                <div className={`w-4 h-4 rounded-full animate-pulse transition-all duration-500 ${
                  isWebContainerStarted
                    ? 'bg-gradient-to-r from-emerald-400 to-green-400 shadow-lg shadow-emerald-400/60'
                    : 'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-lg shadow-yellow-400/60'
                }`}></div>

                {/* Status glow */}
                <div className={`absolute inset-0 rounded-full blur-md animate-pulse transition-all duration-500 ${
                  isWebContainerStarted
                    ? 'bg-emerald-400/50'
                    : 'bg-yellow-400/50'
                }`}></div>

                {/* Active indicator */}
                {isWebContainerStarted && (
                  <div className="absolute inset-0 bg-emerald-300 rounded-full animate-ping opacity-60"></div>
                )}
              </div>

              <div className="text-center">
                <span className={`text-lg font-bold tracking-wide ${
                  isWebContainerStarted ? 'text-emerald-300' : 'text-yellow-300'
                }`}>
                  {isWebContainerStarted ? 'Engine Active' : 'Engine Standby'}
                </span>
                <div className={`text-sm font-medium mt-1 ${
                  isWebContainerStarted ? 'text-emerald-400' : 'text-yellow-400'
                }`}>
                  {isWebContainerStarted ? 'Ready for music creation' : 'Initializing components...'}
                </div>
              </div>

              {/* Status particles */}
              {isWebContainerStarted && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={`status-particle-${i}`}
                      className="absolute w-1 h-1 bg-emerald-400 rounded-full animate-ping opacity-60"
                      style={{
                        left: `${20 + i * 30}%`,
                        top: `${30 + i * 20}%`,
                        animationDelay: `${i * 0.3}s`
                      }}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};