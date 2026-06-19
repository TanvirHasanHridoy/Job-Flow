/**
 * CoverLetterVerification — Identical-twin reproduction of CoverLetterClassic.tsx.
 *
 * RULES:
 *  - Every Tailwind class, inline style, spacing value, and component
 *    hierarchy is copied verbatim from the original.
 *  - ONLY the text content has been swapped to a fictional
 *    applicant named "Max Mustermann" with different details.
 */

import React from 'react';

/* ─── main component ──────────────────────────────────── */

export default function CoverLetterVerification() {
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
        <p>Max Mustermann</p>
        <p>Musterstraße 42</p>
        <p>80331 München</p>
        <p>+49 123 456789</p>
        <p>max.mustermann@email.com</p>
      </div>

      {/* ───── Recipient address + Date row ───── */}
      <div className="mt-10 flex justify-between items-end">
        {/* Recipient (left) */}
        <div className="text-[11.5px] leading-[1.7]">
          <p>Software Company GmbH</p>
          <p>Erika Müller</p>
          <p>Industriestraße 10</p>
          <p>80339 München</p>
        </div>

        {/* Date (right-aligned) */}
        <p className="text-[11.5px]">München, January 15th, 2026</p>
      </div>

      {/* ───── Subject line ───── */}
      <p className="mt-12 font-bold text-[12px]">
        Application for Senior Software Engineer
      </p>

      {/* ───── Salutation ───── */}
      <p className="mt-8 text-[11.5px]">Dear Ms. Müller,</p>

      {/* ───── Body paragraphs ───── */}
      <div className="mt-5 space-y-4 text-[11.5px] leading-[1.65]">
        <p>
          My name is Max, and I am writing to express my strong interest in the
          Senior Software Engineer position advertised on your website. With
          over five years of hands-on experience in full-stack development and
          cloud architecture, I am confident that I can make a meaningful
          contribution to your engineering team and help drive the next
          generation of your product suite.
        </p>

        <p>
          In my current role at Digital Agency AG, I have been responsible for
          leading the migration of a monolithic application to a microservices
          architecture, which resulted in a 40% reduction in deployment times
          and a significant improvement in system reliability. I have also
          spearheaded the introduction of CI/CD pipelines using GitHub Actions
          and Docker, enabling daily releases where previously the team shipped
          on a bi-weekly cycle.
        </p>

        <p>
          What excites me most about Software Company GmbH is your commitment
          to building developer-first tools that empower engineering teams
          worldwide. I am eager to bring my expertise in React, Node.js, and
          TypeScript to your platform, and I am particularly drawn to the
          opportunity to work on scalable, real-time systems that serve
          thousands of concurrent users.
        </p>

        <p>
          I would be thrilled if January 15th will be the beginning of many
          productive days as Senior Software Engineer with your inspiring
          company. I look forward to answering any questions in a personal
          interview.
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
            d="M 8 20 C 8 8, 16 6, 20 18 C 24 10, 28 8, 30 18 C 32 18, 34 22, 36 20 C 38 18, 42 16, 46 22 C 48 24, 50 16, 52 18 C 54 20, 56 22, 58 20 C 60 18, 62 20, 66 22 C 68 24, 70 20, 74 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ───── Printed name ───── */}
      <p className="mt-1.5 text-[11.5px]">Max Mustermann</p>

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
            <span>University Degree Certificate</span>
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
