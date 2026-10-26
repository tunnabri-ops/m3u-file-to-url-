import React, { useState } from 'react';
import { Play, Copy, Check, Tv, Edit3, Trash2, Plus } from 'lucide-react';
import { Channel, ViewMode, StreamHealthResult } from '../types/playlist';
import { StatusBadge } from './StatusBadge';

interface ChannelListProps {
  channels: Channel[];
  viewMode: ViewMode;
  onPlayChannel: (channel: Channel) => void;
  onCopyUrl: (url: string, id: string) => void;
  copiedId: string | null;
  streamHealthMap: Record<string, StreamHealthResult>;
  onCheckChannel: (channel: Channel) => void;
  checkingUrls: Set<string>;
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (channelId: string) => void;
  onAddNewChannel: () => void;
  currentPage: number;
  pageSize: number;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  viewMode,
  onPlayChannel,
  onCopyUrl,
  copiedId,
  streamHealthMap,
  onCheckChannel,
  checkingUrls,
  onEditChannel,
  onDeleteChannel,
  onAddNewChannel,
  currentPage,
  pageSize,
}) => {
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  const handleLogoError = (id: string) => {
    setFailedLogos((prev) => ({ ...prev, [id]: true }));
  };

  if (channels.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 sm:p-12 text-center border border-slate-800">
        <Tv className="w-10 h-10 mx-auto text-slate-600 mb-3" />
        <h4 className="text-sm font-semibold text-slate-300 mb-1">No channels found</h4>
        <p className="text-xs text-slate-500 mb-4">
          Try adjusting your search query, status filters, format filters, or category selection.
        </p>
        <button
          onClick={onAddNewChannel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors cursor-pointer min-h-[40px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Channel Manually</span>
        </button>
      </div>
    );
  }

  // Virtualized page slice for smooth 60fps rendering without DOM bloating
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedChannels = channels.slice(startIndex, startIndex + pageSize);

  return (
    <div className="w-full space-y-3">
      {/* Directory Sub-header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-slate-400 font-mono">
          Page {currentPage} of {Math.max(1, Math.ceil(channels.length / pageSize))} · Showing{' '}
          <span className="text-cyan-300 font-semibold">{paginatedChannels.length}</span> of{' '}
          <span className="text-white font-semibold">{channels.length}</span> channels
        </div>
        <button
          onClick={onAddNewChannel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/60 transition-all cursor-pointer min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Channel</span>
        </button>
      </div>

      {viewMode === 'list' ? (
        /* List / Tabular View */
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                  <th className="py-3 px-3 sm:px-4 w-12 text-center">#</th>
                  <th className="py-3 px-3 sm:px-4">Channel</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Category</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Status</th>
                  <th className="py-3 px-3 sm:px-4">Stream URL</th>
                  <th className="py-3 px-3 sm:px-4 text-center w-20">Format</th>
                  <th className="py-3 px-3 sm:px-4 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {paginatedChannels.map((channel, idx) => {
                  const globalIdx = startIndex + idx + 1;
                  const hasLogo = channel.logo && !failedLogos[channel.id];
                  const isCopied = copiedId === channel.id;
                  const health = streamHealthMap[channel.url];
                  const isChecking = checkingUrls.has(channel.url);

                  return (
                    <tr
                      key={channel.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                      style={{ contain: 'content' }}
                    >
                      {/* Numerical index */}
                      <td className="py-3 px-3 sm:px-4 text-center font-mono tabular-nums text-slate-500 text-[11px]">
                        {globalIdx}
                      </td>

                      {/* Logo & Channel Name */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-3 min-w-[170px]">
                          <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0">
                            {hasLogo ? (
                              <img
                                src={channel.logo}
                                alt={channel.name}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                onError={() => handleLogoError(channel.id)}
                                className="w-full h-full object-contain p-0.5"
                              />
                            ) : (
                              <span className="text-[10px] font-bold font-mono text-cyan-400">
                                {channel.name.slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="truncate max-w-[160px] sm:max-w-[220px]">
                            <span className="font-medium text-slate-200 block truncate group-hover:text-cyan-300 transition-colors">
                              {channel.name}
                            </span>
                            {channel.tvgId && (
                              <span className="text-[10px] font-mono text-slate-500 block truncate">
                                id: {channel.tvgId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell text-slate-400 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-300">
                          {channel.group || 'General'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 sm:px-4 text-center whitespace-nowrap">
                        <StatusBadge
                          health={health}
                          isChecking={isChecking}
                          onCheck={() => onCheckChannel(channel)}
                        />
                      </td>

                      {/* Stream URL */}
                      <td className="py-3 px-3 sm:px-4 max-w-[180px] lg:max-w-xs">
                        <span
                          title={channel.url}
                          className="font-mono text-[11px] text-slate-400 block truncate hover:text-cyan-300 transition-colors select-all"
                        >
                          {channel.url}
                        </span>
                      </td>

                      {/* Format Badge */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <span className="font-mono text-[10px] text-cyan-300/90 font-medium">
                          {channel.format}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Test Play Stream Button */}
                          <button
                            onClick={() => onPlayChannel(channel)}
                            title="Play Live Stream"
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all cursor-pointer active:scale-95 min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <Play className="w-3.5 h-3.5 fill-cyan-400" />
                          </button>

                          {/* Copy URL Button */}
                          <button
                            onClick={() => onCopyUrl(channel.url, channel.id)}
                            title={isCopied ? 'Copied!' : 'Copy Stream URL'}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center ${
                              isCopied
                                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Edit Channel Button */}
                          <button
                            onClick={() => onEditChannel(channel)}
                            title="Edit channel metadata"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Channel Button */}
                          <button
                            onClick={() => onDeleteChannel(channel.id)}
                            title="Delete channel from playlist"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Card View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedChannels.map((channel, idx) => {
            const globalIdx = startIndex + idx + 1;
            const hasLogo = channel.logo && !failedLogos[channel.id];
            const isCopied = copiedId === channel.id;
            const health = streamHealthMap[channel.url];
            const isChecking = checkingUrls.has(channel.url);

            return (
              <div
                key={channel.id}
                className="glass-card rounded-2xl p-4 flex flex-col justify-between group hover:border-cyan-500/40 relative overflow-hidden"
              >
                <div>
                  {/* Top card row: logo + status badge + format */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                      {hasLogo ? (
                        <img
                          src={channel.logo}
                          alt={channel.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={() => handleLogoError(channel.id)}
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-xs font-bold font-mono text-cyan-400">
                          {channel.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-cyan-400">
                          {channel.format}
                        </span>
                        <span className="font-mono text-[10px] text-slate-600 tabular-nums">
                          #{globalIdx}
                        </span>
                      </div>
                      <StatusBadge
                        health={health}
                        isChecking={isChecking}
                        onCheck={() => onCheckChannel(channel)}
                        compact
                      />
                    </div>
                  </div>

                  {/* Channel Title & Category */}
                  <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate mb-1">
                    {channel.name}
                  </h4>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 truncate">
                    <span>{channel.group || 'General'}</span>
                    {channel.tvgId && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono text-slate-500 truncate">{channel.tvgId}</span>
                      </>
                    )}
                  </div>

                  {/* URL snippet */}
                  <div className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-[10px] font-mono text-slate-400 truncate mb-4 select-all">
                    {channel.url}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => onPlayChannel(channel)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-colors cursor-pointer min-h-[36px]"
                  >
                    <Play className="w-3 h-3 fill-cyan-400" />
                    <span>Test</span>
                  </button>

                  <button
                    onClick={() => onCopyUrl(channel.url, channel.id)}
                    title={isCopied ? 'Copied URL!' : 'Copy Stream URL'}
                    className={`p-2 rounded-lg border transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                      isCopied
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {isCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => onEditChannel(channel)}
                    title="Edit channel"
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onDeleteChannel(channel.id)}
                    title="Delete channel"
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
