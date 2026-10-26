import { ResolutionTag } from '../types/playlist';

/**
 * Detects stream resolution tag (4K, FHD, HD, SD) from channel title or URL
 */
export function detectResolution(name: string, url: string = ''): ResolutionTag {
  const text = `${name} ${url}`.toLowerCase();
  
  // 4K / Ultra HD patterns
  if (/\b(4k|uhd|2160p?|3840|4096)\b/i.test(text)) {
    return '4K';
  }
  
  // Full HD 1080p patterns
  if (/\b(1080p?|1080i|fhd|full\s*hd|fullhd)\b/i.test(text)) {
    return 'FHD';
  }
  
  // High Definition 720p patterns
  if (/\b(720p?|720i|\bhd\b)\b/i.test(text)) {
    return 'HD';
  }
  
  // Standard Definition patterns
  if (/\b(576p?|480p?|360p?|\bsd\b)\b/i.test(text)) {
    return 'SD';
  }
  
  return 'OTHER';
}

/**
 * Returns badge styling based on resolution tag and current accent theme
 */
export function getResolutionBadgeStyle(resolution: ResolutionTag | undefined): {
  label: string;
  className: string;
} {
  switch (resolution) {
    case '4K':
      return {
        label: '4K UHD',
        className: 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold',
      };
    case 'FHD':
      return {
        label: 'FHD 1080',
        className: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium',
      };
    case 'HD':
      return {
        label: 'HD 720',
        className: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium',
      };
    case 'SD':
      return {
        label: 'SD',
        className: 'bg-slate-800 text-slate-400 border border-slate-700 font-normal',
      };
    default:
      return {
        label: '',
        className: '',
      };
  }
}
