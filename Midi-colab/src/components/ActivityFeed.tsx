import React from 'react';
import type { User } from '../lib/midi-colab/types';

interface ActivityFeedProps {
  logs: string[];
  networkActiveKeys: Set<number>;
  users: User[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, networkActiveKeys, users }) => {
  return (
    <div className="glass-card rounded-3xl p-8 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-400 rounded-2xl flex items-center justify-center mr-4">
          <span className="text-white text-xl">📊</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">Activity Feed</h3>
          <p className="text-sm text-gray-400">Live collaboration stats</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 glass-card rounded-2xl">
          <div className="text-2xl font-bold text-blue-400">{networkActiveKeys.size}</div>
          <div className="text-sm text-gray-400">Active Keys</div>
        </div>
        <div className="text-center p-4 glass-card rounded-2xl">
          <div className="text-2xl font-bold text-green-400">{users.length}</div>
          <div className="text-sm text-gray-400">Connected</div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {logs.slice(-4).map((log, i) => (
          <div key={i} className="text-sm text-gray-400 bg-black/30 rounded-xl p-3 font-mono border border-white/5">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};