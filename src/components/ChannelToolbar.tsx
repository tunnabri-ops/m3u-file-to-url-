import React from 'react';
import { Search, Filter, ArrowUpDown, LayoutGrid, List, X, Activity, Star, Sparkles, Film } from 'lucide-react';
import { FilterOptions, ViewMode, AccentTheme, ResolutionTag } from '../types/playlist';
import { THEME_CONFIG } from '../utils/themeHelper';

interface ChannelToolbarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  groups: string[];
  totalChannels: number;
  filteredCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  favoritesCount: number;
  resolutionCounts: Record<ResolutionTag, number>;
  currentTheme?: AccentTheme;
}

export const ChannelToolbar: React.FC<ChannelToolbarProps> = ({
  filters,
  onFilterChange,
  groups,
  totalChannels,
  filteredCount,
  viewMode,
  onViewModeChange,
  favoritesCount,
  resolutionCounts,
  currentTheme = 'cyan',
}) => {
  const theme = THEME_CONFIG[currentTheme];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, searchQuery: e.target.value });
  };

  const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, selectedGroup: e.target.value });
  };

  const handleResolutionChange = (res: FilterOptions['resolutionFilter']) => {
    onFilterChange({ ...filters, resolutionFilter: res });
  };

  const handleToggleFavorites = () => {
    onFilterChange({ ...filters, onlyFavorites: !filters.onlyFavorites });
  };

  const handleFormatChange = (format: FilterOptions['formatFilter']) => {
    onFilterChange({ ...filters, formatFilter: format });
  };

  const handleStatusFilterChange = (status: FilterOptions['statusFilter']) => {
    onFilterChange({ ...filters, statusFilter: status });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] });
  };

  const handleClearSearch = () => {
    onFilterChange({ ...filters, searchQuery: '' });
  };

  return (
    <div className="w-full space-y-3">
      {/* Search and Primary Filters Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search input with clear button */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search channels, logos, categories, resolution, or URLs..."
            className="w-full pl-9 pr-9 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/80"
          />
          {filters.searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Favorites Quick Filter Button */}
        <button
          onClick={handleToggleFavorites}
          title={filters.onlyFavorites ? 'Show all channels' : 'Filter by favorites'}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer shrink-0 ${
            filters.onlyFavorites
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm ring-1 ring-amber-500/40'
              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-amber-300'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${filters.onlyFavorites ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
          <span>Favorites</span>
          <span className="font-mono text-[11px] tabular-nums font-semibold">({favoritesCount})</span>
        </button>

        {/* Category / Group Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative shrink-0">
            <select
              value={filters.selectedGroup}
              onChange={handleGroupChange}
              aria-label="Filter channels by category or group"
              className="appearance-none pl-3 pr-8 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/80 cursor-pointer min-w-[140px]"
            >
              <option value="ALL">All Categories ({totalChannels})</option>
              {groups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Sort Selector */}
          <div className="relative shrink-0">
            <select
              value={filters.sortBy}
              onChange={handleSortChange}
              aria-label="Sort channels"
              className="appearance-none pl-3 pr-8 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500/80 cursor-pointer min-w-[130px]"
            >
              <option value="order">Default Order</option>
              <option value="name-asc">Channel Name (A-Z)</option>
              <option value="name-desc">Channel Name (Z-A)</option>
              <option value="group-asc">Category (A-Z)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-xl shrink-0">
            <button
              onClick={() => onViewModeChange('list')}
              title="List view"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? `bg-slate-800 ${theme.textAccent}`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              title="Grid card view"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? `bg-slate-800 ${theme.textAccent}`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Sub-row: Resolution & Quality Filter + Status & Protocol Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
        <div className="flex flex-wrap items-center gap-4">
          {/* Resolution & Quality Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
              <Film className="w-3 h-3 text-cyan-400" />
              <span>Quality:</span>
            </span>
            {(['ALL', '4K', 'FHD', 'HD', 'SD'] as const).map((res) => {
              const count = res === 'ALL' ? totalChannels : resolutionCounts[res] || 0;
              const isSelected = filters.resolutionFilter === res;
              return (
                <button
                  key={res}
                  onClick={() => handleResolutionChange(res)}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? res === '4K'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : res === 'FHD'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                        : res === 'HD'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span>{res}</span>
                  {res !== 'ALL' && count > 0 && (
                    <span className="text-[10px] opacity-75 font-normal">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 mr-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Status:</span>
            </span>
            {(['ALL', 'LIVE', 'OFFLINE', 'UNCHECKED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => handleStatusFilterChange(st)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                  filters.statusFilter === st
                    ? st === 'LIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium'
                      : st === 'OFFLINE'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-medium'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'LIVE' ? 'Live' : st === 'OFFLINE' ? 'Offline' : 'Unchecked'}
              </button>
            ))}
          </div>

          {/* Protocol filter */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 mr-1">Format:</span>
            {(['ALL', 'HLS', 'MP4', 'TS'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleFormatChange(fmt)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                  filters.formatFilter === fmt
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-medium'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-mono tabular-nums shrink-0">
          Showing <span className="text-slate-200 font-medium">{filteredCount}</span> of {totalChannels}
        </div>
      </div>
    </div>
  );
};
