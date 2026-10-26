import React from 'react';
import { Activity, AlertCircle, RefreshCw, Radio } from 'lucide-react';
import { StreamHealthResult } from '../utils/streamChecker';

interface StatusBadgeProps {
  health?: StreamHealthResult;
  onCheck: () => void;
  isChecking?: boolean;
  compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  health,
  onCheck,
  isChecking = false,
  compact = false,
}) => {
  if (isChecking || health?.status === 'checking') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono whitespace-nowrap"
        title="Sending lightweight HEAD probe..."
      >
        <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400" />
        <span>Checking</span>
      </div>
    );
  }

  if (!health || health.status === 'unchecked') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCheck();
        }}
        title="Click to check if stream is live or offline"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition-colors text-[10px] font-mono cursor-pointer whitespace-nowrap"
      >
        <Activity className="w-2.5 h-2.5" />
        <span>Check Health</span>
      </button>
    );
  }

  if (health.status === 'live') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCheck();
        }}
        title={`Status: Live (HTTP ${health.statusCode || 200})${health.latencyMs ? ` · ${health.latencyMs}ms` : ''}${health.contentType ? ` · ${health.contentType}` : ''}. Click to re-check.`}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono hover:bg-emerald-900/40 transition-colors cursor-pointer whitespace-nowrap group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        <span className="font-semibold">Live</span>
        {health.latencyMs !== undefined && !compact && (
          <span className="text-emerald-400/80 tabular-nums">
            {health.latencyMs}ms
          </span>
        )}
      </button>
    );
  }

  // Offline status
  const errorLabel = health.statusCode ? `${health.statusCode}` : 'Unreachable';
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onCheck();
      }}
      title={`Status: Offline (${health.statusText || health.error || 'Server unreachable'}). Click to re-check.`}
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[10px] font-mono hover:bg-rose-900/40 transition-colors cursor-pointer whitespace-nowrap"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]" />
      <span className="font-semibold">Offline</span>
      {!compact && (
        <span className="text-rose-400/80 max-w-[80px] truncate">
          {errorLabel}
        </span>
      )}
    </button>
  );
};
