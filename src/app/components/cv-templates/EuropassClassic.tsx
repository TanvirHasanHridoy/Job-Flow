/**
 * EuropassClassic — A pixel-perfect Tailwind reproduction of the
 * classic Europass / German-style CV layout.
 *
 * Design tokens extracted from the reference images:
 *   - Background:  warm cream  #F7F3EC
 *   - Accent:      ocean blue  #2980B9
 *   - Text dark:   charcoal    #1F2937
 *   - Text muted:  warm gray   #6B7280
 *   - Divider:     light gray  #CBD5E1
 *   - Font stack:  system sans-serif (Inter / Calibri feel)
 *
 * Layout: single-column A4 page with a 28/72 date–content split
 *         for entries, a passport-photo slot in the header, and
 *         section headers that colour-split the first word (dark)
 *         from the rest (blue) with wide letter-spacing.
 */

import React from 'react';

/* ─── tiny helpers ────────────────────────────────────── */

/** Split "Work History" → ["Work", "History"] for colour splitting. */
function splitHeading(text: string): [string, string] {
  const idx = text.indexOf(' ');
  if (idx === -1) return [text, ''];
  return [text.slice(0, idx), text.slice(idx + 1)];
}

/* ─── sub-components ──────────────────────────────────── */

function SectionHeading({ children }: { children: string }) {
  const [first, rest] = splitHeading(children);
  return (
    <div className="mt-7 mb-2">
      <h2 className="text-[15px] font-bold tracking-[0.22em] uppercase">
        <span className="text-gray-800">{first}</span>
        {rest && <span className="text-[#2980B9]">&nbsp;{rest}</span>}
      </h2>
      <div className="border-b border-[#CBD5E1] mt-1" />
    </div>
  );
}

function DateCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="align-top pr-6 py-1 text-[11px] text-gray-500 whitespace-nowrap w-[28%]">
      {children}
    </td>
  );
}

