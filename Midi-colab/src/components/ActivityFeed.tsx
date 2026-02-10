import React from 'react';
import type { User } from '../lib/midi-colab/types';

interface ActivityFeedProps {
  logs: string[];
  networkActiveKeys: Set<number>;
  users: User[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, networkActiveKeys, users }) => {
  return (
    <div className="relative group">
      {/* Container with glassmorphism */}
      <div className="relative rounded-3xl overflow-hidden">
        {/* Outer glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>

        {/* Content */}
        <div className="relative bg-gradient-to-br from-slate-900/95 via-yellow-900/90 to-slate-900/95 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 hover:bg-white/5 transition-all duration-500">
          {/* Header */}
          <div className="flex items-center mb-8 relative z-10">
            <div className="relative mr-5 group/icon">
              <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-yellow-500/40 transform group-hover/icon:scale-110 transition-all duration-500">
                <span className="text-white text-2xl drop-shadow-xl">📊</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-3xl blur-lg opacity-50 animate-pulse scale-110"></div>
              {/* Activity indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1 bg-gradient-to-r from-white via-yellow-200 to-amber-200 bg-clip-text text-transparent">
                Activity Feed
              </h3>
              <p className="text-base text-gray-400 font-medium">Real-time collaboration metrics</p>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
            {/* Active Keys Card */}
            <div className="group/stat relative p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-3xl border border-blue-400/20 hover:border-blue-400/40 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-3xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="text-4xl font-black text-blue-300 mb-2 animate-pulse-glow">
                  {networkActiveKeys.size}
                </div>
                <div className="text-base font-bold text-blue-200 mb-1">Active Keys</div>
                <div className="text-sm text-blue-400/80">Notes being played</div>
                {/* Visual indicator */}
                <div className="flex justify-center mt-3 space-x-1">
                  {[...Array(Math.min(networkActiveKeys.size, 5))].map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Connected Users Card */}
            <div className="group/stat relative p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-3xl border border-green-400/20 hover:border-green-400/40 transition-all duration-500 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl opacity-0 group-hover/stat:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="text-4xl font-black text-green-300 mb-2 animate-pulse-glow">
                  {users.length}
                </div>
                <div className="text-base font-bold text-green-200 mb-1">Collaborators</div>
                <div className="text-sm text-green-400/80">Online musicians</div>
                {/* User avatars */}
                <div className="flex justify-center mt-3 -space-x-2">
                  {users.slice(0, 4).map((user, i) => (
                    <div
                      key={user.id}
                      className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center text-xs font-bold"
                      style={{
                        backgroundColor: user.color,
                        zIndex: users.length - i
                      }}
                      title={user.name}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {users.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white">
                      +{users.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Activity Log */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-white">Recent Activity</h4>
              <div className="text-sm text-gray-400 font-medium">
                {logs.length} events
              </div>
            </div>

            <div className="relative max-h-64 overflow-y-auto bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              {/* Scroll indicator */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"></div>

              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3 opacity-50">🎵</div>
                  <div className="text-gray-400 font-medium">No activity yet</div>
                  <div className="text-sm text-gray-500 mt-1">Start playing to see events here</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.slice(-6).reverse().map((log, i) => (
                    <div
                      key={`${log}-${i}`}
                      className="group/log relative p-3 bg-gradient-to-r from-slate-700/30 to-slate-800/30 backdrop-blur-sm rounded-xl border border-white/5 hover:border-yellow-400/20 hover:bg-yellow-500/5 transition-all duration-300"
                    >
                      {/* Log type indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-400 to-amber-400 rounded-l-xl opacity-0 group-hover/log:opacity-100 transition-opacity duration-300"></div>

                      <div className="flex items-start space-x-3">
                        {/* Event icon */}
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400/20 to-amber-400/20 flex items-center justify-center mt-0.5">
                          <div className={`w-2 h-2 rounded-full ${
                            log.includes('Processed') ? 'bg-green-400 animate-pulse' :
                            log.includes('Error') ? 'bg-red-400' :
                            log.includes('Network') ? 'bg-blue-400 animate-pulse' :
                            'bg-yellow-400'
                          }`}></div>
                        </div>

                        {/* Log content */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-300 font-mono leading-relaxed break-words">
                            {log}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover/log:opacity-100 transition-opacity duration-300">
                            {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {/* Hover effect particles */}
                      <div className="absolute inset-0 opacity-0 group-hover/log:opacity-100 transition-opacity duration-500 pointer-events-none">
                        {[...Array(2)].map((_, particleI) => (
                          <div
                            key={`log-particle-${i}-${particleI}`}
                            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-ping"
                            style={{
                              left: `${20 + particleI * 40}%`,
                              top: `${30 + particleI * 20}%`,
                              animationDelay: `${particleI * 0.2}s`
                            }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom fade */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Live indicator */}
          <div className="mt-6 flex items-center justify-center space-x-2 relative z-10">
            <div className="relative">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-60"></div>
            </div>
            <span className="text-sm font-medium text-green-300">Live Updates</span>
          </div>
        </div>
      </div>
    </div>
  );
};