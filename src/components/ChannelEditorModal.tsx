import React, { useState, useEffect } from 'react';
import { X, Check, Save, Image, Link2, Tv, Folder, Hash } from 'lucide-react';
import { Channel } from '../types/playlist';

interface ChannelEditorModalProps {
  channel: Channel | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (channel: Channel) => void;
  existingGroups: string[];
}

export const ChannelEditorModal: React.FC<ChannelEditorModalProps> = ({
  channel,
  isOpen,
  onClose,
  onSave,
  existingGroups,
}) => {
  const [formData, setFormData] = useState<Channel>({
    id: '',
    name: '',
    url: '',
    logo: '',
    group: 'General',
    tvgId: '',
    format: 'HLS',
  });

  const [logoPreviewError, setLogoPreviewError] = useState(false);

  useEffect(() => {
    if (channel) {
      setFormData({ ...channel });
      setLogoPreviewError(false);
    } else {
      // Creating a new channel
      setFormData({
        id: `ch-manual-${Date.now()}`,
        name: '',
        url: '',
        logo: '',
        group: existingGroups[0] || 'General',
        tvgId: '',
        format: 'HLS',
      });
      setLogoPreviewError(false);
    }
  }, [channel, isOpen, existingGroups]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;

    let detectedFormat: Channel['format'] = 'STREAM';
    const cleanUrl = formData.url.toLowerCase();
    if (cleanUrl.includes('.m3u8')) detectedFormat = 'HLS';
    else if (cleanUrl.includes('.mp4')) detectedFormat = 'MP4';
    else if (cleanUrl.includes('.ts')) detectedFormat = 'TS';

    onSave({
      ...formData,
      name: formData.name.trim(),
      url: formData.url.trim(),
      group: formData.group.trim() || 'General',
      format: detectedFormat,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-panel-glow rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              {channel ? 'Edit Channel Metadata' : 'Add New Stream Channel'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel Name */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Channel Name <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. ESPN HD"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Stream URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Stream URL (.m3u8, .mp4, .ts) <span className="text-cyan-400">*</span>
            </label>
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com/stream/playlist.m3u8"
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Category / Group */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Category Group
            </label>
            <div className="relative">
              <Folder className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                list="groupSuggestions"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                placeholder="Sports, News, Movies, Animation..."
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <datalist id="groupSuggestions">
                {existingGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
          </div>

          {/* TVG Logo URL with preview */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Channel Logo URL (tvg-logo)
            </label>
            <div className="flex gap-2 items-center">
              <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                {formData.logo && !logoPreviewError ? (
                  <img
                    src={formData.logo}
                    alt="Logo"
                    onError={() => setLogoPreviewError(true)}
                    className="w-full h-full object-contain p-0.5"
                  />
                ) : (
                  <Image className="w-4 h-4 text-slate-600" />
                )}
              </div>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => {
                  setFormData({ ...formData, logo: e.target.value });
                  setLogoPreviewError(false);
                }}
                placeholder="https://example.com/logo.png"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* TVG ID */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              EPG / TVG Identifier (tvg-id)
            </label>
            <div className="relative">
              <Hash className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={formData.tvgId}
                onChange={(e) => setFormData({ ...formData, tvgId: e.target.value })}
                placeholder="e.g. espn.us or sintel-hls"
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || !formData.url.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{channel ? 'Save Changes' : 'Add Channel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
