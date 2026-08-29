'use client';

import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  FileText,
  FileDown,
  Bookmark,
  Check,
  RefreshCw,
  Highlighter,
  FileSpreadsheet
} from 'lucide-react';

interface CanvasFloatingHudProps {
  scale: number;
  isAutoFit: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleAutoFit: () => void;
  numPages: number;
  isStrictOnePage: boolean;
  isAtsHighlightEnabled: boolean;
  onToggleAtsHighlight: () => void;
  onExportPdf: () => void;
  onExportDocx: () => void;
  onExportPlainText: () => void;
  onSaveToTracker: () => void;
  isSavingToTracker: boolean;
  saveTrackerSuccess: boolean;
  editingAppId: string | null;
  hasResult: boolean;
  className?: string;
}

export default function CanvasFloatingHud({
  scale,
  isAutoFit,
  onZoomIn,
  onZoomOut,
  onToggleAutoFit,
  numPages,
  isStrictOnePage,
  isAtsHighlightEnabled,
  onToggleAtsHighlight,
  onExportPdf,
  onExportDocx,
  onExportPlainText,
  onSaveToTracker,
  isSavingToTracker,
  saveTrackerSuccess,
  editingAppId,
  hasResult,
  className = ''
}: CanvasFloatingHudProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <aside
      aria-label="Canvas HUD Controls"
      className={`no-print sticky top-2 z-30 flex items-center justify-between flex-wrap gap-2 px-3 py-1.5 rounded-2xl glass-panel bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-white/95 backdrop-blur-xl border border-white/10 light:border-slate-200/80 shadow-2xl text-xs font-sans select-none transition-all duration-200 max-w-full ${className}`}
    >
      {/* Left: Zoom & Viewport Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onZoomOut}
          disabled={scale <= 0.4}
          className="p-1 rounded-lg text-zinc-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleAutoFit}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
            isAutoFit
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white light:text-slate-600 hover:bg-white/10'
          }`}
          title="Fit Document to Screen Width"
        >
          <Maximize2 className="w-3 h-3" />
          <span>Fit</span>
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          disabled={scale >= 1.5}
          className="p-1 rounded-lg text-zinc-400 hover:text-white light:text-slate-600 light:hover:text-slate-900 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <span className="text-[10px] text-zinc-400 light:text-slate-500 font-mono ml-0.5 min-w-[32px] text-center">
          {Math.round(scale * 100)}%
        </span>
      </div>

      <div className="h-3.5 w-[1px] bg-white/10 light:bg-slate-200" />

      {/* Middle: Page Count & ATS Highlights */}
      <div className="flex items-center gap-2">
        {hasResult && (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                numPages === 1
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : isStrictOnePage
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
              }`}
            >
              <span>{numPages} {numPages === 1 ? 'Page' : 'Pages'}</span>
              {numPages > 1 && isStrictOnePage && (
                <span className="hidden sm:inline text-[9px] font-normal text-amber-300">
                  (Spillover)
                </span>
              )}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleAtsHighlight}
          className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 border ${
            isAtsHighlightEnabled
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'text-zinc-400 border-transparent hover:text-white hover:bg-white/5'
          }`}
          title="Toggle ATS Keyword Highlighting"
        >
          <Highlighter className="w-3 h-3 text-amber-400" />
          <span className="hidden sm:inline text-[10px]">Keywords</span>
        </button>
      </div>

      <div className="h-3.5 w-[1px] bg-white/10 light:bg-slate-200" />

      {/* Right: Save Tracker & Export Actions */}
      <div className="flex items-center gap-1.5 relative">
        {hasResult && (
          <button
            type="button"
            onClick={onSaveToTracker}
            disabled={isSavingToTracker}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1 ${
              saveTrackerSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 hover:border-indigo-500/40'
            }`}
            title={editingAppId ? 'Update application tracker' : 'Save application into tracker'}
          >
            {isSavingToTracker ? (
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
            ) : saveTrackerSuccess ? (
              <Check className="w-3 h-3 text-emerald-300" />
            ) : (
              <Bookmark className="w-3 h-3 text-indigo-400" />
            )}
            <span className="hidden sm:inline">
              {saveTrackerSuccess ? 'Saved' : editingAppId ? 'Update' : 'Track'}
            </span>
          </button>
        )}

        {hasResult && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen(!exportOpen)}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-bold shadow-md shadow-indigo-500/25 flex items-center gap-1 transition-all cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>

            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setExportOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900/95 dark:bg-zinc-900/95 light:bg-white border border-white/15 light:border-slate-200 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-zinc-300 light:text-slate-700 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      onExportPdf();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-2.5"
                  >
                    <FileDown className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div>
                      <span className="font-semibold block text-white light:text-slate-900 text-xs">Vector PDF</span>
                      <span className="text-[10px] text-zinc-400 light:text-slate-500">Recruiter ready print</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      onExportDocx();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-2.5"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0" />
                    <div>
                      <span className="font-semibold block text-white light:text-slate-900 text-xs">Word (.docx)</span>
                      <span className="text-[10px] text-zinc-400 light:text-slate-500">Editable Word document</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      onExportPlainText();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-white/10 light:hover:bg-slate-100 hover:text-white light:hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-2.5"
                  >
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-semibold block text-white light:text-slate-900 text-xs">ATS Plain Text</span>
                      <span className="text-[10px] text-zinc-400 light:text-slate-500">Direct portal copy-paste</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
