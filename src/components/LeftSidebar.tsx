import React, { useState } from 'react';
import { User } from '../lib/midi-colab/types';

interface LeftSidebarProps {
  users: User[];
  isConnected: boolean;
  isEngineReady: boolean;
}

export function LeftSidebar({ users, isConnected, isEngineReady }: LeftSidebarProps) {
  const [search, setSearch] = useState('');

  const categories = [
    { name: 'Bass Synths', icon: '🎸' },
    { name: 'Bessz Synths', icon: '🎹' },
    { name: 'Leads', icon: '🎼' },
    { name: 'Atmosphere', icon: '🌫️' },
    { name: 'Drums', icon: '🥁' },
    { name: 'Trap Kit', icon: '💊' },
    { name: '8kap Kit', icon: '🧢' },
    { name: 'Bitcrush Reverb', icon: '🔊' },
  ];

  return (
    <div className="bg-[#0f0f13] rounded-2xl p-5 border border-white/5 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4">Presets</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border border-yellow-500/50 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          />
          <span className="absolute left-3 top-2.5 text-yellow-500">🔍</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="flex items-center space-x-3 p-3 hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
          >
            <span className="text-gray-500 group-hover:text-yellow-500 transition-colors">{cat.icon}</span>
            <span className="text-gray-400 group-hover:text-white transition-colors font-medium">
              {cat.name}
            </span>
          </div>
        ))}
      </div>

      {/* Session/Collaborators Section (Preserved Functionality) */}
      <div className="border-t border-white/10 pt-4 mt-auto">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Session Status</h4>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
             <span className="text-gray-400">Network</span>
             <span className={isConnected ? 'text-green-400' : 'text-red-400'}>●</span>
          </div>
          <div className="flex justify-between items-center text-sm">
             <span className="text-gray-400">Audio Engine</span>
             <span className={isEngineReady ? 'text-blue-400' : 'text-yellow-400'}>●</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Collaborators</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white">{users.length}</span>
        </div>
        {users.length > 0 && (
            <div className="flex -space-x-2 mt-2 overflow-hidden">
                {users.map((u, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-gray-700 border border-[#0f0f13] flex items-center justify-center text-[10px] text-white" title={u.name}>
                        {u.name[0]}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