function ContentCell({ children }: { children: React.ReactNode }) {
  return <td className="align-top py-1 text-[11.5px] text-gray-700 leading-[1.55]">{children}</td>;
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold text-[#2980B9] text-[12px]">{children}</p>;
}

function Muted({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-500 text-[11px]">{children}</p>;
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-1.5 text-[11.5px] text-gray-700 leading-[1.55]">
      <span className="text-gray-500 leading-none mt-[2px] font-sans">•</span>
      <span>{children}</span>
    </li>
  );
}

/* ─── main component ──────────────────────────────────── */

export default function EuropassClassic() {
  return (
    <div
      className="bg-white text-gray-800 mx-auto shadow-lg print:shadow-none"
      style={{
        width: '210mm',
        minHeight: '297mm',
        fontFamily: '"Inter", "Calibri", "Segoe UI", system-ui, sans-serif',
        fontSize: '11.5px',
        lineHeight: 1.55,
        padding: '28mm 24mm 20mm 24mm',
      }}
    >
      {/* ═══════════════════ PAGE 1 ═══════════════════ */}

      {/* ───── Header ───── */}
      <div className="flex justify-between items-start">
        {/* Name + subtitle */}
        <div>
          <h1 className="text-[24px] font-bold text-gray-800 leading-tight">
            Max Mustermann
          </h1>
          <p className="text-[#2980B9] text-[13px] font-medium mt-0.5">
            Senior Software Engineer
          </p>
        </div>

        {/* Photo placeholder */}
        <div className="w-[85px] h-[105px] bg-gray-300 rounded-sm overflow-hidden flex-shrink-0 border border-gray-200">
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px] text-center leading-tight">
            Photo
          </div>
        </div>
      </div>

      {/* ───── Contact details grid ───── */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-0.5 mt-3 text-[11px] text-gray-700">
        <p><span className="font-semibold">Address:</span> Musterstraße 42, München</p>
        <p><span className="font-semibold">Phone:</span> +49 123 456789</p>
        <p><span className="font-semibold">Email:</span> max.mustermann@email.com</p>
        <p><span className="font-semibold">Date of birth:</span> January 1st, 1990</p>
        <p><span className="font-semibold">Nationality:</span> German</p>
        <p><span className="font-semibold">LinkedIn:</span> linkedin.com/in/mmustermann</p>
        <p><span className="font-semibold">Website:</span> maxmustermann.dev</p>
        <p><span className="font-semibold">Github:</span> github.com/mmustermann</p>
      </div>

      {/* ───── Professional Profile ───── */}
      <SectionHeading>Professional Profile</SectionHeading>
      <p className="text-[11.5px] text-gray-700 leading-[1.6]">
        Full-stack software engineer with 5+ years of experience building
        scalable web applications across diverse industries. Skilled in
        modern JavaScript frameworks, cloud infrastructure, and agile
        methodologies. Proven track record of delivering high-impact
        features from architecture to production deployment, with a
        particular strength in translating complex requirements into clean,
        maintainable code.
      </p>

      {/* ───── Work History ───── */}
      <SectionHeading>Work History</SectionHeading>

      <table className="w-full border-collapse">
        <tbody>
          {/* Job 1 */}
          <tr>
            <DateCell>05/2021 – present</DateCell>
            <ContentCell>
              <SubHeading>Senior Software Engineer</SubHeading>
              <p className="text-[11px] text-gray-600">Software Company GmbH – softwarecompany.com</p>
              <Muted>München, Germany</Muted>

              <p className="mt-2 text-[11px] text-gray-600">
                Led a cross-functional team in designing and shipping
                customer-facing SaaS products used by 50,000+ monthly
                active users.
              </p>

              <ul className="mt-1.5 space-y-1 list-none pl-0">
                <Bullet>
                  Architected a microservices migration that reduced
                  API response times by 40% and improved deployment
                  frequency from bi-weekly to daily releases.
                </Bullet>
                <Bullet>
                  Built a real-time analytics dashboard using React,
                  Next.js, and WebSocket integration, serving data to
                  200+ enterprise clients.
                </Bullet>
                <Bullet>
                  Introduced a CI/CD pipeline with GitHub Actions and
                  Docker, cutting release cycle time by 60%.
                </Bullet>
                <Bullet>
                  Mentored 4 junior developers through code reviews,
                  pair programming sessions, and architecture workshops.
                </Bullet>
              </ul>
            </ContentCell>
          </tr>

          {/* Job 2 */}
          <tr>
            <DateCell>09/2018 – 04/2021</DateCell>
            <ContentCell>
              <SubHeading>Full-Stack Developer</SubHeading>
              <p className="text-[11px] text-gray-600">Digital Agency AG – digitalagency.de</p>
              <Muted>Düsseldorf, Germany</Muted>

              <ul className="mt-2 space-y-1 list-none pl-0">
                <Bullet>
                  Developed and maintained 8 client-facing web
                  applications using React, Node.js, and PostgreSQL.
                </Bullet>
                <Bullet>
                  Implemented a headless CMS integration that reduced
                  content publishing time from 2 hours to 10 minutes.
                </Bullet>
                <Bullet>
                  Built a custom Chrome extension for internal teams
                  that automated repetitive QA tasks, saving 15 hours
                  per week.
                </Bullet>
              </ul>
            </ContentCell>
          </tr>
        </tbody>
      </table>

      {/* ═══════════════════ PAGE 2 ═══════════════════ */}

      {/* ───── Other Projects ───── */}
      <SectionHeading>Other Projects</SectionHeading>

      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <DateCell>2023</DateCell>
            <ContentCell>
              <SubHeading>Open-Source Dashboard Toolkit</SubHeading>
              <p className="text-[11px] text-gray-600">
                Created an open-source React component library for
                building analytics dashboards. The toolkit supports
                theming, drag-and-drop widgets, and real-time data
                binding. Published on npm with 1,200+ weekly downloads.
              </p>
            </ContentCell>
          </tr>

          <tr>
            <DateCell>2022</DateCell>
            <ContentCell>
              <SubHeading>E-Commerce Platform Redesign</SubHeading>
              <p className="text-[11px] text-gray-600">
                Designed and coded a custom Shopify theme for a local
                fashion brand, resulting in a 35% increase in mobile
                conversion rate.
              </p>
            </ContentCell>
          </tr>
        </tbody>
      </table>

      {/* ───── Education ───── */}
      <SectionHeading>Education</SectionHeading>

      <table className="w-full border-collapse">
        <tbody>
          <tr>
            <DateCell>01/2017 – 06/2017</DateCell>
            <ContentCell>
              <SubHeading>Advanced React & Node.js</SubHeading>
              <p className="text-[11px] text-gray-600">Wes Bos – wesbos.com</p>
              <Muted>Online Course</Muted>
            </ContentCell>
          </tr>

          <tr>
            <DateCell>01/2016 – 06/2016</DateCell>
            <ContentCell>
              <SubHeading>Coding Bootcamp – Full Stack Developer Track</SubHeading>
              <p className="text-[11px] text-gray-600">Code Academy – codeacademy.io</p>
              <Muted>Online</Muted>
            </ContentCell>
          </tr>

          <tr>
            <DateCell>10/2012 – 09/2016</DateCell>
            <ContentCell>
              <SubHeading>Bachelor in Computer Science</SubHeading>
              <p className="text-[11px] text-gray-600">Technische Universität München (University)</p>
              <Muted>München, Germany</Muted>
              <Muted>Graduated with Distinction</Muted>
            </ContentCell>
          </tr>
        </tbody>
      </table>

      {/* ───── Additional Skills ───── */}
      <SectionHeading>Additional Skills</SectionHeading>

      {/* Languages sub-section */}
      <p className="font-semibold text-gray-800 text-[12px] mt-3 mb-1">Languages</p>
      <ul className="list-none pl-0 space-y-0.5">
        <Bullet>German (Mother Tongue), English (C2), French (B1)</Bullet>
      </ul>

      {/* IT Skills sub-section */}
      <p className="font-semibold text-gray-800 text-[12px] mt-4 mb-1">IT-Skills</p>
      <ul className="list-none pl-0 space-y-0.5">
        <Bullet>
          <span className="font-medium">Advanced Knowledge:</span> TypeScript, React, Next.js, Node.js, PostgreSQL
        </Bullet>
        <Bullet>
          <span className="font-medium">Intermediate:</span> Python, Docker, AWS, GraphQL, MongoDB
        </Bullet>
        <Bullet>
          <span className="font-medium">Basic:</span> Rust, Go, Kubernetes
        </Bullet>
      </ul>

      {/* ───── Signing block ───── */}
      <div className="mt-10 text-[11px] text-gray-600">
        <p>01.01.2026</p>
        <p className="mt-3 italic text-gray-700 text-[12px]">Max Mustermann</p>
      </div>
    </div>
  );
}
