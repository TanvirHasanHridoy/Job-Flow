import React, { useState } from 'react';
import { Sparkles, ExternalLink, RefreshCw, Settings, ShieldCheck, CheckCircle2, Coins } from 'lucide-react';

interface AuthGateProps {
  apiBaseUrl: string;
  onUpdateBaseUrl: (url: string) => void;
  onRefreshSession: () => void;
  checking: boolean;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  apiBaseUrl,
  onUpdateBaseUrl,
  onRefreshSession,
  checking
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [urlInput, setUrlInput] = useState(apiBaseUrl);

  const handleOpenLogin = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: `${apiBaseUrl}/login` });
    } else {
      window.open(`${apiBaseUrl}/login`, '_blank');
    }
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBaseUrl(urlInput.trim() || 'http://localhost:3000');
    setShowConfig(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[500px]">
      {/* Brand Icon */}
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-indigo-400 p-0.5 shadow-xl shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-slate-900">
          <ShieldCheck className="w-3 h-3 text-white" />
        </div>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-white mb-1.5">
        JobFlow AI Assistant
      </h2>
      <p className="text-xs text-slate-400 max-w-xs mb-6 leading-relaxed">
        Connect your JobFlow account to tailor CVs and cover letters directly from LinkedIn, StepStone, Indeed, and Xing.
      </p>

      {/* Feature Highlights */}
      <div className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl p-3.5 mb-6 text-left space-y-2">
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>1-Click DOM parsing from all major job boards</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Bullet Matrix, Modern Visual, and ATS CV formats</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Instant ATS match scoring & keyword gap analysis</span>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full space-y-2.5">
        <button
          onClick={handleOpenLogin}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
        >
          <span>Log in to JobFlow AI</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRefreshSession}
          disabled={checking}
          className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700/80 text-slate-300 text-xs font-medium rounded-lg border border-slate-700/60 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin text-indigo-400' : ''}`} />
          <span>{checking ? 'Checking active session...' : 'I have logged in — Refresh'}</span>
        </button>
      </div>

      {/* Settings toggle for dev / prod domain */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 w-full">
        {!showConfig ? (
          <button
            onClick={() => setShowConfig(true)}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Settings className="w-3 h-3" />
            <span>Server Endpoint: {apiBaseUrl}</span>
          </button>
        ) : (
          <form onSubmit={handleSaveUrl} className="space-y-2 text-left bg-slate-900/80 p-3 rounded-lg border border-slate-700/50">
            <label className="text-[11px] font-medium text-slate-400 block">JobFlow API Server URL</label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:3000"
              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium rounded"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
