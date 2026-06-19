/**
 * Verification Test — Identical-twin reproduction of EuropassClassic.tsx
 *
 * RULES:
 *  - Every Tailwind class, inline style, spacing value, and component
 *    hierarchy is copied verbatim from the original.
 *  - ONLY the text content has been swapped to a fictional
 *    Data Scientist named "Sarah Johansson" with entirely different
 *    companies, dates, skills, and education.
 *
 * Design tokens (unchanged from original):
 *   - Background:  #F7F3EC    Accent: #2980B9
 *   - Text dark:   gray-800   Muted:  gray-500
 *   - Divider:     #CBD5E1    Font:   Inter / Calibri / system
 */

import React from 'react';

/* ─── tiny helpers ────────────────────────────────────── */

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
      <span className="mt-[5px] min-w-[4px] min-h-[4px] w-1 h-1 rounded-full bg-gray-500" />
      <span>{children}</span>
    </li>
  );
}

/* ─── main component ──────────────────────────────────── */

export default function VerificationTest() {
  return (
    <div
      className="bg-[#F7F3EC] text-gray-800 mx-auto shadow-lg print:shadow-none"
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
            Sarah Johansson
          </h1>
          <p className="text-[#2980B9] text-[13px] font-medium mt-0.5">
            Data Scientist
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
        <p><span className="font-semibold">Address:</span> Kungsgatan 14, Stockholm</p>
        <p><span className="font-semibold">Phone:</span> +46 70 123 4567</p>
        <p><span className="font-semibold">Email:</span> sarah.johansson@email.se</p>
        <p><span className="font-semibold">Date of birth:</span> March 15th, 1992</p>
        <p><span className="font-semibold">Nationality:</span> Swedish</p>
        <p><span className="font-semibold">LinkedIn:</span> linkedin.com/in/sjohansson</p>
        <p><span className="font-semibold">Website:</span> sarahjohansson.io</p>
        <p><span className="font-semibold">Github:</span> github.com/sjohansson</p>
      </div>

      {/* ───── Professional Profile ───── */}
      <SectionHeading>Professional Profile</SectionHeading>
      <p className="text-[11.5px] text-gray-700 leading-[1.6]">
        Data scientist with 4+ years of experience transforming raw data
        into actionable business insights across fintech and healthcare
        sectors. Proficient in statistical modelling, machine learning
        pipelines, and large-scale data engineering. Passionate about
        bridging the gap between research prototypes and production-grade
        ML systems, with a strong foundation in experiment design and
        causal inference.
      </p>

      {/* ───── Work History ───── */}
      <SectionHeading>Work History</SectionHeading>

      <table className="w-full border-collapse">
        <tbody>
          {/* Job 1 */}
          <tr>
            <DateCell>03/2022 – present</DateCell>
            <ContentCell>
              <SubHeading>Senior Data Scientist</SubHeading>
              <p className="text-[11px] text-gray-600">Nordic Health Analytics AB – nordichealth.ai</p>
              <Muted>Stockholm, Sweden</Muted>

              <p className="mt-2 text-[11px] text-gray-600">
                Led the ML research team developing predictive models
                for patient readmission risk, deployed across 12
                hospital networks in Scandinavia.
              </p>

              <ul className="mt-1.5 space-y-1 list-none pl-0">
                <Bullet>
                  Designed a gradient-boosted ensemble model that
                  reduced 30-day readmission rates by 18%, saving
                  an estimated €2.4M annually across partner hospitals.
                </Bullet>
                <Bullet>
                  Built an end-to-end MLOps pipeline using MLflow,
                  Airflow, and Kubernetes, cutting model deployment
                  time from 3 weeks to 2 days.
                </Bullet>
                <Bullet>
                  Developed an interactive Streamlit dashboard for
                  clinicians to explore risk factors, adopted by 85%
                  of target clinical staff within 6 months.
                </Bullet>
                <Bullet>
                  Published 2 peer-reviewed papers on federated
                  learning for privacy-preserving health data analysis.
                </Bullet>
              </ul>
            </ContentCell>
          </tr>

          {/* Job 2 */}
          <tr>
            <DateCell>08/2019 – 02/2022</DateCell>
            <ContentCell>
              <SubHeading>Data Analyst</SubHeading>
              <p className="text-[11px] text-gray-600">Klarna Bank AB – klarna.com</p>
              <Muted>Stockholm, Sweden</Muted>

              <ul className="mt-2 space-y-1 list-none pl-0">
                <Bullet>
                  Created a customer churn prediction model using
                  XGBoost that identified at-risk users with 92%
                  precision, enabling targeted retention campaigns.
                </Bullet>
                <Bullet>
                  Automated weekly KPI reporting with Python and
                  Apache Spark, replacing a 6-hour manual process
                  with a 15-minute scheduled pipeline.
                </Bullet>
                <Bullet>
                  Conducted A/B testing frameworks for 20+ product
                  experiments, directly influencing pricing strategy
                  changes that increased revenue by 8%.
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
            <DateCell>2024</DateCell>
            <ContentCell>
              <SubHeading>Open-Source NLP Toolkit for Swedish</SubHeading>
              <p className="text-[11px] text-gray-600">
                Built a spaCy-compatible NLP pipeline for Swedish
                medical text. The toolkit includes named entity
                recognition for drug names, diagnoses, and lab
                values. Published on PyPI with 800+ weekly downloads.
              </p>
            </ContentCell>
          </tr>

          <tr>
            <DateCell>2023</DateCell>
            <ContentCell>
              <SubHeading>Personal Finance Forecasting App</SubHeading>
              <p className="text-[11px] text-gray-600">
                Developed a personal budgeting web app that uses
                time-series forecasting (Prophet) to predict monthly
                spending patterns. Deployed on AWS Lambda with a
                React frontend.
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
            <DateCell>09/2018 – 03/2019</DateCell>
            <ContentCell>
              <SubHeading>Deep Learning Specialization</SubHeading>
              <p className="text-[11px] text-gray-600">Andrew Ng – deeplearning.ai</p>
              <Muted>Online Course</Muted>
            </ContentCell>
          </tr>

          <tr>
            <DateCell>01/2017 – 06/2017</DateCell>
            <ContentCell>
              <SubHeading>Data Science Bootcamp – Immersive Track</SubHeading>
              <p className="text-[11px] text-gray-600">Hyper Island – hyperisland.com</p>
              <Muted>Stockholm, Sweden</Muted>
            </ContentCell>
          </tr>

          <tr>
            <DateCell>09/2012 – 06/2017</DateCell>
            <ContentCell>
              <SubHeading>Master in Applied Mathematics &amp; Statistics</SubHeading>
              <p className="text-[11px] text-gray-600">KTH Royal Institute of Technology (University)</p>
              <Muted>Stockholm, Sweden</Muted>
              <Muted>Graduated with Honours</Muted>
            </ContentCell>
          </tr>
        </tbody>
      </table>

      {/* ───── Additional Skills ───── */}
      <SectionHeading>Additional Skills</SectionHeading>

      {/* Languages sub-section */}
      <p className="font-semibold text-gray-800 text-[12px] mt-3 mb-1">Languages</p>
      <ul className="list-none pl-0 space-y-0.5">
        <Bullet>Swedish (Mother Tongue), English (C2), German (B2)</Bullet>
      </ul>

      {/* IT Skills sub-section */}
      <p className="font-semibold text-gray-800 text-[12px] mt-4 mb-1">IT-Skills</p>
      <ul className="list-none pl-0 space-y-0.5">
        <Bullet>
          <span className="font-medium">Advanced Knowledge:</span> Python, Pandas, scikit-learn, TensorFlow, SQL
        </Bullet>
        <Bullet>
          <span className="font-medium">Intermediate:</span> PyTorch, Apache Spark, Airflow, Docker, dbt
        </Bullet>
        <Bullet>
          <span className="font-medium">Basic:</span> Rust, Julia, Terraform
        </Bullet>
      </ul>

      {/* ───── Signing block ───── */}
      <div className="mt-10 text-[11px] text-gray-600">
        <p>19.06.2026</p>
        <p className="mt-3 italic text-gray-700 text-[12px]">Sarah Johansson</p>
      </div>
    </div>
  );
}
