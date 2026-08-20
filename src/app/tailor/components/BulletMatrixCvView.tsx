'use client';

import React, { useRef, useEffect } from 'react';
import { Sparkles, Wand2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { CustomSection } from '@/lib/customSections';

interface ContentEditableProps {
  tagName: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div' | 'li';
  value: string;
  onChange: (val: string) => void;
  onBlur?: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
  isMeasurement?: boolean;
  useInnerText?: boolean;
  [key: string]: any;
}

const EditableText = ({
  tagName: Tag,
  value,
  onChange,
  onBlur,
  className,
  style,
  isMeasurement = false,
  useInnerText = false,
  ...props
}: ContentEditableProps) => {
  const ref = useRef<HTMLElement>(null);
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (ref.current) {
      if (useInnerText) {
        ref.current.innerText = value || '';
      } else {
        ref.current.innerHTML = value || '';
      }
    }
  }, [value, useInnerText]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const target = e.currentTarget;
    const text = useInnerText ? target.innerText : target.innerHTML;
    onChange(text);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    isFocusedRef.current = false;
    if (onBlur) onBlur(e);
  };

  return React.createElement(Tag, {
    ref,
    contentEditable: !isMeasurement,
    suppressContentEditableWarning: true,
    onInput: handleInput,
    onFocus: handleFocus,
    onBlur: handleBlur,
    className: `${className || ''} ${!isMeasurement ? 'hover:bg-indigo-50/40 focus:bg-indigo-50/60 focus:ring-1 focus:ring-indigo-400/60 rounded px-0.5 transition-all outline-none' : ''}`,
    style,
    ...props
  });
};

export interface BulletMatrixCvViewProps {
  result: any;
  profile: any;
  cvLanguage?: 'EN' | 'DE';
  bulletStyle?: string;
  skillsFocus?: string;
  sectionOrder?: string[];
  hiddenSections?: string[];
  customSections?: CustomSection[];
  selectedProjects?: string[];
  showSignatureSection?: boolean;
  showSignatureImage?: boolean;
  signingLocation?: string;
  fontSize?: number;
  sectionSpacing?: number;
  bulletSpacing?: number;
  pagePaddingTop?: number;
  pagePaddingBottom?: number;
  pagePaddingSide?: number;
  scale?: number;
  isMeasurement?: boolean;
  handleCvDetailsChange?: (field: string, val: string, isPartial?: boolean) => void;
  handleSummaryChange?: (val: string, isPartial?: boolean) => void;
  handleBulletChange?: (expIdx: number, bulletIdx: number, val: string, isPartial?: boolean) => void;
  handleProjectChange?: (projIdx: number, field: string, val: any, isPartial?: boolean) => void;
  handleSkillChange?: (skillIdx: number, field: string, val: any) => void;
  handleOpenRegenModal?: (sectionKey: string, sectionTitle: string, currentContent: any) => void;
  handleFetchBulletVariations?: (expIdx: number, bIdx: number, bulletText: string) => void;
  handleFetchProjectVariations?: (projIdx: number, projName: string, desc: string) => void;
}

