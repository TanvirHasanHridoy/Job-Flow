/**
 * CoverLetterClassic — Pixel-perfect Tailwind reproduction of a
 * German-style business cover letter (Bewerbungsschreiben).
 *
 * Design tokens extracted from the reference image:
 *   - Background:  white       #FFFFFF
 *   - Text:        near-black  #1a1a1a
 *   - Text muted:  dark gray   #333333
 *   - Font stack:  system sans-serif (Inter / Calibri feel)
 *
 * Layout: single-column A4 page.
 *   - Sender address:    right-aligned block at top
 *   - Recipient address: left-aligned block
 *   - Date line:         right-aligned, flush with recipient block bottom
 *   - Subject:           bold, left-aligned
 *   - Body:              left-aligned paragraphs
 *   - Closing + signature + enclosure at bottom
 */

import React from 'react';

/* ─── main component ──────────────────────────────────── */

export default function CoverLetterClassic() {
  return (
    <div
      className="bg-white text-[#1a1a1a] mx-auto shadow-lg print:shadow-none"
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontFamily: '"Inter", "Calibri", "Segoe UI", system-ui, sans-serif',
        fontSize: '11.5px',
        lineHeight: 1.65,
        padding: '32mm 28mm 24mm 28mm',
      }}
    >
      {/* ───── Sender address (right-aligned) ───── */}
      <div className="text-right text-[11.5px] leading-[1.7]">
        <p>Emma Frost</p>
        <p>Kurzstraße 55</p>
        <p>40225 Hamburg</p>
        <p>+491234567890</p>
        <p>emma.frost@gmail.com</p>
      </div>

      {/* ───── Recipient address + Date row ───── */}
      <div className="mt-10 flex justify-between items-end">
        {/* Recipient (left) */}
        <div className="text-[11.5px] leading-[1.7]">
          <p>ABC Travel</p>
          <p>Maria Schmidt</p>
          <p>Langstrasse 45</p>
          <p>40229 Hamburg</p>
        </div>

        {/* Date (right-aligned) */}
        <p className="text-[11.5px]">Hamburg, April 3rd, 2021</p>
      </div>

      {/* ───── Subject line ───── */}
      <p className="mt-12 font-bold text-[12px]">
        Application for Product Sales Manager
      </p>

      {/* ───── Salutation ───── */}
      <p className="mt-8 text-[11.5px]">Dear Maria,</p>

      {/* ───── Body paragraphs ───── */}
      <div className="mt-5 space-y-4 text-[11.5px] leading-[1.65]">
        <p>
          My name is Emma, and I am excited to apply for the position of Product
          Sales Manager published on your website. I am confident that I will
          contribute to ABC Travel's ongoing success and expansion in the
          German travel industry.
        </p>

        <p>
          During the past three years, my role as a Sales Executive has been to
          grow individual and team sales for the German market. My achievements
          include increasing the conversion rate by 5% and overall sales by 20%
          through more targeted online and telephone sales. I was happy to
          share my newly developed tactics with other team members, which
          contributed to winning the 'Team of the Year' Award last year.
        </p>

        <p>
          Just like ABC Travel, I am always eager to grow. As your Product
          Sales Manager, I'd apply my proven sales tactics to accelerate your
          expansion in Germany. The balance between measurable results and
          satisfied returning customers is my main drive. The fact that ABC
          Travel's number 1 core value is quality matches my high personal
          standards.
        </p>

        <p>
          I would be thrilled if August 1st will be my first of many days as
          Product Sales Manager with your inspiring company. Establishing ABC
          Travel as the market leader in Germany will be my goal. I am looking
          forward to answering any questions in a personal interview.
        </p>
      </div>

      {/* ───── Closing ───── */}
      <p className="mt-8 text-[11.5px]">Best regards,</p>

      {/* ───── Signature (handwritten-style) ───── */}
      <div className="mt-3 h-[32px] flex items-end">
        <svg
          width="80"
          height="32"
          viewBox="0 0 80 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#1a1a1a]"
        >
          <path
            d="M 10 24 C 10 8, 22 2, 22 14 C 22 20, 16 26, 12 24 C 10 22, 14 18, 20 18 C 24 18, 26 22, 28 20 C 30 18, 30 20, 32 20 C 34 20, 34 22, 36 20 C 44 8, 48 2, 46 16 C 45 24, 40 28, 43 28 C 46 28, 52 14, 56 16 C 58 17, 58 20, 60 20 C 62 20, 62 18, 64 18 C 66 18, 67 22, 70 20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ───── Printed name ───── */}
      <p className="mt-1.5 text-[11.5px]">Emma Frost</p>

      {/* ───── Enclosure section ───── */}
      <div className="mt-8 text-[11.5px]">
        <p>Enclosure:</p>
        <div className="ml-4 mt-1 space-y-0.5">
          <p className="flex items-start gap-3">
            <span className="text-[#1a1a1a]">-</span>
            <span>Curriculum Vitae</span>
          </p>
          <p className="flex items-start gap-3">
            <span className="text-[#1a1a1a]">-</span>
            <span>Bachelor Degree Diploma</span>
          </p>
          <p className="flex items-start gap-3">
            <span className="text-[#1a1a1a]">-</span>
            <span>Reference letter from previous employers</span>
          </p>
        </div>
      </div>
    </div>
  );
}
