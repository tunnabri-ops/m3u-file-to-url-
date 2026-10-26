import React from 'react';
import { Layers, Star } from 'lucide-react';
import { AccentTheme } from '../types/playlist';
import { THEME_CONFIG } from '../utils/themeHelper';

interface CategoryTabsProps {
  groups: string[];
  selectedGroup: string;
  onSelectGroup: (group: string) => void;
  channelCountsByGroup: Record<string, number>;
  totalChannels: number;
  favoritesCount?: number;
  currentTheme?: AccentTheme;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
  channelCountsByGroup,
  totalChannels,
  favoritesCount = 0,
  currentTheme = 'cyan',
}) => {
  const theme = THEME_CONFIG[currentTheme];

  return (
    <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-b border-slate-800/60">
      {/* All Channels Tab */}
      <button
        onClick={() => onSelectGroup('ALL')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
          selectedGroup === 'ALL'
            ? `${theme.bgSubtle} ${theme.textAccent} border ${theme.borderAccent} shadow-sm`
            : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        <span>All Channels</span>
        <span
          className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
            selectedGroup === 'ALL' ? 'bg-white/10 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {totalChannels}
        </span>
      </button>

      {/* Favorites Dedicated Tab */}
      {favoritesCount > 0 && (
        <button
          onClick={() => onSelectGroup('__FAVORITES__')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
            selectedGroup === '__FAVORITES__'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'bg-slate-900/60 text-amber-400/80 hover:text-amber-300 border border-slate-800/80 hover:bg-slate-800/60'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>Favorites</span>
          <span
            className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
              selectedGroup === '__FAVORITES__' ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-amber-400'
            }`}
          >
            {favoritesCount}
          </span>
        </button>
      )}

      {groups.map((group) => {
        const count = channelCountsByGroup[group] || 0;
        const isSelected = selectedGroup === group;

        return (
          <button
            key={group}
            onClick={() => onSelectGroup(group)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              isSelected
                ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
            }`}
          >
            <span>{group}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
