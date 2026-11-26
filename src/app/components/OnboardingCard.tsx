'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface OnboardingCardProps {
  vaultReady: boolean;        // Master Vault has jobs / education / skills / projects
  hasApplications: boolean;   // at least one tracked application
}

/**
 * Getting-started guide for new users: fill the vault, tailor a first job,
 * then track it. Hidden once both the vault and the tracker have content.
 */
export default function OnboardingCard({ vaultReady, hasApplications }: OnboardingCardProps) {
  if (vaultReady && hasApplications) return null;

  const steps = [
    {
      done: vaultReady,
      title: 'Fill your Master Vault',
      text: 'Import your CV (PDF), LinkedIn text or GitHub, or enter your experience by hand. Everything the AI writes is based on it.',
      href: '/profile',
      cta: 'Open Master Vault',
    },
    {
      done: hasApplications,
      title: 'Tailor your first application',
      text: 'Paste a job ad or import it from a link. You get a matching CV and cover letter, plus a gap analysis.',
      href: '/tailor',
      cta: 'Open Tailor Workspace',
    },
    {
      done: false,
      title: 'Review, export and track',
      text: 'Check any bridged claims, export as PDF or Word, and click Track to follow the application here.',
      href: null,
      cta: null,
    },
  ];
  const next = steps.findIndex(s => !s.done);

  return (
    <div className="mb-6 rounded-2xl border border-indigo-500/25 bg-indigo-500/5 p-5 no-print">
      <h2 className="text-sm font-bold text-white mb-1">Get started in 3 steps</h2>
      <p className="text-xs text-zinc-400 mb-4">
        {vaultReady ? 'Your Master Vault is ready — tailor your first application.' : 'Start with your Master Vault: tailoring needs your real experience to work from.'}
      </p>
      <ol className="grid gap-3 md:grid-cols-3">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className={`rounded-xl border p-3 text-xs ${i === next ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 bg-white/[0.02]'}`}
          >
            <p className="font-bold text-white flex items-center gap-1.5 mb-1">
              {s.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-zinc-500" />}
              {i + 1}. {s.title}
            </p>
            <p className="text-zinc-400 leading-relaxed">{s.text}</p>
            {s.href && !s.done && i === next && (
              <Link
                href={s.href}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px]"
              >
                {s.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
