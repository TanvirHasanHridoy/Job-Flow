'use client';

import React from 'react';
import { ShieldAlert, CheckCircle2, ArrowRightLeft, XCircle } from 'lucide-react';
import type { Requirement } from '@/lib/requirements';
import MarkdownLite from './MarkdownLite';

interface RefusalReportProps {
  matchScore: number;
  gapAnalysis: {
    requirements?: Requirement[];
    mustCoverage?: number;
    mustHaveCount?: number;
    mustHaveCovered?: number;
    threshold?: number;
    recommendations?: string;
  };
  tokenCost: number;
}

const STATUS_STYLE: Record<string, { label: string; className: string; Icon: React.ElementType }> = {
  MATCH: { label: 'Match', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', Icon: CheckCircle2 },
  ADJACENT: { label: 'Related', className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', Icon: ArrowRightLeft },
  GAP: { label: 'Missing', className: 'bg-rose-500/15 text-rose-300 border-rose-500/30', Icon: XCircle },
};

/**
 * Shown instead of a CV when the role is too far from the profile
 * (fewer than the threshold share of must-have requirements covered).
 */
export default function RefusalReport({ matchScore, gapAnalysis, tokenCost }: RefusalReportProps) {
  const requirements = gapAnalysis.requirements || [];
  const coveragePct = Math.round((gapAnalysis.mustCoverage ?? 0) * 100);
  const thresholdPct = Math.round((gapAnalysis.threshold ?? 0.5) * 100);
  const musts = requirements.filter(r => r.importance === 'must');
  const nices = requirements.filter(r => r.importance !== 'must');

  const renderRow = (r: Requirement, i: number) => {
    const s = STATUS_STYLE[r.status] || STATUS_STYLE.GAP;
    return (
      <li key={i} className="flex items-start justify-between gap-3 py-1.5 border-b border-white/5 last:border-0">
        <div className="min-w-0">
          <p className="text-zinc-200 text-xs">{r.requirement}</p>
          {r.status === 'ADJACENT' && r.bridgeFrom && (
            <p className="text-[10px] text-indigo-300/80">Related experience: {r.bridgeFrom}</p>
          )}
          {r.status === 'MATCH' && r.evidence && (
            <p className="text-[10px] text-zinc-500 truncate">{r.evidence}</p>
          )}
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.className}`}>
          <s.Icon className="w-3 h-3" />{s.label}
        </span>
      </li>
    );
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-left">
      <div className="flex items-start gap-3 mb-4">
        <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-zinc-100 text-base">This role is too far from your profile to tailor credibly</h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Your profile covers <strong className="text-zinc-200">{gapAnalysis.mustHaveCovered ?? 0} of {gapAnalysis.mustHaveCount ?? 0}</strong> must-have
            requirements ({coveragePct}%). JobFlow only generates documents when at least {thresholdPct}% are covered,
            either directly or through closely related experience, so your CV stays believable in interviews.
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Profile fit: {matchScore}% · {tokenCost} tokens were used for this analysis.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Must-have requirements</p>
          <ul>{musts.map(renderRow)}</ul>
        </div>
        {nices.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Nice to have</p>
            <ul>{nices.map(renderRow)}</ul>
          </div>
        )}
      </div>

      {gapAnalysis.recommendations && (
        <div className="mt-4 pt-4 border-t border-white/10 text-xs text-zinc-300 leading-relaxed">
          <MarkdownLite text={gapAnalysis.recommendations} />
        </div>
      )}

      <p className="mt-4 text-[11px] text-zinc-500">
        If you do have experience with the missing items, add it to your Master Vault and tailor again.
      </p>
    </div>
  );
}
