'use client';

import React, { useLayoutEffect, useRef } from 'react';

/** Text in square brackets the AI left for the user to fill in, e.g. "[Hiring Manager Name]". */
export const PLACEHOLDER_RE = /\[[^\]\n]{1,60}\]/g;

export function findPlaceholders(text: string): string[] {
  return Array.from(new Set(text.match(PLACEHOLDER_RE) ?? []));
}

/** LinkedIn connection notes: 300 characters (200 on free accounts). */
export const LINKEDIN_NOTE_LIMIT = 300;

interface OutreachTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Show a live character counter against this limit. */
  maxChars?: number;
  limitHint?: string;
}

/**
 * Editable outreach message (UX audit 7.6):
 *  - grows with its content instead of a fixed-height box,
 *  - optional live character counter (LinkedIn notes),
 *  - lists unfilled [placeholders] so they don't get sent by accident.
 */
export default function OutreachTextarea({ id, label, value, onChange, maxChars, limitHint }: OutreachTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);

  const placeholders = findPlaceholders(value);
  const over = maxChars !== undefined && value.length > maxChars;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-zinc-400 uppercase">{label}</label>
        {maxChars !== undefined && (
          <span
            className={`text-xs font-semibold tabular-nums ${over ? 'text-rose-400' : 'text-zinc-500'}`}
            aria-live="polite"
          >
            {value.length} / {maxChars}
          </span>
        )}
      </div>
      <textarea
        id={id}
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={4}
        aria-invalid={over || undefined}
        aria-describedby={over || placeholders.length ? `${id}-hint` : undefined}
        className={`glass-input p-3 text-sm text-white font-sans w-full leading-relaxed resize-none overflow-hidden ${over ? 'border-rose-500/60' : ''}`}
      />
      {(over || placeholders.length > 0) && (
        <div id={`${id}-hint`} className="space-y-1 text-xs">
          {over && (
            <p className="text-rose-300">
              {value.length - maxChars!} characters over the limit. {limitHint}
            </p>
          )}
          {placeholders.length > 0 && (
            <p className="text-amber-300">
              Fill in before sending: {placeholders.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
