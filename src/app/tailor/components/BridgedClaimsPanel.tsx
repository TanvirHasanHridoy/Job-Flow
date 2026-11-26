'use client';

import React from 'react';
import { GitMerge, Check, Trash2, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { BridgedClaim, BridgedTermKind } from '@/lib/bridging';

interface BridgedClaimsPanelProps {
  claims: BridgedClaim[];            // claims for the currently shown bullet style / letter length
  acceptedKeys: string[];
  highlightsOn: boolean;
  hardLineRemovals?: string[];
  workExperience?: Array<{ company?: string; role?: string }>;
  onToggleHighlights: () => void;
  onAccept: (claim: BridgedClaim) => void;
  onRemove: (claim: BridgedClaim) => void;
  onAcceptAll: () => void;
}

const KIND_LABEL: Record<BridgedTermKind, string> = {
  'new-skill': 'New skill',
  'moved-skill': 'Moved skill',
  number: 'Figure',
  'gap-skill': 'Missing skill',
  credential: 'Credential',
};

const SECTION_LABEL: Record<BridgedClaim['section'], string> = {
  summary: 'Summary',
  experience: 'Experience',
  skills: 'Skills',
  projects: 'Projects',
  coverLetter: 'Cover letter',
};

function highlightTerms(text: string, terms: string[]): React.ReactNode[] {
  const escaped = terms.filter(Boolean).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length);
  if (escaped.length === 0) return [text];
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'gi'));
  return parts.map((p, i) =>
    escaped.some(e => new RegExp(`^${e}$`, 'i').test(p))
      ? <mark key={i} className="bg-amber-400/25 text-amber-200 rounded px-0.5">{p}</mark>
      : <React.Fragment key={i}>{p}</React.Fragment>
  );
}

/**
 * Review list for AI-bridged claims: everything in the documents that the
 * candidate's profile doesn't back up. Each claim can be kept or removed.
 */
export default function BridgedClaimsPanel({
  claims, acceptedKeys, highlightsOn, hardLineRemovals = [], workExperience = [],
  onToggleHighlights, onAccept, onRemove, onAcceptAll,
}: BridgedClaimsPanelProps) {
  const pending = claims.filter(c => !acceptedKeys.includes(c.key));
  const accepted = claims.filter(c => acceptedKeys.includes(c.key));

  if (claims.length === 0 && hardLineRemovals.length === 0) {
    return (
      <div className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-300 leading-relaxed">
          Everything in these documents is backed by your Master Vault. No bridged claims to review.
        </p>
      </div>
    );
  }

  const where = (c: BridgedClaim) => {
    if (c.section === 'experience' && c.jobIndex !== undefined) {
      const job = workExperience[c.jobIndex];
      return job?.company ? `Experience · ${job.company}` : 'Experience';
    }
    return SECTION_LABEL[c.section];
  };

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <GitMerge className="w-4 h-4 text-amber-400" />
            Bridged claims
            {pending.length > 0 && (
              <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-black">{pending.length} to review</span>
            )}
          </h3>
          <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
            These statements go beyond what your Master Vault shows. Keep only what you can confidently back up in an interview.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleHighlights}
          title={highlightsOn ? 'Hide highlights in the document' : 'Highlight in the document'}
          className="shrink-0 p-1.5 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/10 cursor-pointer"
        >
          {highlightsOn ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      {hardLineRemovals.length > 0 && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-300 shrink-0 mt-0.5" />
          <p className="text-[10.5px] text-rose-200/90 leading-relaxed">
            {hardLineRemovals.length} statement{hardLineRemovals.length === 1 ? ' was' : 's were'} removed automatically because
            {hardLineRemovals.length === 1 ? ' it' : ' they'} claimed a missing skill, degree or certification.
          </p>
        </div>
      )}

      {pending.length > 0 && (
        <ul className="space-y-2">
          {pending.map(c => (
            <li key={c.key} className={`p-2.5 rounded-xl border ${c.isViolation ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/10 bg-zinc-900/60'}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">{where(c)}</p>
              <p className="text-[11px] text-zinc-200 leading-relaxed line-clamp-4">{highlightTerms(c.text, c.terms.map(t => t.term))}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {c.terms.map((t, i) => (
                  <span key={i} className={`text-[9.5px] px-1.5 py-0.5 rounded-md border ${t.kind === 'gap-skill' || t.kind === 'credential' ? 'border-rose-500/30 text-rose-300' : 'border-amber-500/30 text-amber-200'}`}>
                    {KIND_LABEL[t.kind]}: <strong>{t.term}</strong>{t.source ? ` — ${t.source}` : ''}
                  </span>
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                {!c.isViolation && (
                  <button
                    type="button"
                    onClick={() => onAccept(c)}
                    className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10.5px] font-semibold bg-emerald-600/80 hover:bg-emerald-500 text-white cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Keep
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(c)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10.5px] font-semibold bg-zinc-800 hover:bg-rose-600/80 text-zinc-200 hover:text-white border border-white/10 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {pending.filter(c => !c.isViolation).length > 1 && (
        <button
          type="button"
          onClick={onAcceptAll}
          className="w-full py-1.5 rounded-lg text-[10.5px] font-semibold border border-white/10 text-zinc-300 hover:bg-white/5 cursor-pointer"
        >
          Keep all remaining ({pending.filter(c => !c.isViolation).length})
        </button>
      )}

      {accepted.length > 0 && (
        <p className="text-[10.5px] text-zinc-500">
          {accepted.length} bridged claim{accepted.length === 1 ? '' : 's'} kept. Interview Prep will help you back {accepted.length === 1 ? 'it' : 'them'} up.
        </p>
      )}
    </div>
  );
}
