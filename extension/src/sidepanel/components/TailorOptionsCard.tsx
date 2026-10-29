import React, { useState } from 'react';
import { Sparkles, Sliders, ChevronDown, ChevronUp, User, Globe, FileSpreadsheet, LayoutTemplate, Coins, AlertTriangle } from 'lucide-react';
import { TailorSettings } from '../services/storage';

interface TailorOptionsCardProps {
  settings: TailorSettings;
  personas: Array<{ id: string; name: string; isDefault?: boolean }>;
  userTokens: number;
  onUpdateSettings: (updated: Partial<TailorSettings>) => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

export const TailorOptionsCard: React.FC<TailorOptionsCardProps> = ({
  settings,
  personas,
  userTokens,
  onUpdateSettings,
  onGenerate,
  canGenerate
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const cost = 20; // 20 tokens per tailoring
  const hasEnoughTokens = userTokens >= cost;

  return (
    <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5 shadow-sm space-y-3">
      {/* Section Title */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wide uppercase text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          <span>Tailoring Options</span>
        </span>

        {/* Token Balance Tag */}
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
          hasEnoughTokens ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
        }`}>
          <Coins className="w-3 h-3" />
          <span>{userTokens} tokens</span>
        </div>
      </div>

      {/* 1. Language Selection (CV & Cover Letter) */}
      <div>
        <label className="text-[10px] font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
          <Globe className="w-3 h-3 text-indigo-400" />
          <span>Target Language</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onUpdateSettings({ cvLanguage: 'EN', clLanguage: 'EN' })}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              settings.cvLanguage === 'EN'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <span>🇬🇧 English</span>
          </button>
          <button
            type="button"
            onClick={() => onUpdateSettings({ cvLanguage: 'DE', clLanguage: 'DE' })}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              settings.cvLanguage === 'DE'
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <span>🇩🇪 German (DACH)</span>
          </button>
        </div>
      </div>

      {/* 2. CV Format Selection */}
      <div>
        <label className="text-[10px] font-semibold text-slate-400 block mb-1.5 flex items-center gap-1">
          <LayoutTemplate className="w-3 h-3 text-indigo-400" />
          <span>CV Layout & Structure</span>
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateSettings({ cvFormat: 'bullet-matrix' })}
            className={`py-2 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
              settings.cvFormat === 'bullet-matrix'
                ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-sm'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className="block font-bold">Bullet Matrix</span>
            <span className="text-[9px] opacity-75">Executive STAR</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ cvFormat: 'visual' })}
            className={`py-2 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
              settings.cvFormat === 'visual'
                ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-sm'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className="block font-bold">Modern Visual</span>
            <span className="text-[9px] opacity-75">Multi-Theme</span>
          </button>

          <button
            type="button"
            onClick={() => onUpdateSettings({ cvFormat: 'ats' })}
            className={`py-2 px-2 rounded-lg text-[11px] font-medium border text-center transition-all ${
              settings.cvFormat === 'ats'
                ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-sm'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            <span className="block font-bold">ATS Clean</span>
            <span className="text-[9px] opacity-75">Single Column</span>
          </button>
        </div>
      </div>

      {/* 3. Persona Selector */}
      <div>
        <label className="text-[10px] font-semibold text-slate-400 block mb-1 flex items-center gap-1">
          <User className="w-3 h-3 text-indigo-400" />
          <span>Tailor Against Profile / Persona</span>
        </label>
        <select
          value={settings.selectedPersonaId}
          onChange={(e) => onUpdateSettings({ selectedPersonaId: e.target.value })}
          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.isDefault ? '(Default)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Collapsible Advanced Directives */}
      <div className="border-t border-slate-700/60 pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors py-1"
        >
          <span className="flex items-center gap-1 font-semibold">
            <span>Advanced AI Prompts & Style</span>
          </span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="pt-2 space-y-2.5">
            {/* Tone & Bullet Style */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">CV Tone</label>
                <select
                  value={settings.tone}
                  onChange={(e) => onUpdateSettings({ tone: e.target.value })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                >
                  <option value="Bold & Action-oriented">Bold & Action-oriented</option>
                  <option value="Professional & Formal">Professional & Formal</option>
                  <option value="Technical & Analytical">Technical & Analytical</option>
                  <option value="Executive & Visionary">Executive & Visionary</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">Bullet Style</label>
                <select
                  value={settings.bulletStyle}
                  onChange={(e) => onUpdateSettings({ bulletStyle: e.target.value })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                >
                  <option value="STAR Method">STAR Method (Result-first)</option>
                  <option value="Short & Punchy">Short & Punchy</option>
                  <option value="Standard Professional">Standard Professional</option>
                </select>
              </div>
            </div>

            {/* Cover Letter Length & Match Strategy */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">Cover Letter Length</label>
                <select
                  value={settings.clLength}
                  onChange={(e) => onUpdateSettings({ clLength: e.target.value })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                >
                  <option value="Short & Punchy (under 300 words)">Short (&lt;300 words)</option>
                  <option value="Detailed (under 500 words)">Detailed (&lt;500 words)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-medium text-slate-400 block mb-1">Strategy</label>
                <select
                  value={settings.matchStrategy}
                  onChange={(e) => onUpdateSettings({ matchStrategy: e.target.value as any })}
                  className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-white"
                >
                  <option value="TACTICAL_PIVOT">Tactical Pivot</option>
                  <option value="AGGRESIVE_BRIDGING">Aggressive Bridging</option>
                </select>
              </div>
            </div>

            {/* Custom Notes */}
            <div>
              <label className="text-[10px] font-medium text-slate-400 block mb-1">Custom Directives for AI (optional)</label>
              <input
                type="text"
                value={settings.customNotes}
                onChange={(e) => onUpdateSettings({ customNotes: e.target.value })}
                placeholder="e.g. Emphasize AWS, Kubernetes, and team leadership"
                className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Low tokens alert */}
      {!hasEnoughTokens && (
        <div className="p-2.5 bg-rose-950/50 border border-rose-500/30 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>You need at least 20 tokens to generate. Please top up your JobFlow account.</span>
        </div>
      )}

      {/* Generate CTA Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!canGenerate || !hasEnoughTokens}
        className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        <Sparkles className="w-4 h-4 animate-spin-slow" />
        <span>Generate Tailored Application (20 Tokens)</span>
      </button>
    </div>
  );
};
