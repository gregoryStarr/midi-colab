import React from 'react';
import { WebContainerStarter } from '../WebContainerStarter';

interface CenterVisualizerProps {
  isWebContainerStarted: boolean;
  onStartEngine: () => void;
  networkActiveKeys: Set<number>;
  usersCount: number;
}

export function CenterVisualizer({ isWebContainerStarted, onStartEngine, networkActiveKeys, usersCount }: CenterVisualizerProps) {
  return (
    <div className="bg-[#0f0f13] rounded-2xl border border-white/5 relative overflow-hidden h-[400px] flex items-center justify-center shadow-inner">
      {isWebContainerStarted ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a20]/20 to-transparent pointer-events-none" />
          
          {/* Waveform SVG */}
          <div className="w-full h-full flex items-center justify-center p-8">
             <svg viewBox="0 0 800 300" className="w-full h-full drop-shadow-[0_0_15px_rgba(64,169,255,0.6)]">
                 <defs>
                     <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                         <stop offset="0%" stopColor="#2563eb" />
                         <stop offset="50%" stopColor="#06b6d4" />
                         <stop offset="100%" stopColor="#2563eb" />
                     </linearGradient>
                     <filter id="glow">
                         <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                         <feMerge>
                             <feMergeNode in="coloredBlur" />
                             <feMergeNode in="SourceGraphic" />
                         </feMerge>
                     </filter>
                 </defs>
                 
               <path
                 d={`M 0 150 ${networkActiveKeys.size > 0 ?
                   Array.from(networkActiveKeys).map((_key, i) => {
                     // Generate a more complex "audio-like" wave when keys are pressed
                     const nodes = 20; // smoothness
                     let points = '';
                     for(let j=0; j<=nodes; j++) {
                         const x = (i * (800/Math.max(networkActiveKeys.size, 1))) + (j * (800/Math.max(networkActiveKeys.size,1))/nodes);
                         const phase = Date.now() * 0.005 + i + j;
                         const amp = 50 + (Math.sin(phase) * 20);
                         const y = 150 + (Math.sin(phase * 0.5) * amp) * (Math.sin(j/nodes * Math.PI)); // Envelope
                         points += `L ${x} ${y} `;
                     }
                     return points;
                   }).join(' ') + ' L 800 150'
                   : 'M 0 150 Q 200 150 400 150 T 800 150' // Flat line when quiet
                 }`}
                 fill="none"
                 stroke="url(#neonGradient)"
                 strokeWidth="3"
                 filter="url(#glow)"
                 strokeLinecap="round"
                 className="transition-all duration-75"
               />
               
               {/* Center "Pulse" visual when quiet */}
               {networkActiveKeys.size === 0 && (
                   <path 
                     d="M 0 150 L 300 150 Q 320 150 330 120 L 350 180 L 370 100 L 390 200 L 410 130 L 430 160 L 450 150 L 800 150"
                     fill="none"
                     stroke="url(#neonGradient)"
                     strokeWidth="2"
                     strokeOpacity="0.5"
                     filter="url(#glow)"
                   >
                       <animate attributeName="stroke-opacity" values="0.2;0.6;0.2" dur="3s" repeatCount="indefinite" />
                   </path>
               )}
             </svg>
          </div>
          
          <div className="absolute top-4 left-4 flex gap-4">
              <div className="bg-black/40 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  LIVE
              </div>
              <div className="bg-black/40 backdrop-blur border border-white/10 px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                  <span className="text-gray-400">USERS</span>
                  <span className="font-bold">{usersCount}</span>
              </div>
          </div>
        </>
      ) : (
        <div className="text-center z-10">
            <div className="w-20 h-20 bg-[#1a1a20] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <span className="text-4xl">🎛️</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Initialize Engine</h3>
            <p className="text-gray-400 mb-6">Start the high-performance audio engine</p>
            <div className="flex justify-center">
                 <WebContainerStarter onStarted={onStartEngine} onError={console.error} />
            </div>
        </div>
      )}
    </div>
  );
}
