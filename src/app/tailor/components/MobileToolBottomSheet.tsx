'use client';

import React, { useState, useRef } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Sparkles,
  Award,
  Layers,
  Sliders,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface MobileToolBottomSheetProps {
  activeTab: 'generation' | 'ats' | 'customization' | 'spacing';
  onTabChange: (tab: 'generation' | 'ats' | 'customization' | 'spacing') => void;
  matchScore?: number;
  isOpen: boolean;
  onToggleOpen: () => void;
  children: React.ReactNode;
}

export default function MobileToolBottomSheet({
  activeTab,
  onTabChange,
  matchScore,
  isOpen,
  onToggleOpen,
  children
}: MobileToolBottomSheetProps) {
  const [sheetHeightState, setSheetHeightState] = useState<'half' | 'full'>('half');

  return (
    <>
      {/* Dimmed backdrop when sheet is expanded */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={onToggleOpen}
        />
      )}

      {/* Sliding Bottom Drawer Sheet */}
      <section
        aria-label="Workspace Tools Drawer"
        className={`no-print fixed left-0 right-0 bottom-[54px] z-40 lg:hidden glass-panel bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-white/95 backdrop-blur-2xl border-t border-white/15 light:border-slate-300/80 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] rounded-t-3xl transition-all duration-300 flex flex-col ${
          isOpen
            ? sheetHeightState === 'full'
              ? 'h-[85vh]'
              : 'h-[52vh]'
            : 'h-[52px]'
        }`}
      >
        {/* Drag Handle & Header Pill */}
        <div
          className="w-full flex flex-col items-center pt-2 pb-1.5 px-3 cursor-pointer shrink-0 border-b border-white/5 light:border-slate-200 select-none"
          onClick={onToggleOpen}
        >
          {/* Visual Grab Handle Bar */}
          <div className="w-12 h-1.5 rounded-full bg-zinc-600/70 hover:bg-zinc-400 light:bg-slate-300 transition-colors mb-1.5" />

          <div className="w-full flex items-center justify-between gap-1">
            {/* Tab Pill Buttons */}
            <div
              className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 py-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  onTabChange('generation');
                  if (!isOpen) onToggleOpen();
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'generation'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white light:text-slate-600 bg-white/5'
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-300" />
                <span>Strategy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTabChange('ats');
                  if (!isOpen) onToggleOpen();
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'ats'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white light:text-slate-600 bg-white/5'
                }`}
              >
                <Award className="w-3 h-3 text-amber-300" />
                <span>ATS</span>
                {matchScore !== undefined && (
                  <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                    {matchScore}%
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onTabChange('customization');
                  if (!isOpen) onToggleOpen();
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'customization'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white light:text-slate-600 bg-white/5'
                }`}
              >
                <Layers className="w-3 h-3 text-purple-300" />
                <span>Sections</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTabChange('spacing');
                  if (!isOpen) onToggleOpen();
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                  activeTab === 'spacing'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white light:text-slate-600 bg-white/5'
                }`}
              >
                <Sliders className="w-3 h-3 text-cyan-300" />
                <span>Spacing</span>
              </button>
            </div>

            {/* Expand / Minimize / Close Controls */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {isOpen && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSheetHeightState(sheetHeightState === 'full' ? 'half' : 'full');
                  }}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white light:text-slate-600 hover:bg-white/10"
                  title={sheetHeightState === 'full' ? 'Half Screen' : 'Full Screen'}
                >
                  {sheetHeightState === 'full' ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOpen();
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-white light:text-slate-600 hover:bg-white/10"
                title={isOpen ? 'Collapse Tools Sheet' : 'Expand Tools Sheet'}
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Sheet Content */}
        {isOpen && (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-left font-sans">
            {children}
          </div>
        )}
      </section>
    </>
  );
}
