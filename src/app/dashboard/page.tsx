'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Calendar, MapPin, DollarSign, Clock, FileText, Trash2, Eye, ChevronRight, ChevronLeft, Award, Sparkles, LayoutGrid, CheckCircle2, TrendingUp
} from 'lucide-react';

interface GeneratedDocument {
  id: string;
  type: string;
  content: string;
}

interface ApplicationStatusHistory {
  id: string;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
}

interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: string; // TAILORED, APPLIED, INTERVIEWING, OFFER, REJECTED
  salaryExpectation?: string;
  noticePeriod?: string;
  signingLocation?: string;
  customNotes?: string;
  rawJobDescription: string;
  matchScore: number;
  gapAnalysis: {
    missingSkills: string[];
    matchingKeywords: string[];
    recommendations: string;
  };
  targetLanguage: string;
  createdAt: string;
  documents: GeneratedDocument[];
  statusHistory?: ApplicationStatusHistory[];
}

const COLUMNS = [
  { id: 'TAILORED', name: 'Tailored', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' },
  { id: 'APPLIED', name: 'Applied', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
  { id: 'INTERVIEWING', name: 'Interviewing', color: 'border-purple-500/30 bg-purple-500/5 text-purple-300' },
  { id: 'OFFER', name: 'Offer Received', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' },
  { id: 'REJECTED', name: 'Rejected', color: 'border-red-400 bg-zinc-900/40 text-red-900' }
];

export default function Dashboard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAppStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setApplications(prev =>
          prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
        );
        // Sync open detail panel state
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const deleteApplication = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this job application from history?')) return;

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setApplications(prev => prev.filter(app => app.id !== id));
        if (selectedApp?.id === id) setSelectedApp(null);
      }
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  // Stats calculation
  const totalApps = applications.length;
  const interviewApps = applications.filter(a => a.status === 'INTERVIEWING').length;
  const offerApps = applications.filter(a => a.status === 'OFFER').length;
  const avgMatchScore = totalApps > 0
    ? Math.round(applications.reduce((acc, a) => acc + a.matchScore, 0) / totalApps)
    : 0;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4"></div>
        <p className="text-zinc-400 text-sm animate-pulse">Loading tracker pipeline...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full flex-1 flex flex-col">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-indigo-200 bg-clip-text text-transparent">
              JobFlow Command Center
            </h1>
          </div>
          <p className="text-zinc-400 text-sm">
            Track custom resume revisions, interviews, and offers in one centralized, multi-language hub.
          </p>
        </div>
      </div>

      {/* Analytics Summary Scorecards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Total Pipeline</span>
            <span className="text-2xl font-bold text-white">{totalApps}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Active Interviews</span>
            <span className="text-2xl font-bold text-white">{interviewApps}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Offers Secured</span>
            <span className="text-2xl font-bold text-white">{offerApps}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Average Match %</span>
            <span className="text-2xl font-bold text-white">{avgMatchScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Kanban Board Layout */}
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1000px] h-[calc(100vh-340px)]">
          {COLUMNS.map(col => {
            const columnApps = applications.filter(app => app.status === col.id);
            return (
              <div
                key={col.id}
                className="flex-1 flex flex-col rounded-2xl border border-white/5 bg-zinc-950/20 backdrop-blur-sm p-4 w-[280px]"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${col.color}`}>
                    {col.name}
                  </span>
                  <span className="text-xs text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                    {columnApps.length}
                  </span>
                </div>

                {/* Column Cards Container */}
                <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                  {columnApps.length > 0 ? (
                    columnApps.map(app => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="glass-panel glass-panel-hover p-4 rounded-xl cursor-pointer select-none space-y-3 relative group"
                      >
                        {/* Match & Lang tags */}
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-500 font-sans">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-300">
                              {app.targetLanguage === 'DE' ? '🇩🇪 DE' : '🇬🇧 EN'}
                            </span>
                          </span>

                          <span className={`inline-flex items-center gap-1 text-xs font-bold ${app.matchScore >= 80 ? 'text-emerald-400' : app.matchScore >= 60 ? 'text-amber-400' : 'text-zinc-400'
                            }`}>
                            <Award className="w-3.5 h-3.5" />
                            {app.matchScore}% Match
                          </span>
                        </div>

                        {/* Title details */}
                        <div>
                          <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                            {app.role}
                          </h3>
                          <p className="text-[11px] text-zinc-400 truncate">{app.company}</p>
                        </div>

                        {/* Card metadata indicators */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[10px] text-zinc-500">
                          <span className="flex items-center gap-1 font-sans">
                            <Calendar className="w-3 h-3" />
                            {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>

                          {/* Trash indicator on hover */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => deleteApplication(app.id, e)}
                              className="p-1 hover:text-rose-400 rounded transition-colors text-zinc-600 hover:bg-white/5 cursor-pointer"
                              title="Delete application log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Simple arrows to quick move status */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <button
                            disabled={app.status === 'TAILORED'}
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = COLUMNS.findIndex(c => c.id === app.status);
                              if (idx > 0) updateAppStatus(app.id, COLUMNS[idx - 1].id);
                            }}
                            className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 rounded cursor-pointer"
                            title="Move left"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-semibold font-sans">Move Status</span>

                          <button
                            disabled={app.status === 'REJECTED'}
                            onClick={(e) => {
                              e.stopPropagation();
                              const idx = COLUMNS.findIndex(c => c.id === app.status);
                              if (idx < COLUMNS.length - 1) updateAppStatus(app.id, COLUMNS[idx + 1].id);
                            }}
                            className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 rounded cursor-pointer"
                            title="Move right"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full min-h-[120px] border border-dashed border-white/5 rounded-xl flex items-center justify-center text-center text-zinc-600 text-xs p-4">
                      No jobs in this stage.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slideout Application Detail Modal Overlay */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-all duration-300">
          {/* Close trigger boundary */}
          <div className="flex-1" onClick={() => setSelectedApp(null)}></div>

          <div className="w-full max-w-xl bg-[#080517] border-l border-white/10 h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between shadow-2xl relative">
            <div>
              {/* Header Title info */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-bold font-sans">
                      {selectedApp.targetLanguage === 'DE' ? '🇩🇪 GERMAN APPLICATION' : '🇬🇧 ENGLISH APPLICATION'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                      {selectedApp.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{selectedApp.role}</h2>
                  <p className="text-sm text-zinc-400">{selectedApp.company}</p>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>

              {/* Status Update Dropdown */}
              <div className="mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Update Status Stage</label>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.map(col => (
                    <button
                      key={col.id}
                      onClick={() => updateAppStatus(selectedApp.id, col.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${selectedApp.status === col.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target overrides details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Salary Expectation
                  </span>
                  <p className="text-zinc-200 font-medium">{selectedApp.salaryExpectation || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Notice / Availability
                  </span>
                  <p className="text-zinc-200 font-medium">{selectedApp.noticePeriod || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Signing Location
                  </span>
                  <p className="text-zinc-200 font-medium">{selectedApp.signingLocation || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> AI Match Score
                  </span>
                  <p className="text-emerald-400 font-bold">{selectedApp.matchScore}% Fit</p>
                </div>
              </div>

              {/* Gap Analysis */}
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Keyword/Skill Gap Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                      <span className="text-[10px] text-emerald-400 font-bold block mb-1">Keywords Met</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedApp.gapAnalysis.matchingKeywords.map((k, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">{k}</span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <span className="text-[10px] text-amber-400 font-bold block mb-1">Target Skill Gaps</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedApp.gapAnalysis.missingSkills.length > 0 ? (
                          selectedApp.gapAnalysis.missingSkills.map((s, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">{s}</span>
                          ))
                        ) : (
                          <span className="text-[9px] text-zinc-500">Perfect matching!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedApp.gapAnalysis.recommendations && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs leading-relaxed">
                    <h5 className="font-bold text-indigo-300 mb-0.5">Recommendations</h5>
                    <p className="text-zinc-300">{selectedApp.gapAnalysis.recommendations}</p>
                  </div>
                )}
              </div>

              {/* Custom Focus Notes */}
              {selectedApp.customNotes && (
                <div className="mb-6 text-xs">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">Custom Notes for this Build</h4>
                  <p className="text-zinc-400 bg-white/[0.02] border border-white/5 p-3 rounded-xl italic">
                    "{selectedApp.customNotes}"
                  </p>
                </div>
              )}

              {/* Status History Timeline */}
              <div className="mb-6 text-xs">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Status Timeline Audit Trail</h4>
                <div className="relative border-l border-zinc-700/60 ml-2.5 pl-5 space-y-4 font-sans">
                  {/* Current Status Node */}
                  <div className="relative">
                    <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 ring-4 ring-[#080517]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-950 animate-ping"></span>
                    </span>
                    <div className="flex justify-between items-baseline pl-1">
                      <span className="font-bold text-zinc-100">Current Stage: {selectedApp.status}</span>
                      <span className="text-[10px] text-zinc-500">Active</span>
                    </div>
                  </div>

                  {/* History List */}
                  {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 ? (
                    selectedApp.statusHistory.map((hist: any) => (
                      <div key={hist.id} className="relative">
                        <span className="absolute -left-[24px] top-1.5 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-zinc-600 ring-4 ring-[#080517]"></span>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-zinc-300">
                            Moved from <span className="font-semibold text-zinc-400">{hist.fromStatus}</span> to <span className="font-semibold text-white">{hist.toStatus}</span>
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(hist.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : null}

                  {/* Creation Node */}
                  <div className="relative">
                    <span className="absolute -left-[24px] top-1.5 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-[#080517]"></span>
                    <div className="flex justify-between items-baseline pl-1">
                      <span className="text-zinc-300 font-semibold">Application Tracked</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(selectedApp.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Action triggers */}
            <div className="mt-8 pt-6 border-t border-white/10 flex gap-3">
              <Link
                href={`/tailor?appId=${selectedApp.id}`}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-center text-xs font-bold border border-white/5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Open in Tailoring Workspace
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
