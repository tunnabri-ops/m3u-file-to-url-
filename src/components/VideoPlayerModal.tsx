import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import Hls from 'hls.js';
import { Channel } from '../types/playlist';

interface VideoPlayerModalProps {
  channel: Channel | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ channel, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const hlsInstanceRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!channel || !videoRef.current) return;
    setStreamError(null);
    setIsPlaying(false);

    const video = videoRef.current;
    const url = channel.url;

    // Cleanup prior HLS instance
    if (hlsInstanceRef.current) {
      hlsInstanceRef.current.destroy();
      hlsInstanceRef.current = null;
    }

    const isHlsStream = url.includes('.m3u8') || channel.format === 'HLS';

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsInstanceRef.current = hls;

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {
          // Autoplay blocked by browser policy, user can click play
        });
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setStreamError(
                'Stream network or CORS error. Many IPTV streams require a desktop player (like VLC, PotPlayer, or IINA) because web browsers block cross-origin live streams without CORS headers.'
              );
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      video.src = url;
      video.play().catch(() => {});
    } else {
      // Direct MP4 / WebM / Generic video
      video.src = url;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [channel]);

  if (!channel) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(channel.url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl glass-panel-glow rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3 truncate">
            {channel.logo && (
              <img
                src={channel.logo}
                alt=""
                className="w-6 h-6 object-contain rounded shrink-0 bg-slate-950 p-0.5"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <div className="truncate">
              <h3 className="text-sm font-semibold text-white truncate">
                {channel.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                {channel.group || 'General'} · {channel.format}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Copy URL"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            playsInline
            controls={false}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => {
              setStreamError(
                'Stream playback encountered an error or CORS restriction. You can copy the URL to play in VLC, PotPlayer, or mpv.'
              );
            }}
          />

          {streamError && (
            <div className="absolute inset-0 bg-slate-950/90 p-6 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-2">
                In-Browser Stream Notice
              </h4>
              <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
                {streamError}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Stream URL for VLC</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Overlay Controls Bar */}
          {!streamError && (
            <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="p-1.5 text-white hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="p-1.5 text-white hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleFullscreen}
                className="p-1.5 text-white hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Stream URL footer bar */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between gap-3">
          <span className="truncate select-all">{channel.url}</span>
          <a
            href={channel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 shrink-0"
          >
            <span>Open in Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
