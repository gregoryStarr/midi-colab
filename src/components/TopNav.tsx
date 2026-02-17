import React from 'react';

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  const tabs = ['All', 'Producers', 'Vocalists', 'Artists', 'Industry', 'Technology', 'Reviews', 'DJs'];

  return (
    <div className="flex justify-between items-center mb-6 px-2">
      <div className="flex gap-6 text-sm font-medium overflow-x-auto no-scrollbar">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => onTabChange(item)}
            className={`transition-colors whitespace-nowrap ${
              activeTab === item
                ? 'text-black bg-yellow-500 px-4 py-1.5 rounded-full font-bold'
                : 'text-gray-400 hover:text-white px-2 py-1.5'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <button className="bg-yellow-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition whitespace-nowrap ml-4">
        Read Full Article
      </button>
    </div>
  );
}
