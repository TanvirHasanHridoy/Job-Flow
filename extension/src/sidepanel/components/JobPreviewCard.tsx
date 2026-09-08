import React, { useState } from 'react';
import { Briefcase, Building2, MapPin, RefreshCw, FileText, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { ParsedJobData } from '../../content/parsers/types';

interface JobPreviewCardProps {
  job: ParsedJobData | null;
  onUpdateJob: (updated: Partial<ParsedJobData>) => void;
  onRescanPage: () => void;
  rescanning: boolean;
}

export const JobPreviewCard: React.FC<JobPreviewCardProps> = ({
  job,
  onUpdateJob,
  onRescanPage,
  rescanning
}) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'linkedin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A66C2]/20 text-[#38bdf8] border border-[#0A66C2]/40">LinkedIn</span>;
      case 'stepstone':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">StepStone</span>;
      case 'indeed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">Indeed</span>;
      case 'xing':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">XING</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300">Web Portal</span>;
    }
  };

  if (!job) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-2 text-slate-400">
          <Briefcase className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-semibold text-slate-200 mb-1">No Job Posting Detected</h3>
        <p className="text-[11px] text-slate-400 mb-3 max-w-xs mx-auto">
          Navigate to a job post on LinkedIn, StepStone, Indeed, or Xing, or scan this page.
        </p>
        <button
          onClick={onRescanPage}
          disabled={rescanning}
          className="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 mx-auto transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? 'animate-spin' : ''}`} />
          <span>{rescanning ? 'Scanning page...' : 'Scan Active Tab'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5 shadow-sm">
      {/* Header with Source Badge & Refresh */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          {getSourceBadge(job.source)}
          <span className="text-[10px] text-slate-400">Parsed from active tab</span>
        </div>
        <button
          onClick={onRescanPage}
          disabled={rescanning}
          title="Re-scan job from active page"
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${rescanning ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {/* Editable Fields */}
      <div className="space-y-2.5">
        {/* Role Name */}
        <div>
          <label className="text-[10px] font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1 mb-1">
            <Briefcase className="w-3 h-3 text-indigo-400" />
            <span>Target Role / Title</span>
          </label>
          <input
            type="text"
            value={job.title}
            onChange={(e) => onUpdateJob({ title: e.target.value })}
            placeholder="e.g. Senior Frontend Engineer"
            className="w-full px-2.5 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs font-medium text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Company & Location in 2 Columns */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3 text-indigo-400" />
              <span>Company</span>
            </label>
            <input
              type="text"
              value={job.company}
              onChange={(e) => onUpdateJob({ company: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="w-full px-2 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold tracking-wide uppercase text-slate-400 flex items-center gap-1 mb-1">
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span>Location</span>
            </label>
            <input
              type="text"
              value={job.location}
              onChange={(e) => onUpdateJob({ location: e.target.value })}
              placeholder="e.g. Berlin / Remote"
              className="w-full px-2 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Expandable Description */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <button
              type="button"
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="flex items-center gap-1 font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200 transition-colors"
            >
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>Job Description</span>
              {isDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <span className="text-[10px] text-slate-500">
              {job.description ? `${job.description.length} chars` : 'Empty'}
            </span>
          </div>

          {isDescExpanded ? (
            <textarea
              value={job.description}
              onChange={(e) => onUpdateJob({ description: e.target.value })}
              rows={6}
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-[11px] text-slate-300 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          ) : (
            <div
              onClick={() => setIsDescExpanded(true)}
              className="px-2.5 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px] text-slate-400 truncate cursor-pointer hover:border-slate-700 transition-colors"
            >
              {job.description ? job.description.slice(0, 100) + '...' : 'Click to view or paste description'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
