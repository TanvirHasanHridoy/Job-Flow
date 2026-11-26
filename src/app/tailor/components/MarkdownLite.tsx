'use client';

import React from 'react';

/**
 * Minimal, safe markdown renderer for AI-written analysis text:
 * "### Heading", "- bullet" / "* bullet", and **bold**. No HTML is injected.
 */
export function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      : <React.Fragment key={i}>{part}</React.Fragment>
  );
}

export default function MarkdownLite({ text, className = '' }: { text: string; className?: string }) {
  const lines = (text || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = () => {
    if (bullets.length === 0) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="list-disc pl-4 space-y-1 mb-2">
        {bullets.map((b, i) => <li key={i}>{renderInline(b)}</li>)}
      </ul>
    );
    bullets = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushBullets(); continue; }
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (heading) {
      flushBullets();
      blocks.push(<p key={`h-${blocks.length}`} className="font-bold uppercase tracking-wide text-[11px] mt-2 mb-1">{renderInline(heading[1])}</p>);
    } else if (bullet) {
      bullets.push(bullet[1]);
    } else {
      flushBullets();
      blocks.push(<p key={`p-${blocks.length}`} className="mb-2">{renderInline(line)}</p>);
    }
  }
  flushBullets();

  return <div className={className}>{blocks}</div>;
}