export default function BulletMatrixCvView({
  result,
  profile,
  cvLanguage = 'EN',
  bulletStyle = 'STAR Method',
  sectionOrder = ['summary', 'skills', 'projects', 'work', 'education', 'languages', 'certifications'],
  hiddenSections = [],
  customSections = [],
  selectedProjects = [],
  showSignatureSection = false,
  showSignatureImage = false,
  signingLocation = 'München',
  fontSize = 13.33,
  sectionSpacing = 16,
  bulletSpacing = 4.5,
  pagePaddingTop = 14,
  pagePaddingBottom = 14,
  pagePaddingSide = 16,
  scale = 1,
  isMeasurement = false,
  handleCvDetailsChange,
  handleSummaryChange,
  handleBulletChange,
  handleProjectChange,
  handleSkillChange,
  handleOpenRegenModal,
  handleFetchBulletVariations,
  handleFetchProjectVariations
}: BulletMatrixCvViewProps) {
  if (!result || !result.tailoredCv) return null;

  const cv = result.tailoredCv;
  const personal = cv.personalDetails || {
    fullName: profile?.fullName || 'Full Name',
    email: profile?.email || 'email@example.com',
    phone: profile?.phone || '',
    address: profile?.address || '',
    linkedin: profile?.linkedin || '',
    github: profile?.github || '',
    website: profile?.website || ''
  };

  // Helper to extract summary bullets
  const getSummaryBullets = (): string[] => {
    if (Array.isArray(cv.summaryBullets) && cv.summaryBullets.length > 0) {
      return cv.summaryBullets;
    }
    if (typeof cv.summary === 'string') {
      const lines = cv.summary
        .split('\n')
        .map((l: string) => l.replace(/^[•\-\*]\s*/, '').trim())
        .filter((l: string) => l.length > 0);
      if (lines.length > 0) return lines;
      return [cv.summary];
    }
    if (Array.isArray(cv.summary)) {
      return cv.summary;
    }
    return [];
  };

  // Helper to group skills by category for pipe clusters
  const getCategorizedSkills = () => {
    const rawSkills: Array<{ name: string; category?: string; level?: string }> = Array.isArray(cv.skills) ? cv.skills : [];
    const categories: Record<string, string[]> = {
      'Frontend': [],
      'Backend': [],
      'Database': [],
      'Tools & Cloud': []
    };

    rawSkills.forEach(s => {
      const cat = s.category || 'Tools & Cloud';
      if (categories[cat]) {
        categories[cat].push(s.name);
      } else {
        const matchingKey = Object.keys(categories).find(k => k.toLowerCase().includes(cat.toLowerCase())) || 'Tools & Cloud';
        categories[matchingKey].push(s.name);
      }
    });

    return Object.entries(categories).filter(([_, items]) => items.length > 0);
  };

  // Helper to get active bullet for experience
  const getActiveBulletText = (bullets: any, bIdx: number): string => {
    if (Array.isArray(bullets)) return bullets[bIdx] || '';
    if (typeof bullets === 'object' && bullets !== null) {
      if (bulletStyle === 'STAR Method' && Array.isArray(bullets.star)) return bullets.star[bIdx] || bullets.standard?.[bIdx] || '';
      if (bulletStyle === 'Punchy Highlights' && Array.isArray(bullets.punchy)) return bullets.punchy[bIdx] || bullets.standard?.[bIdx] || '';
      if (Array.isArray(bullets.standard)) return bullets.standard[bIdx] || '';
      const firstKey = Object.keys(bullets)[0];
      if (firstKey && Array.isArray(bullets[firstKey])) return bullets[firstKey][bIdx] || '';
    }
    return '';
  };

  // Section titles
  const sectionTitles: Record<string, string> = {
    summary: cvLanguage === 'DE' ? 'BERUFLICHE ZUSAMMENFASSUNG' : 'PROFESSIONAL SUMMARY',
    skills: cvLanguage === 'DE' ? 'TECHNISCHE FÄHIGKEITEN' : 'TECHNICAL SKILLS',
    projects: cvLanguage === 'DE' ? 'PROJEKTE' : 'PROJECTS',
    work: cvLanguage === 'DE' ? 'BERUFSERFAHRUNG' : 'PROFESSIONAL EXPERIENCES',
    education: cvLanguage === 'DE' ? 'AUSBILDUNG' : 'EDUCATION',
    languages: cvLanguage === 'DE' ? 'SPRACHEN' : 'LANGUAGES',
    certifications: cvLanguage === 'DE' ? 'ZERTIFIZIERUNGEN' : 'CERTIFICATIONS'
  };

  // Section Renderers
  const renderSummarySection = () => {
    const bullets = getSummaryBullets();
    return (
      <div key="summary" data-block-id="summary" className="relative group/sec" style={{ marginBottom: `${sectionSpacing}px` }}>
        {/* Hover AI Regen Button */}
        {!isMeasurement && handleOpenRegenModal && (
          <div className="absolute right-0 -top-1 opacity-0 group-hover/sec:opacity-100 transition-opacity z-20 no-print flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenRegenModal('summary', sectionTitles.summary, cv.summary)}
              className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-sans font-medium shadow"
              title="Regenerate Summary with AI"
            >
              <Sparkles className="w-3 h-3 text-indigo-200" />
              <span>Regen</span>
            </button>
          </div>
        )}

        <h2 className="text-[14pt] font-bold uppercase text-black mb-1.5 tracking-[0.2px] leading-tight">
          {sectionTitles.summary}
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          {bullets.map((bText, bIdx) => (
            <li key={bIdx} className="leading-[1.45] text-[10pt] text-black">
              <EditableText
                tagName="span"
                value={bText}
                onChange={(val) => {
                  if (handleSummaryChange) {
                    const newBullets = [...bullets];
                    newBullets[bIdx] = val;
                    handleSummaryChange(newBullets.join('\n'), true);
                  }
                }}
                onBlur={(e: any) => {
                  if (handleSummaryChange) {
                    const newBullets = [...bullets];
                    newBullets[bIdx] = e.target.innerText;
                    handleSummaryChange(newBullets.join('\n'), false);
                  }
                }}
                useInnerText={true}
                isMeasurement={isMeasurement}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderSkillsSection = () => {
    const categorized = getCategorizedSkills();
    return (
      <div key="skills" data-block-id="skills" className="relative group/sec" style={{ marginBottom: `${sectionSpacing}px` }}>
        {!isMeasurement && handleOpenRegenModal && (
          <div className="absolute right-0 -top-1 opacity-0 group-hover/sec:opacity-100 transition-opacity z-20 no-print flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenRegenModal('skills', sectionTitles.skills, cv.skills)}
              className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-sans font-medium shadow"
            >
              <Sparkles className="w-3 h-3 text-indigo-200" />
              <span>Regen</span>
            </button>
          </div>
        )}

        <h2 className="text-[14pt] font-bold uppercase text-black mb-1.5 tracking-[0.2px] leading-tight">
          {sectionTitles.skills}
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          {categorized.map(([catName, items], cIdx) => (
            <li key={cIdx} className="leading-[1.45] text-[10pt] text-black">
              <span className="font-semibold">{catName}: </span>
              <span>{items.join(' | ')}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderProjectsSection = () => {
    const rawProjects = Array.isArray(cv.projects) ? cv.projects : [];
    const activeProjects = rawProjects.filter((p: any) => selectedProjects.length === 0 || selectedProjects.includes(p.name));
    if (activeProjects.length === 0) return null;

    return (
      <div key="projects" data-block-id="projects" className="relative group/sec" style={{ marginBottom: `${sectionSpacing}px` }}>
        {!isMeasurement && handleOpenRegenModal && (
          <div className="absolute right-0 -top-1 opacity-0 group-hover/sec:opacity-100 transition-opacity z-20 no-print flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenRegenModal('projects', sectionTitles.projects, cv.projects)}
              className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-sans font-medium shadow"
            >
              <Sparkles className="w-3 h-3 text-indigo-200" />
              <span>Regen</span>
            </button>
          </div>
        )}

        <h2 className="text-[14pt] font-bold uppercase text-black mb-1.5 tracking-[0.2px] leading-tight">
          {sectionTitles.projects}
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          {activeProjects.map((proj: any, pIdx: number) => {
            const techs = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '');
            return (
              <li key={pIdx} className="leading-[1.45] text-[10pt] text-black">
                <span className="font-bold">{proj.name}</span>
                {proj.description ? <span> | {proj.description}</span> : ''}
                {techs ? <span className="text-gray-700"> ({techs})</span> : ''}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderWorkSection = () => {
    const experiences = Array.isArray(cv.workExperience) ? cv.workExperience : [];
    if (experiences.length === 0) return null;

    return (
      <div key="work" data-block-id="work" className="relative group/sec" style={{ marginBottom: `${sectionSpacing}px` }}>
        {!isMeasurement && handleOpenRegenModal && (
          <div className="absolute right-0 -top-1 opacity-0 group-hover/sec:opacity-100 transition-opacity z-20 no-print flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenRegenModal('work', sectionTitles.work, cv.workExperience)}
              className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-sans font-medium shadow"
            >
              <Sparkles className="w-3 h-3 text-indigo-200" />
              <span>Regen</span>
            </button>
          </div>
        )}

        <h2 className="text-[14pt] font-bold uppercase text-black mb-1.5 tracking-[0.2px] leading-tight">
          {sectionTitles.work}
        </h2>

        <div className="space-y-3">
          {experiences.map((exp: any, eIdx: number) => {
            const bulletCount = Array.isArray(exp.bullets) ? exp.bullets.length :
              (exp.bullets && typeof exp.bullets === 'object' ? Math.max(
                exp.bullets.star?.length || 0,
                exp.bullets.punchy?.length || 0,
                exp.bullets.standard?.length || 0
              ) : 0);

            const dates = exp.period || (exp.startDate && exp.endDate ? `${exp.startDate} – ${exp.endDate}` : (exp.startDate || ''));

            return (
              <div key={eIdx} className="job-entry">
                <div className="flex justify-between items-baseline text-[11pt] mb-1">
                  <div className="font-bold uppercase text-black">
                    {exp.company} – {exp.role}
                  </div>
                  {dates && (
                    <div className="font-normal uppercase text-black text-[11pt] whitespace-nowrap ml-2">
                      {dates}
                    </div>
                  )}
                </div>

                <ul className="list-disc pl-6 space-y-1">
                  {Array.from({ length: bulletCount }).map((_, bIdx) => {
                    const bText = getActiveBulletText(exp.bullets, bIdx);
                    return (
                      <li key={bIdx} className="leading-[1.45] text-[10pt] text-black relative group/bullet">
                        <EditableText
                          tagName="span"
                          value={bText}
                          onChange={(val) => handleBulletChange && handleBulletChange(eIdx, bIdx, val, true)}
                          onBlur={(e: any) => handleBulletChange && handleBulletChange(eIdx, bIdx, e.target.innerText, false)}
                          useInnerText={true}
                          isMeasurement={isMeasurement}
                        />
                        {!isMeasurement && handleFetchBulletVariations && (
                          <button
                            type="button"
                            onClick={() => handleFetchBulletVariations(eIdx, bIdx, bText)}
                            className="inline-flex ml-1.5 opacity-0 group-hover/bullet:opacity-100 transition-opacity text-indigo-600 hover:text-indigo-800 align-middle no-print"
                            title="AI Polish Bullet Variations"
                          >
                            <Wand2 className="w-3 h-3" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderEducationSection = () => {
    const rawEdu = Array.isArray(cv.education) ? cv.education : (Array.isArray(profile?.education) ? profile.education : []);
    if (rawEdu.length === 0) return null;

    return (
      <div key="education" data-block-id="education" className="relative group/sec" style={{ marginBottom: `${sectionSpacing}px` }}>
        <h2 className="text-[14pt] font-bold uppercase text-black mb-1.5 tracking-[0.2px] leading-tight">
          {sectionTitles.education}
        </h2>
        <div className="space-y-2.5">
          {rawEdu.map((edu: any, edIdx: number) => {
            const dates = edu.period || (edu.startDate && edu.endDate ? `${edu.startDate} – ${edu.endDate}` : (edu.startDate || ''));
            const inst = edu.location ? `${edu.institution} – ${edu.location}` : edu.institution;
            return (
              <div key={edIdx} className="edu-entry">
                <div className="text-[12pt] font-bold uppercase text-black leading-tight">
                  {edu.degree}
                </div>
                <div className="flex justify-between items-baseline text-[12pt] font-normal text-black leading-tight mt-0.5">
                  <span>{inst}</span>
                  {dates && <span className="uppercase whitespace-nowrap ml-2">{dates}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLanguagesSection = () => {
    const rawLangs = Array.isArray(cv.languages) ? cv.languages : (Array.isArray(profile?.languages) ? profile.languages : []);
    if (rawLangs.length === 0) return null;

    const formattedLangs = rawLangs.map((l: any) => `${l.language} – ${l.level || 'Fluent'}`).join(' | ');

    return (
      <div key="languages" data-block-id="languages" className="relative group/sec" style={{ marginBottom: `${sectionSpacing}px` }}>
        <h2 className="text-[14pt] font-bold uppercase text-black mb-1.5 tracking-[0.2px] leading-tight">
          {sectionTitles.languages}
        </h2>
        <ul className="list-disc pl-6">
          <li className="leading-[1.45] text-[10pt] text-black">{formattedLangs}</li>
        </ul>
      </div>
    );
  };

  const renderCustomSection = (cSec: CustomSection) => {
    const items = Array.isArray(cSec.items) ? cSec.items : [];
    return (
      <div key={`custom-${cSec.id}`} data-block-id={`custom-${cSec.id}`} className="relative group/sec" style={{ marginBottom: `${sectionSpacing}px` }}>
        <h2 className="text-[14pt] font-bold uppercase text-black mb-1.5 tracking-[0.2px] leading-tight">
          {cSec.title}
        </h2>
        <ul className="list-disc pl-6 space-y-1">
          {items.map((item, iIdx) => (
            <li key={iIdx} className="leading-[1.45] text-[10pt] text-black">
              {item.title ? <span className="font-semibold">{item.title}: </span> : null}
              <span>{item.description || item.subtitle}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Section Dispatcher Map
  const sectionRenderMap: Record<string, () => React.ReactNode> = {
    summary: renderSummarySection,
    skills: renderSkillsSection,
    projects: renderProjectsSection,
    work: renderWorkSection,
    education: renderEducationSection,
    languages: renderLanguagesSection
  };

  return (
    <div
      className="bullet-matrix-cv-container text-black bg-white font-sans text-left select-text"
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: `${fontSize}px`,
        lineHeight: 1.45
      }}
    >
      {/* Header Block */}
      <div className="relative min-h-[78px] mb-1.5">
        {/* Right-aligned contacts */}
        <div className="text-right text-[9.5pt] leading-[1.5] text-black">
          {personal.phone && (
            <div><strong>Mobile:</strong> {personal.phone}</div>
          )}
          {personal.email && (
            <div>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${personal.email}`} className="text-[#0066cc] underline hover:text-[#004499]">
                {personal.email}
              </a>
            </div>
          )}
          {personal.address && (
            <div><strong>Address:</strong> {personal.address}</div>
          )}
          {personal.linkedin && (
            <div>
              <strong>LinkedIn:</strong>{' '}
              <a
                href={personal.linkedin.startsWith('http') ? personal.linkedin : `https://${personal.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#0066cc] underline hover:text-[#004499]"
              >
                {personal.linkedin}
              </a>
            </div>
          )}
          {personal.github && (
            <div>
              <strong>GitHub:</strong>{' '}
              <a
                href={personal.github.startsWith('http') ? personal.github : `https://${personal.github}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#0066cc] underline hover:text-[#004499]"
              >
                {personal.github}
              </a>
            </div>
          )}
          {personal.website && (
            <div>
              <strong>Website:</strong>{' '}
              <a
                href={personal.website.startsWith('http') ? personal.website : `https://${personal.website}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#0066cc] underline hover:text-[#004499]"
              >
                {personal.website}
              </a>
            </div>
          )}
        </div>

        {/* Bottom-left Candidate Name */}
        <div className="absolute bottom-0 left-0">
          <EditableText
            tagName="h1"
            value={personal.fullName}
            onChange={(val) => handleCvDetailsChange && handleCvDetailsChange('fullName', val, true)}
            onBlur={(e: any) => handleCvDetailsChange && handleCvDetailsChange('fullName', e.target.innerText, false)}
            useInnerText={true}
            isMeasurement={isMeasurement}
            className="text-[14pt] font-bold uppercase tracking-[0.3px] text-black leading-tight"
          />
        </div>
      </div>

      {/* Solid Black Header Divider */}
      <div className="w-full h-[2px] bg-black mt-1.5 mb-3.5" />

      {/* Ordered Sections */}
      {sectionOrder.map((secKey) => {
        if (hiddenSections.includes(secKey)) return null;

        if (sectionRenderMap[secKey]) {
          return sectionRenderMap[secKey]();
        }

        if (secKey.startsWith('custom-')) {
          const customId = secKey.replace('custom-', '');
          const cSec = customSections.find(c => c.id === customId || `custom-${c.id}` === secKey);
          if (cSec) return renderCustomSection(cSec);
        }

        return null;
      })}

      {/* Optional Signature */}
      {showSignatureSection && !hiddenSections.includes('signature') && (
        <div className="mt-6 pt-4 text-left">
          <div className="text-[11pt] text-black">
            {signingLocation}, {new Date().toLocaleDateString(cvLanguage === 'DE' ? 'de-DE' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div className="font-bold text-[12pt] text-black mt-3">
            {personal.fullName}
          </div>
        </div>
      )}
    </div>
  );
}
