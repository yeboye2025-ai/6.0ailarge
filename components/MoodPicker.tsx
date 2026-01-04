
import React from 'react';
import { Mood } from '../types';
import { MOODS } from '../constants';

interface MoodPickerProps {
  selected: Mood;
  onSelect: (mood: Mood) => void;
  themeColor: string;
}

export const MoodPicker: React.FC<MoodPickerProps> = ({ selected, onSelect, themeColor }) => {
  const glowColors: Record<string, string> = {
    pink: 'rgba(236, 72, 153, 0.4)',
    purple: 'rgba(168, 85, 247, 0.4)',
    indigo: 'rgba(99, 102, 241, 0.4)'
  };

  const activeGlow = glowColors[themeColor as keyof typeof glowColors] || glowColors.pink;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Today's Vibe</p>
      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-1 -mx-1 px-1 no-scrollbar scroll-smooth">
        {MOODS.map((mood) => {
          const isSelected = selected === mood;
          return (
            <button
              key={mood}
              onClick={() => onSelect(mood)}
              className={`flex-shrink-0 relative w-14 h-14 flex items-center justify-center text-3xl rounded-[1.8rem] transition-all duration-500 ease-out transform ${
                isSelected 
                  ? `bg-white text-${themeColor}-600 scale-110 -translate-y-1 z-10` 
                  : 'bg-gray-50/40 text-gray-400 hover:bg-gray-50 hover:scale-105'
              }`}
              style={isSelected ? {
                boxShadow: `0 12px 25px -5px ${activeGlow}`
              } : {}}
            >
              {/* Organic Breathing Halo */}
              {isSelected && (
                <div className={`absolute inset-0 rounded-[1.8rem] border-2 border-${themeColor}-200 animate-mood-halo`} />
              )}
              
              <span className={`relative z-10 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                {mood}
              </span>
            </button>
          );
        })}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes mood-halo {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.25); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-mood-halo {
          animation: mood-halo 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};
