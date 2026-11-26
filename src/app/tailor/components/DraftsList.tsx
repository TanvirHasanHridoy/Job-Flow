'use client';

import React, { useEffect, useState } from 'react';
import { FileClock, Trash2, ArrowUpRight } from 'lucide-react';

interface DraftSummary {
  id: string;
  company: string;
  role: string;
  matchScore: number;
  updatedAt: string;
}

interface DraftsListProps {
  currentAppId?: string | null;   // highlight the draft currently open
  refreshKey?: unknown;           // change to refetch (e.g. after a new generation)
  limit?: number;
  className?: string;
}

const RETENTION_DAYS = 30;

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function daysLeft(iso: string): number {
  return Math.max(0, RETENTION_DAYS - Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

/**
 * Generated CVs that haven't been added to the tracker yet. They are saved
 * automatically and deleted after 30 days unless tracked.
 */
export default function DraftsList({ currentAppId, refreshKey, limit = 6, className = '' }: DraftsListProps) {
  const [drafts, setDrafts] = useState<DraftSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/applications?status=DRAFT&summary=1')
      .then(r => (r.ok ? r.json() : []))
      .then(list => { if (!cancelled) setDrafts(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setDrafts([]); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const remove = async (id: string) => {
    if (!window.confirm('Delete this draft? This cannot be undone.')) return;
    const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    if (res.ok) setDrafts(prev => (prev || []).filter(d => d.id !== id));
  };

  if (!drafts || drafts.length === 0) return null;

  return (
    <div className={`rounded-2xl border border-white/10 bg-zinc-900/40 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <FileClock className="w-3.5 h-3.5 text-indigo-400" />
          Drafts <span className="text-zinc-500 font-semibold">({drafts.length})</span>
        </h3>
        <span className="text-[10px] text-zinc-500">Not in your tracker yet · kept {RETENTION_DAYS} days</span>
      </div>
      <ul className="space-y-1.5">
        {drafts.slice(0, limit).map(d => (
          <li
            key={d.id}
            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] ${d.id === currentAppId ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/5 bg-white/[0.02]'}`}
          >
            <div className="min-w-0">
              <p className="text-zinc-200 font-semibold truncate">{d.role} · {d.company}</p>
              <p className="text-zinc-500 text-[10px]">
                {d.matchScore}% fit · {timeAgo(d.updatedAt)} · deleted in {daysLeft(d.updatedAt)} d
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {d.id === currentAppId ? (
                <span className="text-[10px] text-indigo-300 font-semibold px-1.5">Open</span>
              ) : (
                <a
                  href={`/tailor?appId=${d.id}`}
                  className="inline-flex items-center gap-0.5 px-2 py-1 rounded-md bg-indigo-600/80 hover:bg-indigo-500 text-white font-semibold text-[10px]"
                >
                  Open <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
              <button
                type="button"
                onClick={() => remove(d.id)}
                title="Delete draft"
                className="p-1 rounded-md text-zinc-500 hover:text-rose-300 hover:bg-white/5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {drafts.length > limit && (
        <p className="text-[10px] text-zinc-500 mt-1.5">+ {drafts.length - limit} more</p>
      )}
    </div>
  );
}
