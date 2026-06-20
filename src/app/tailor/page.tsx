'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles, FileText, Download, Briefcase, Award, CheckCircle2, AlertTriangle, Languages, Save, Check,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Palette, Highlighter, RotateCcw, Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkExperience {
  company: string;
  role: string;
  location: string;
  period: string;
  bullets: string[] | {
    star: string[];
    punchy: string[];
    standard: string[];
  };
}

interface Education {
  institution: string;
  degree: string;
  location: string;
  period: string;
}

interface Language {
  language: string;
  level: string;
}

interface TailoredSkill {
  name: string;
  level: string;
}

interface TailoredCv {
  personalDetails: {
    fullName: string;
    email: string;
    phone: string;
    website?: string;
    linkedin?: string;
    github?: string;
    address?: string;
    dateOfBirth?: string;
    birthplace?: string;
    nationality?: string;
    photo?: string;
    signature?: string;
    occupation?: string;
  };
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: TailoredSkill[];
  languages: Language[];
  signingLine?: string;
}

interface TailoredCoverLetter {
  senderAddress: string;
  recipientAddress: string;
  dateLine: string;
  subjectLine: string;
  salutation: string;
  paragraphs: string[] | {
    short: string[];
    detailed: string[];
  };
  closing: string;
  signatureName: string;
}

interface TailorResponse {
  matchScore: number;
  gapAnalysis: {
    missingSkills: string[];
    matchingKeywords: string[];
    recommendations: string;
  };
  tailoredCv: TailoredCv;
  tailoredCoverLetter: TailoredCoverLetter;
}

const getActiveBulletStyleKey = (style: string): 'star' | 'punchy' | 'standard' => {
  if (style === 'Short & Punchy achievements') return 'punchy';
  if (style === 'Standard responsibilities') return 'standard';
  return 'star';
};

const getRenderedBullets = (exp: any, bulletStyle: string, lengthTarget: string, isMostRecent: boolean = false) => {
  if (!exp || !exp.bullets) return [];
  let bulletsArray: string[] = [];
  if (Array.isArray(exp.bullets)) {
    bulletsArray = exp.bullets;
  } else {
    const key = getActiveBulletStyleKey(bulletStyle);
    bulletsArray = exp.bullets[key] || exp.bullets.star || exp.bullets.standard || exp.bullets.punchy || [];
  }

  if (lengthTarget === 'Strict 1-Page (concise)') {
    return bulletsArray.slice(0, isMostRecent ? 2 : 1);
  }
  return bulletsArray;
};

const getRenderedParagraphs = (cl: any, clLength: string) => {
  if (!cl || !cl.paragraphs) return [];
  if (Array.isArray(cl.paragraphs)) {
    return cl.paragraphs;
  }
  const key = clLength.includes('Short') ? 'short' : 'detailed';
  return cl.paragraphs[key] || cl.paragraphs.short || cl.paragraphs.detailed || [];
};

const getGroupedSkills = (skills: any[]) => {
  const groups: Record<string, string[]> = {
    'Expert': [],
    'Advanced': [],
    'Intermediate': [],
    'Beginner': []
  };

  if (!Array.isArray(skills)) return groups;

  skills.forEach(s => {
    let name = '';
    let level = 'Intermediate';
    if (typeof s === 'string') {
      name = s;
    } else if (s && typeof s === 'object') {
      name = s.name || '';
      level = s.level || 'Intermediate';
    }

    if (name) {
      if (groups[level]) {
        groups[level].push(name);
      } else {
        groups['Intermediate'].push(name);
      }
    }
  });

  return groups;
};

const renderRecommendation = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  let currentSection: 'positives' | 'negatives' | 'advice' | 'general' = 'general';

  return (
    <div className="space-y-3 font-sans text-xs">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Match headers
        if (trimmed.startsWith('###') || trimmed.startsWith('##') || trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          if (headerText.toLowerCase().includes('positive')) {
            currentSection = 'positives';
            return (
              <h5 key={idx} className="font-bold text-emerald-400 mt-4 flex items-center gap-1.5 border-b border-emerald-500/10 pb-1.5 uppercase tracking-wider text-[10px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {headerText}
              </h5>
            );
          } else if (headerText.toLowerCase().includes('negative') || headerText.toLowerCase().includes('gap')) {
            currentSection = 'negatives';
            return (
              <h5 key={idx} className="font-bold text-rose-400 mt-4 flex items-center gap-1.5 border-b border-rose-500/10 pb-1.5 uppercase tracking-wider text-[10px]">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {headerText}
              </h5>
            );
          } else {
            currentSection = 'advice';
            return (
              <h5 key={idx} className="font-bold text-indigo-400 mt-4 flex items-center gap-1.5 border-b border-indigo-500/10 pb-1.5 uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                {headerText}
              </h5>
            );
          }
        }

        // Match bullet points
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          const bulletText = trimmed.substring(1).trim();
          let bulletColorClass = 'text-zinc-300';
          let bulletIcon = <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-1.5 shrink-0" />;

          if (currentSection === 'positives') {
            bulletColorClass = 'text-emerald-300/95';
            bulletIcon = <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />;
          } else if (currentSection === 'negatives') {
            bulletColorClass = 'text-rose-300/95';
            bulletIcon = <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />;
          } else if (currentSection === 'advice') {
            bulletColorClass = 'text-indigo-300/95';
            bulletIcon = <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />;
          }

          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5">
              {bulletIcon}
              <span className={`${bulletColorClass} leading-relaxed`}>{bulletText}</span>
            </div>
          );
        }

        // Regular paragraph text
        return (
          <p key={idx} className="text-zinc-300 leading-relaxed pl-0.5">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
};

const getTemplateStyles = (template: 'CLASSIC_CORPORATE' | 'MODERN_MINIMALIST' | 'TECH_CREATIVE') => {
  switch (template) {
    case 'MODERN_MINIMALIST':
      return {
        fontFamily: 'Outfit, Inter, sans-serif',
        padding: '24mm',
        headerBorderBottom: '1px solid #e4e4e7',
        headingTextTransform: 'lowercase' as const,
        headingLetterSpacing: '0.025em',
        sectionSpacing: '28px',
        accentColor: '#18181b',
        titleFont: 'Outfit, Inter, sans-serif',
        titleColor: '#09090b',
        textColor: '#27272a',
        borderColor: '#e4e4e7'
      };
    case 'TECH_CREATIVE':
      return {
        fontFamily: 'Inter, monospace, sans-serif',
        padding: '18mm',
        headerBorderBottom: '3px solid #6366f1',
        headingTextTransform: 'uppercase' as const,
        headingLetterSpacing: '0.05em',
        sectionSpacing: '24px',
        accentColor: '#6366f1',
        titleFont: 'Outfit, monospace',
        titleColor: '#312e81',
        textColor: '#1f2937',
        borderColor: '#818cf8'
      };
    case 'CLASSIC_CORPORATE':
    default:
      return {
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        padding: '20mm',
        headerBorderBottom: '2px solid #27272a',
        headingTextTransform: 'uppercase' as const,
        headingLetterSpacing: '0.05em',
        sectionSpacing: '24px',
        accentColor: '#18181b',
        titleFont: 'Georgia, serif',
        titleColor: '#18181b',
        textColor: '#27272a',
        borderColor: '#d4d4d8'
      };
  }
};

export default function TailorWorkspace() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Form states
  const [jobDescription, setJobDescription] = useState('');
  const [cvLanguage, setCvLanguage] = useState<'EN' | 'DE'>('EN');
  const [clLanguage, setClLanguage] = useState<'EN' | 'DE'>('EN');
  const [companyName, setCompanyName] = useState('');
  const [roleName, setRoleName] = useState('');
  const [salaryExpectation, setSalaryExpectation] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [signingLocation, setSigningLocation] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Intake Method States
  const [intakeMethod, setIntakeMethod] = useState<'text' | 'url' | 'pdf'>('text');
  const [jobUrl, setJobUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeWarning, setScrapeWarning] = useState<string | null>(null);

  // Strategy & Style States
  const [matchStrategy, setMatchStrategy] = useState<'TACTICAL_PIVOT' | 'AGGRESIVE_BRIDGING'>('TACTICAL_PIVOT');
  const [styleTemplate, setStyleTemplate] = useState<'CLASSIC_CORPORATE' | 'MODERN_MINIMALIST' | 'TECH_CREATIVE'>('CLASSIC_CORPORATE');
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [isAtsMode, setIsAtsMode] = useState(false);

  // Mobile responsive layout states
  const [activeMobileTab, setActiveMobileTab] = useState<'edit' | 'preview'>('edit');
  const [previewWidth, setPreviewWidth] = useState(794);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Prompt Customization States
  const [tone, setTone] = useState<string>('Bold & Action-oriented');
  const [lengthTarget, setLengthTarget] = useState<string>('Strict 1-Page (concise)');
  const [bulletStyle, setBulletStyle] = useState<string>('STAR Method');
  const [clLength, setClLength] = useState<string>('Short & Punchy (under 300 words)');
  const [skillsFocus, setSkillsFocus] = useState<string>('Tech-Heavy Focus');

  // Visual Customization States
  const [sectionSpacing, setSectionSpacing] = useState(24); // px
  const [pagePaddingTop, setPagePaddingTop] = useState(28); // mm
  const [pagePaddingBottom, setPagePaddingBottom] = useState(20); // mm
  const [pagePaddingSide, setPagePaddingSide] = useState(24); // mm
  const [fontSize, setFontSize] = useState(11.5); // px
  const [bulletSpacing, setBulletSpacing] = useState(4); // px
  const [signatureSpacing, setSignatureSpacing] = useState(40); // px
  const [photoHeight, setPhotoHeight] = useState(105); // px
  const [headerSpacing, setHeaderSpacing] = useState(12); // px

  const applyPreset = (preset: 'default' | 'compact' | 'tight') => {
    if (preset === 'default') {
      setSectionSpacing(24);
      setPagePaddingTop(28);
      setPagePaddingBottom(20);
      setPagePaddingSide(24);
      setFontSize(11.5);
      setBulletSpacing(4);
      setSignatureSpacing(40);
      setPhotoHeight(105);
      setHeaderSpacing(12);
    } else if (preset === 'compact') {
      setSectionSpacing(12);
      setPagePaddingTop(20);
      setPagePaddingBottom(15);
      setPagePaddingSide(20);
      setFontSize(10.8);
      setBulletSpacing(2.5);
      setSignatureSpacing(20);
      setPhotoHeight(95);
      setHeaderSpacing(8);
    } else if (preset === 'tight') {
      setSectionSpacing(7);
      setPagePaddingTop(15);
      setPagePaddingBottom(12);
      setPagePaddingSide(15);
      setFontSize(10.2);
      setBulletSpacing(1);
      setSignatureSpacing(8);
      setPhotoHeight(88);
      setHeaderSpacing(4);
    }
  };

  useEffect(() => {
    if (lengthTarget.includes('1-Page')) {
      applyPreset('tight');
    } else {
      applyPreset('default');
    }
  }, [lengthTarget]);

  // App state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorResponse | null>(null);
  const [previewTab, setPreviewTab] = useState<'cv' | 'coverLetter'>('cv');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [numPages, setNumPages] = useState(1);
  const [pages, setPages] = useState<string[][]>([]);

  const getOrderedBlocks = () => {
    if (!result) return [];
    const orderedBlocks: string[] = [];
    if (result.tailoredCv.personalDetails) {
      orderedBlocks.push('personal-header');
      orderedBlocks.push('contact-grid');
    }
    if (result.tailoredCv.summary) {
      orderedBlocks.push('summary');
    }
    if (result.tailoredCv.workExperience && result.tailoredCv.workExperience.length > 0) {
      orderedBlocks.push('work-history-header');
      result.tailoredCv.workExperience.forEach((_, idx) => {
        orderedBlocks.push(`work-exp-${idx}`);
      });
    }
    if (result.tailoredCv.education && result.tailoredCv.education.length > 0) {
      orderedBlocks.push('education-header');
      result.tailoredCv.education.forEach((_, idx) => {
        orderedBlocks.push(`edu-${idx}`);
      });
    }
    if (result.tailoredCv.skills && result.tailoredCv.skills.length > 0) {
      orderedBlocks.push('skills');
    }
    if (result.tailoredCv.languages && result.tailoredCv.languages.length > 0) {
      orderedBlocks.push('languages');
    }
    orderedBlocks.push('signature');
    return orderedBlocks;
  };

  const renderBlock = (blockId: string, isMeasurement: boolean) => {
    if (!result) return null;
    
    if (blockId === 'personal-header') {
      if (isAtsMode) {
        return (
          <div key={blockId} data-block-id={blockId} className="flex flex-col items-start w-full animate-none" style={{ marginBottom: `${bulletSpacing}px` }}>
            <h1
              contentEditable={!isMeasurement}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleCvDetailsChange('fullName', e.target.innerText)}
              className="text-[24px] font-bold text-gray-800 leading-tight text-left focus:outline-none"
            >
              {result.tailoredCv.personalDetails.fullName}
            </h1>
            <p
              contentEditable={!isMeasurement}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleCvDetailsChange('occupation', e.target.innerText)}
              className="text-[#2980B9] text-[13px] font-medium mt-0.5 text-left font-sans cursor-pointer focus:outline-none"
            >
              {result.tailoredCv.personalDetails.occupation || roleName || 'Professional'}
            </p>
          </div>
        );
      }

      return (
        <div key={blockId} data-block-id={blockId} className="flex justify-between items-start w-full" style={{ marginBottom: `${bulletSpacing}px` }}>
          <div>
            <h1
              contentEditable={!isMeasurement}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleCvDetailsChange('fullName', e.target.innerText)}
              className="text-[24px] font-bold text-gray-800 leading-tight text-left focus:outline-none"
            >
              {result.tailoredCv.personalDetails.fullName}
            </h1>
            <p
              contentEditable={!isMeasurement}
              suppressContentEditableWarning={true}
              onBlur={(e) => handleCvDetailsChange('occupation', e.target.innerText)}
              className="text-[#2980B9] text-[13px] font-medium mt-0.5 text-left font-sans cursor-pointer focus:outline-none"
            >
              {result.tailoredCv.personalDetails.occupation || roleName || 'Professional'}
            </p>
          </div>

          <div
            className="bg-gray-200 rounded-sm overflow-hidden flex-shrink-0 border border-gray-300 flex items-center justify-center relative font-sans"
            style={{
              width: `${photoHeight * 0.81}px`,
              height: `${photoHeight}px`
            }}
          >
            {result.tailoredCv.personalDetails.photo ? (
              <img
                src={result.tailoredCv.personalDetails.photo}
                alt="Profile Photo"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </div>
        </div>
      );
    }
    
    if (blockId === 'contact-grid') {
      return (
        <div
          key={blockId}
          data-block-id={blockId}
          className={`${isAtsMode ? 'flex flex-col gap-y-1 border-b border-[#CBD5E1] pb-2' : 'grid grid-cols-2 gap-x-8'} text-gray-700 text-left w-full`}
          style={{
            marginTop: `${headerSpacing}px`,
            rowGap: `${bulletSpacing * 0.5}px`,
            fontSize: `${fontSize - 0.5}px`,
            marginBottom: `${sectionSpacing * 0.5}px`
          }}
        >
          <p>
            <span className="font-semibold font-sans">Address:</span>{' '}
            <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('address', e.target.innerText)} className="focus:outline-none">
              {result.tailoredCv.personalDetails.address}
            </span>
          </p>
          <p>
            <span className="font-semibold font-sans">Phone:</span>{' '}
            <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('phone', e.target.innerText)} className="focus:outline-none">
              {result.tailoredCv.personalDetails.phone}
            </span>
          </p>
          <p>
            <span className="font-semibold font-sans">Email:</span>{' '}
            <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('email', e.target.innerText)} className="focus:outline-none">
              {result.tailoredCv.personalDetails.email}
            </span>
          </p>

          {cvLanguage === 'DE' ? (
            <>
              {result.tailoredCv.personalDetails.dateOfBirth && (
                <p>
                  <span className="font-semibold font-sans">Geburtsdatum:</span>{' '}
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('dateOfBirth', e.target.innerText)} className="focus:outline-none">
                    {result.tailoredCv.personalDetails.dateOfBirth}
                  </span>
                </p>
              )}
              {result.tailoredCv.personalDetails.birthplace && (
                <p>
                  <span className="font-semibold font-sans">Geburtsort:</span>{' '}
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('birthplace', e.target.innerText)} className="focus:outline-none">
                    {result.tailoredCv.personalDetails.birthplace}
                  </span>
                </p>
              )}
              {result.tailoredCv.personalDetails.nationality && (
                <p>
                  <span className="font-semibold font-sans">Staatsangehörigkeit:</span>{' '}
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('nationality', e.target.innerText)} className="focus:outline-none">
                    {result.tailoredCv.personalDetails.nationality}
                  </span>
                </p>
              )}
            </>
          ) : (
            <>
              {result.tailoredCv.personalDetails.dateOfBirth && (
                <p>
                  <span className="font-semibold font-sans">Date of birth:</span>{' '}
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('dateOfBirth', e.target.innerText)} className="focus:outline-none">
                    {result.tailoredCv.personalDetails.dateOfBirth}
                  </span>
                </p>
              )}
              {result.tailoredCv.personalDetails.nationality && (
                <p>
                  <span className="font-semibold font-sans">Nationality:</span>{' '}
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('nationality', e.target.innerText)} className="focus:outline-none">
                    {result.tailoredCv.personalDetails.nationality}
                  </span>
                </p>
              )}
            </>
          )}

          {result.tailoredCv.personalDetails.linkedin && (
            <p>
              <span className="font-semibold font-sans">LinkedIn:</span>{' '}
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('linkedin', e.target.innerText)} className="focus:outline-none">
                {result.tailoredCv.personalDetails.linkedin}
              </span>
            </p>
          )}
          {result.tailoredCv.personalDetails.website && (
            <p>
              <span className="font-semibold font-sans">Website:</span>{' '}
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('website', e.target.innerText)} className="focus:outline-none">
                {result.tailoredCv.personalDetails.website}
              </span>
            </p>
          )}
          {result.tailoredCv.personalDetails.github && (
            <p>
              <span className="font-semibold font-sans">Github:</span>{' '}
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleCvDetailsChange('github', e.target.innerText)} className="focus:outline-none">
                {result.tailoredCv.personalDetails.github}
              </span>
            </p>
          )}
        </div>
      );
    }

    if (blockId === 'summary') {
      return (
        <div key={blockId} data-block-id={blockId} className="w-full text-left">
          {(() => {
            const title = cvLanguage === 'DE' ? 'Berufliches Profil' : 'Professional Profile';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <div
                className="text-left animate-none"
                style={{
                  marginTop: `${sectionSpacing * 0.4}px`,
                  marginBottom: `${sectionSpacing * 0.3}px`
                }}
              >
                <h2 className="text-[15px] font-bold tracking-[0.22em] uppercase">
                  <span className="text-gray-800">{first}</span>
                  {rest && <span className="text-[#2980B9]">&nbsp;{rest}</span>}
                </h2>
                <div className="border-b border-[#CBD5E1] mt-1" />
              </div>
            );
          })()}
          <p
            contentEditable={!isMeasurement}
            suppressContentEditableWarning={true}
            onBlur={(e) => handleCvSummaryChange(e.target.innerHTML)}
            className="text-gray-700 text-left font-sans focus:outline-none"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.55
            }}
            dangerouslySetInnerHTML={{ __html: result.tailoredCv.summary }}
          />
        </div>
      );
    }

    if (blockId === 'work-history-header') {
      return (
        <div
          key={blockId}
          data-block-id={blockId}
          className="text-left w-full"
          style={{
            marginTop: `${sectionSpacing * 0.4}px`,
            marginBottom: `${sectionSpacing * 0.2}px`
          }}
        >
          {(() => {
            const title = cvLanguage === 'DE' ? 'Berufserfahrung' : 'Work History';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <>
                <h2 className="text-[15px] font-bold tracking-[0.22em] uppercase">
                  <span className="text-gray-800">{first}</span>
                  {rest && <span className="text-[#2980B9]">&nbsp;{rest}</span>}
                </h2>
                <div className="border-b border-[#CBD5E1] mt-1" />
              </>
            );
          })()}
        </div>
      );
    }

    if (blockId.startsWith('work-exp-')) {
      const idx = parseInt(blockId.substring(9));
      const exp = result.tailoredCv.workExperience[idx];
      if (!exp) return null;
      if (isAtsMode) {
        return (
          <div
            key={blockId}
            data-block-id={blockId}
            className="w-full text-left font-sans flex flex-col"
            style={{ marginBottom: `${bulletSpacing * 1.5}px` }}
          >
            <p
              className="font-bold text-gray-500"
              style={{ fontSize: `${fontSize - 0.5}px`, marginBottom: '2px' }}
            >
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'period', e.target.innerText)} className="focus:outline-none font-semibold">
                {exp.period}
              </span>
            </p>
            <p
              className="font-semibold text-[#2980B9]"
              style={{ fontSize: `${fontSize + 0.5}px` }}
            >
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'role', e.target.innerText)} className="focus:outline-none">
                {exp.role}
              </span>
            </p>
            <p
              className="text-gray-600 font-medium"
              style={{ fontSize: `${fontSize - 0.5}px` }}
            >
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'company', e.target.innerText)} className="focus:outline-none font-semibold">
                {exp.company}
              </span>
              {exp.location && (
                <>
                  {' – '}
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'location', e.target.innerText)} className="focus:outline-none">
                    {exp.location}
                  </span>
                </>
              )}
            </p>
            <ul
              className="list-none pl-0 animate-none"
              style={{ marginTop: `${bulletSpacing * 0.35}px` }}
            >
              {getRenderedBullets(exp, bulletStyle, lengthTarget, idx === 0).map((b: string, bIdx: number) => (
                <li
                  key={bIdx}
                  className="group flex items-start gap-1.5 text-gray-700 leading-[1.55] relative animate-none"
                  style={{
                    fontSize: `${fontSize}px`,
                    marginTop: `${bulletSpacing}px`
                  }}
                >
                  <span className="text-gray-500 leading-none mt-[2px] select-none">•</span>
                  <span
                    contentEditable={!isMeasurement}
                    suppressContentEditableWarning
                    onBlur={(e) => handleWorkExperienceBulletChange(idx, bIdx, e.target.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: b }}
                    className="focus:outline-none flex-1"
                  />
                  {!isMeasurement && (
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkExperienceBullet(idx, bIdx)}
                      className="no-print opacity-0 group-hover:opacity-100 ml-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 select-none border border-rose-200 font-sans"
                      title="Delete bullet point"
                      style={{
                        fontSize: '10px',
                        lineHeight: '1',
                      }}
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      }

      return (
        <div key={blockId} data-block-id={blockId} className="w-full text-left font-sans" style={{ marginBottom: `${bulletSpacing}px` }}>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td
                  className="align-top pr-6 text-gray-500 whitespace-nowrap w-[28%]"
                  style={{
                    paddingTop: `${bulletSpacing * 0.25}px`,
                    paddingBottom: `${bulletSpacing * 0.25}px`,
                    fontSize: `${fontSize - 0.5}px`
                  }}
                >
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'period', e.target.innerText)} className="focus:outline-none">
                    {exp.period}
                  </span>
                </td>
                <td
                  className="align-top text-gray-700 leading-[1.55]"
                  style={{
                    paddingTop: `${bulletSpacing * 0.25}px`,
                    paddingBottom: `${bulletSpacing * 0.25}px`
                  }}
                >
                  <p
                    className="font-semibold text-[#2980B9]"
                    style={{ fontSize: `${fontSize + 0.5}px` }}
                  >
                    <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'role', e.target.innerText)} className="focus:outline-none">
                      {exp.role}
                    </span>
                  </p>
                  <p
                    className="text-gray-600"
                    style={{ fontSize: `${fontSize - 0.5}px` }}
                  >
                    <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'company', e.target.innerText)} className="focus:outline-none">
                      {exp.company}
                    </span>
                  </p>
                  {exp.location && (
                    <p
                      className="text-gray-500"
                      style={{ fontSize: `${fontSize - 0.5}px` }}
                    >
                      <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleWorkExperienceChange(idx, 'location', e.target.innerText)} className="focus:outline-none">
                        {exp.location}
                      </span>
                    </p>
                  )}
                  <ul
                    className="list-none pl-0 animate-none"
                    style={{ marginTop: `${bulletSpacing * 0.35}px` }}
                  >
                    {getRenderedBullets(exp, bulletStyle, lengthTarget, idx === 0).map((b: string, bIdx: number) => (
                      <li
                        key={bIdx}
                        className="group flex items-start gap-1.5 text-gray-700 leading-[1.55] relative animate-none"
                        style={{
                          fontSize: `${fontSize}px`,
                          marginTop: `${bulletSpacing}px`
                        }}
                      >
                        <span className="text-gray-500 leading-none mt-[2px] select-none">•</span>
                        <span
                          contentEditable={!isMeasurement}
                          suppressContentEditableWarning
                          onBlur={(e) => handleWorkExperienceBulletChange(idx, bIdx, e.target.innerHTML)}
                          dangerouslySetInnerHTML={{ __html: b }}
                          className="focus:outline-none flex-1"
                        />
                        {!isMeasurement && (
                          <button
                            type="button"
                            onClick={() => handleDeleteWorkExperienceBullet(idx, bIdx)}
                            className="no-print opacity-0 group-hover:opacity-100 ml-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 shrink-0 select-none border border-rose-200 font-sans"
                            title="Delete bullet point"
                            style={{
                              fontSize: '10px',
                              lineHeight: '1',
                            }}
                          >
                            ×
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (blockId === 'education-header') {
      return (
        <div
          key={blockId}
          data-block-id={blockId}
          className="text-left w-full"
          style={{
            marginTop: `${sectionSpacing * 0.4}px`,
            marginBottom: `${sectionSpacing * 0.2}px`
          }}
        >
          {(() => {
            const title = cvLanguage === 'DE' ? 'Ausbildung' : 'Education';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <>
                <h2 className="text-[15px] font-bold tracking-[0.22em] uppercase">
                  <span className="text-gray-800">{first}</span>
                  {rest && <span className="text-[#2980B9]">&nbsp;{rest}</span>}
                </h2>
                <div className="border-b border-[#CBD5E1] mt-1" />
              </>
            );
          })()}
        </div>
      );
    }

    if (blockId.startsWith('edu-')) {
      const idx = parseInt(blockId.substring(4));
      const edu = result.tailoredCv.education[idx];
      if (!edu) return null;
      if (isAtsMode) {
        return (
          <div
            key={blockId}
            data-block-id={blockId}
            className="w-full text-left font-sans flex flex-col"
            style={{ marginBottom: `${bulletSpacing * 1.5}px` }}
          >
            <p
              className="font-bold text-gray-500"
              style={{ fontSize: `${fontSize - 0.5}px`, marginBottom: '2px' }}
            >
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'period', e.target.innerText)} className="focus:outline-none font-semibold">
                {edu.period}
              </span>
            </p>
            <p
              className="font-semibold text-[#2980B9]"
              style={{ fontSize: `${fontSize + 0.5}px` }}
            >
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'degree', e.target.innerText)} className="focus:outline-none font-semibold">
                {edu.degree}
              </span>
            </p>
            <p
              className="text-gray-600 font-medium"
              style={{ fontSize: `${fontSize - 0.5}px` }}
            >
              <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'institution', e.target.innerText)} className="focus:outline-none font-semibold">
                {edu.institution}
              </span>
              {edu.location && (
                <>
                  {' – '}
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'location', e.target.innerText)} className="focus:outline-none">
                    {edu.location}
                  </span>
                </>
              )}
            </p>
          </div>
        );
      }

      return (
        <div key={blockId} data-block-id={blockId} className="w-full text-left font-sans" style={{ marginBottom: `${bulletSpacing}px` }}>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td
                  className="align-top pr-6 text-gray-500 whitespace-nowrap w-[28%]"
                  style={{
                    paddingTop: `${bulletSpacing * 0.25}px`,
                    paddingBottom: `${bulletSpacing * 0.25}px`,
                    fontSize: `${fontSize - 0.5}px`
                  }}
                >
                  <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'period', e.target.innerText)} className="focus:outline-none">
                    {edu.period}
                  </span>
                </td>
                <td
                  className="align-top text-gray-700 leading-[1.55]"
                  style={{
                    paddingTop: `${bulletSpacing * 0.25}px`,
                    paddingBottom: `${bulletSpacing * 0.25}px`
                  }}
                >
                  <p
                    className="font-semibold text-[#2980B9]"
                    style={{ fontSize: `${fontSize + 0.5}px` }}
                  >
                    <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'degree', e.target.innerText)} className="focus:outline-none">
                      {edu.degree}
                    </span>
                  </p>
                  <p
                    className="text-gray-600"
                    style={{ fontSize: `${fontSize - 0.5}px` }}
                  >
                    <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'institution', e.target.innerText)} className="focus:outline-none">
                      {edu.institution}
                    </span>
                  </p>
                  {edu.location && (
                    <p
                      className="text-gray-500"
                      style={{ fontSize: `${fontSize - 0.5}px` }}
                    >
                      <span contentEditable={!isMeasurement} suppressContentEditableWarning onBlur={(e) => handleEducationChange(idx, 'location', e.target.innerText)} className="focus:outline-none">
                        {edu.location}
                      </span>
                    </p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (blockId === 'skills') {
      return (
        <div key={blockId} data-block-id={blockId} className="w-full text-left font-sans">
          {(() => {
            const title = cvLanguage === 'DE' ? 'Fähigkeiten' : 'Additional Skills';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <div
                className="text-left"
                style={{
                  marginTop: `${sectionSpacing * 0.4}px`,
                  marginBottom: `${sectionSpacing * 0.3}px`
                }}
              >
                <h2 className="text-[15px] font-bold tracking-[0.22em] uppercase">
                  <span className="text-gray-800">{first}</span>
                  {rest && <span className="text-[#2980B9]">&nbsp;{rest}</span>}
                </h2>
                <div className="border-b border-[#CBD5E1] mt-1" />
              </div>
            );
          })()}
          <div style={{ marginTop: `${bulletSpacing * 0.5}px` }}>
            <ul className="list-none pl-0">
              {Object.entries(getGroupedSkills(result.tailoredCv.skills)).map(([level, names], gIdx) => {
                if (names.length === 0) return null;

                let levelLabel = 'Intermediate';
                if (level === 'Expert') levelLabel = 'Expert Knowledge';
                else if (level === 'Advanced') levelLabel = 'Advanced Knowledge';
                else if (level === 'Intermediate') levelLabel = 'Intermediate';
                else if (level === 'Beginner') levelLabel = 'Basic';

                return (
                  <li
                    key={gIdx}
                    className="flex items-start gap-1.5 text-gray-700 leading-[1.55]"
                    style={{
                      fontSize: `${fontSize}px`,
                      marginTop: `${bulletSpacing}px`
                    }}
                  >
                    <span className="text-gray-500 leading-none mt-[2px] shrink-0">•</span>
                    <span>
                      <span className="font-semibold text-gray-800">{levelLabel}:</span>{' '}
                      <span className="text-gray-700">{names.join(', ')}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      );
    }

    if (blockId === 'languages') {
      return (
        <div
          key={blockId}
          data-block-id={blockId}
          className="text-left w-full font-sans"
          style={{ marginTop: `${sectionSpacing * 0.5}px` }}
        >
          <p
            className="font-semibold text-gray-800 mb-1"
            style={{
              fontSize: `${fontSize + 0.5}px`,
              marginTop: `${bulletSpacing * 0.75}px`
            }}
          >
            {cvLanguage === 'DE' ? 'Sprachen' : 'Languages'}
          </p>
          <ul className="list-none pl-0">
            <li
              className="flex items-start gap-1.5 text-gray-700 leading-[1.55]"
              style={{
                fontSize: `${fontSize}px`,
                marginTop: `${bulletSpacing}px`
              }}
            >
              <span className="text-gray-500 leading-none mt-[2px] shrink-0 font-sans">•</span>
              <span>
                {result.tailoredCv.languages.map((l: any, i: number) => (
                  <span key={i}>
                    <span className="font-semibold text-gray-800">{l.language}</span> ({l.level})
                    {i < result.tailoredCv.languages.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>
      );
    }

    if (blockId === 'signature') {
      return (
        <div
          key={blockId}
          data-block-id={blockId}
          className="text-gray-600 text-left w-full font-sans animate-none"
          style={{
            marginTop: `${signatureSpacing}px`
          }}
        >
          <div className="mb-2 h-[32px] flex items-end">
            {result.tailoredCv.personalDetails.signature ? (
              <img
                src={result.tailoredCv.personalDetails.signature}
                alt="Signature"
                className="max-h-full max-w-[120px] object-contain"
              />
            ) : (
              <svg
                width="80"
                height="32"
                viewBox="0 0 80 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-800"
              >
                <path
                  d="M 8 20 C 8 8, 16 6, 20 18 C 24 10, 28 8, 30 18 C 32 18, 34 22, 36 20 C 38 18, 42 16, 46 22 C 48 24, 50 16, 52 18 C 54 20, 56 22, 58 20 C 60 18, 62 20, 66 22 C 68 24, 70 20, 74 18"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <p
            contentEditable={!isMeasurement}
            suppressContentEditableWarning
            onBlur={(e) => handleSigningLineChange(e.target.innerText)}
            className="text-[11px] text-gray-600 focus:outline-none"
          >
            {result.tailoredCv.signingLine || `${signingLocation || 'München'}, ${new Date().toLocaleDateString(cvLanguage === 'DE' ? 'de-DE' : 'en-US')}`}
          </p>
          <p
            className="mt-1.5 italic text-gray-700"
            style={{ fontSize: `${fontSize + 0.5}px` }}
          >
            {result.tailoredCv.personalDetails.fullName}
          </p>
        </div>
      );
    }

    return null;
  };



  // Refs for PDF download
  const cvPreviewRef = useRef<HTMLDivElement>(null);
  const clPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProfile();

    // Check for appId query parameter in raw location string
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const appId = urlParams.get('appId');
      if (appId) {
        setEditingAppId(appId);
        fetchApplicationForEditing(appId);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (previewContainerRef.current) {
        setPreviewWidth(previewContainerRef.current.offsetWidth);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    const timer1 = setTimeout(handleResize, 100);
    const timer2 = setTimeout(handleResize, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [activeMobileTab, result, previewTab]);

  useEffect(() => {
    if (!result) return;

    if (previewTab === 'coverLetter') {
      const element = clPreviewRef.current;
      if (!element) return;

      const measureCl = () => {
        const height = element.scrollHeight;
        const printableHeight = 910.9; // A4 height - cl padding
        const pagesVal = Math.max(1, Math.ceil((height - 211.6) / printableHeight));
        setNumPages(pagesVal);
      };

      measureCl();
      const observer = new ResizeObserver(measureCl);
      observer.observe(element);
      return () => observer.disconnect();
    } else {
      // CV - observe the hidden measurement root
      const element = document.getElementById('cv-measurement-root');
      if (!element) return;

      const measureAndSplit = () => {
        const ordered = getOrderedBlocks();
        const heights: Record<string, number> = {};

        ordered.forEach(blockId => {
          const blockEl = element.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
          if (blockEl) {
            const style = window.getComputedStyle(blockEl);
            const marginTop = parseFloat(style.marginTop) || 0;
            const marginBottom = parseFloat(style.marginBottom) || 0;
            heights[blockId] = blockEl.offsetHeight + marginTop + marginBottom;
          }
        });

        const pagesList: string[][] = [];
        let currentPage: string[] = [];
        let currentHeight = 0;
        const printableHeight = (297 - (pagePaddingTop + pagePaddingBottom)) * 3.779527559;

        ordered.forEach(blockId => {
          const blockHeight = heights[blockId] || 0;
          if (currentHeight + blockHeight > printableHeight && currentPage.length > 0) {
            pagesList.push(currentPage);
            currentPage = [blockId];
            currentHeight = blockHeight;
          } else {
            currentPage.push(blockId);
            currentHeight += blockHeight;
          }
        });

        if (currentPage.length > 0) {
          pagesList.push(currentPage);
        }

        setPages(pagesList);
        setNumPages(pagesList.length);
      };

      measureAndSplit();
      const observer = new ResizeObserver(measureAndSplit);
      observer.observe(element);
      return () => observer.disconnect();
    }
  }, [result, fontSize, sectionSpacing, pagePaddingTop, pagePaddingBottom, pagePaddingSide, bulletSpacing, signatureSpacing, photoHeight, headerSpacing, bulletStyle, lengthTarget, previewTab]);


  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        // If the profile is completely empty (no fullName), mark as not set
        if (data.fullName) {
          setProfile(data);
          // Set default signing location based on profile address
          if (data.address && !signingLocation) {
            const parts = data.address.split(',');
            const city = parts[parts.length - 1] || parts[0];
            setSigningLocation(city.trim().replace(/\d+/g, '').trim());
          }
        }
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchApplicationForEditing = async (appId: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`);
      if (res.ok) {
        const app = await res.json();
        setCompanyName(app.company);
        setRoleName(app.role);
        setJobDescription(app.rawJobDescription);
        setCvLanguage(app.targetLanguage as 'EN' | 'DE');
        setClLanguage(app.targetLanguage as 'EN' | 'DE');
        setSalaryExpectation(app.salaryExpectation || '');
        setNoticePeriod(app.noticePeriod || '');
        setSigningLocation(app.signingLocation || '');
        setCustomNotes(app.customNotes || '');

        // Locate matching documents
        const cvDoc = app.documents.find((d: any) => d.type === 'CV');
        const clDoc = app.documents.find((d: any) => d.type === 'COVER_LETTER');

        if (cvDoc && clDoc) {
          setResult({
            matchScore: app.matchScore,
            gapAnalysis: app.gapAnalysis,
            tailoredCv: JSON.parse(cvDoc.content),
            tailoredCoverLetter: JSON.parse(clDoc.content)
          });
        }
      }
    } catch (err) {
      console.error('Error loading application details:', err);
    }
  };

  const handleUrlScrape = async () => {
    if (!jobUrl.trim() || !jobUrl.startsWith('http')) {
      alert('Please enter a valid job posting URL.');
      return;
    }
    setScraping(true);
    setScrapeError(null);
    setScrapeWarning(null);
    try {
      const res = await fetch('/api/intake/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobUrl.trim() })
      });

      if (!res.ok) {
        let errMsg = 'Failed to scrape URL';
        const rawText = await res.text();
        try {
          const errJson = JSON.parse(rawText);
          errMsg = errJson.error || errMsg;
        } catch {
          console.error('Server error response:', rawText);
          errMsg = `Server Error (${res.status}): ${rawText.slice(0, 150)}...`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.fallback) {
        setScrapeWarning(data.message);
        // Switch to text mode so they know they need to paste it
        setIntakeMethod('text');
      } else {
        if (data.roleName) setRoleName(data.roleName);
        if (data.companyName) setCompanyName(data.companyName);
        if (data.jobDescription) setJobDescription(data.jobDescription);
        
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.8 }
        });
      }
    } catch (err: any) {
      console.error(err);
      setScrapeError(err.message || 'An error occurred while scraping the job details.');
    } finally {
      setScraping(false);
    }
  };

  const handleJobPdfUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Please select a valid PDF file.');
      return;
    }
    setScraping(true);
    setScrapeError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/intake/parse-job-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errMsg = 'Failed to parse Job PDF';
        const rawText = await res.text();
        try {
          const errJson = JSON.parse(rawText);
          errMsg = errJson.error || errMsg;
        } catch {
          console.error('Server error response:', rawText);
          errMsg = `Server Error (${res.status}): ${rawText.slice(0, 150)}...`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (data.roleName) setRoleName(data.roleName);
      if (data.companyName) setCompanyName(data.companyName);
      if (data.jobDescription) setJobDescription(data.jobDescription);

      confetti({
        particleCount: 50,
        spread: 45,
        origin: { y: 0.8 }
      });
    } catch (err: any) {
      console.error(err);
      setScrapeError(err.message || 'An error occurred while parsing the Job PDF.');
    } finally {
      setScraping(false);
    }
  };

  const handleTailor = async () => {
    if (!jobDescription.trim() || !companyName.trim() || !roleName.trim()) {
      alert('Please fill out Company Name, Role Name, and Job Description.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription,
          cvLanguage,
          clLanguage,
          tone,
          lengthTarget,
          bulletStyle,
          clLength,
          skillsFocus,
          salaryExpectation,
          noticePeriod,
          signingLocation,
          customNotes,
          profile,
          matchStrategy,
          applicationId: editingAppId,
          roleName
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Server error during tailoring');
      }

      const data = (await res.json()) as TailorResponse;
      setResult(data);

      // Trigger celebrate confetti if match score is high
      if (data.matchScore >= 70) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(`Tailoring Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async (type: 'cv' | 'cl') => {
    try {
      const isCv = type === 'cv';
      const data = isCv ? result?.tailoredCv : result?.tailoredCoverLetter;
      const options = {
        fontSize,
        bulletSpacing,
        sectionSpacing,
        paddingTop: pagePaddingTop,
        paddingSide: pagePaddingSide,
        paddingBottom: pagePaddingBottom,
        bulletStyle,
        clLength,
        headerSpacing,
        photoHeight,
        signatureSpacing,
      };

      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          options,
          atsMode: isAtsMode,
        }),
      });

      if (!res.ok) {
        let errorMsg = 'Failed to generate PDF';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const cleanCompany = (companyName || 'Company').trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const cleanPosition = (roleName || 'Position').trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
      const docLabel = type === 'cv' ? 'CV' : 'Cover Letter';
      const fileName = `${cleanCompany}_${cleanPosition}_${docLabel}.pdf`;

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(`PDF Export Failed: ${err.message}`);
    }
  };


  const handleExportWord = () => {
    const type = previewTab === 'cv' ? 'cv' : 'cl';
    const element = type === 'cv' ? cvPreviewRef.current : clPreviewRef.current;
    if (!element) return;

    // Clean up contentEditable attributes and guide lines using DOM cloning
    const tempElement = element.cloneNode(true) as HTMLElement;
    tempElement.querySelectorAll('.no-print').forEach(el => el.remove());

    // Flatten CV pages to flow naturally in Word without fixed-height constraints
    if (type === 'cv') {
      const pageBoxes = tempElement.querySelectorAll('.cv-page-box');
      if (pageBoxes.length > 0) {
        const newContainer = tempElement.ownerDocument.createElement('div');
        pageBoxes.forEach((pageBox, pageIdx) => {
          if (pageIdx > 0) {
            const breakEl = tempElement.ownerDocument.createElement('div');
            breakEl.setAttribute('style', 'page-break-before: always;');
            newContainer.appendChild(breakEl);
          }
          // Move all child nodes of this pageBox to newContainer
          while (pageBox.firstChild) {
            newContainer.appendChild(pageBox.firstChild);
          }
        });
        // Clear tempElement and append the flattened content
        tempElement.innerHTML = '';
        tempElement.appendChild(newContainer);
      }
    }

    let htmlContent = tempElement.innerHTML;
    htmlContent = htmlContent.replace(/contenteditable="true"/g, '');
    htmlContent = htmlContent.replace(/contenteditable="false"/g, '');

    const isCv = type === 'cv';
    const bgColor = '#FFFFFF';
    const textColor = isCv ? '#1F2937' : '#1A1A1A';

    // Add XML wrappers and high fidelity formatting styles for Microsoft Word Document
    const header = `<html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <meta charset="utf-8">
            <title>${type === 'cv' ? 'Resume' : 'Cover Letter'}</title>
            <!--[if gte mso 9]>
            <xml>
              <w:WordDocument>
                <w:View>Print</w:View>
                <w:Zoom>100</w:Zoom>
              </w:WordDocument>
            </xml>
            <![endif]-->
            <style>
              @page {
                size: A4;
                margin: ${isCv ? `${pagePaddingTop}mm ${pagePaddingSide}mm ${pagePaddingBottom}mm ${pagePaddingSide}mm` : '32mm 28mm 24mm 28mm'};
              }
              body {
                background-color: ${bgColor};
                color: ${textColor};
                font-family: "Arial", "Calibri", "Helvetica", sans-serif;
                font-size: 11.5px;
                line-height: 1.55;
                margin: 0;
                padding: 0;
              }
              h1 {
                font-size: 24px;
                font-weight: bold;
                color: #1F2937;
                margin: 0 0 4px 0;
                line-height: 1.2;
              }
              h2 {
                font-size: 15px;
                font-weight: bold;
                letter-spacing: 2.2px;
                text-transform: uppercase;
                margin-top: 20px;
                margin-bottom: 4px;
              }
              p {
                margin: 0 0 6px 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 8px;
                margin-bottom: 8px;
              }
              td {
                vertical-align: top;
                padding-top: 4px;
                padding-bottom: 4px;
              }
              .border-b {
                border-bottom: 1px solid #CBD5E1;
              }
              .text-right {
                text-align: right;
              }
              .text-\\[\\#2980B9\\] {
                color: #2980B9 !important;
              }
              .text-gray-800 {
                color: #1F2937 !important;
              }
              .text-gray-700 {
                color: #374151 !important;
              }
              .text-gray-600 {
                color: #4B5563 !important;
              }
              .text-gray-500 {
                color: #6B7280 !important;
              }
              .font-semibold {
                font-weight: bold;
              }
              .italic {
                font-style: italic;
              }
              ul {
                margin: 6px 0;
                padding-left: 0;
                list-style-type: none;
              }
              li {
                margin-bottom: 4px;
              }
            </style>
          </head>
          <body>`;

    const footer = `</body></html>`;
    const docContent = header + htmlContent + footer;

    // Create a Blob and trigger download
    const blob = new Blob(['\ufeff' + docContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);

    const cleanCompany = (companyName || 'Company').trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const cleanPosition = (roleName || 'Position').trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const docLabel = type === 'cv' ? 'CV' : 'Cover Letter';
    const fileName = `${cleanCompany}_${cleanPosition}_${docLabel}.doc`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    if (!result) return;
    const type = previewTab === 'cv' ? 'cv' : 'cl';

    let textContent = '';

    if (type === 'cv') {
      const cv = result.tailoredCv;
      textContent += `==================================================\n`;
      textContent += `   ${cv.personalDetails.fullName.toUpperCase()}\n`;
      if (cv.personalDetails.occupation) {
        textContent += `   ${cv.personalDetails.occupation.toUpperCase()}\n`;
      }
      textContent += `==================================================\n\n`;
      textContent += `Email: ${cv.personalDetails.email}\n`;
      textContent += `Phone: ${cv.personalDetails.phone}\n`;
      if (cv.personalDetails.address) textContent += `Address: ${cv.personalDetails.address}\n`;
      if (cv.personalDetails.website) textContent += `Web: ${cv.personalDetails.website}\n`;
      if (cv.personalDetails.linkedin) textContent += `LinkedIn: ${cv.personalDetails.linkedin}\n`;
      if (cv.personalDetails.github) textContent += `GitHub: ${cv.personalDetails.github}\n\n`;

      if (cvLanguage === 'DE') {
        if (cv.personalDetails.dateOfBirth) textContent += `Geburtsdatum: ${cv.personalDetails.dateOfBirth}\n`;
        if (cv.personalDetails.birthplace) textContent += `Geburtsort: ${cv.personalDetails.birthplace}\n`;
        if (cv.personalDetails.nationality) textContent += `Staatsangehörigkeit: ${cv.personalDetails.nationality}\n\n`;
      }

      if (cv.summary) {
        textContent += `PROFESSIONAL SUMMARY\n`;
        textContent += `--------------------------------------------------\n`;
        textContent += `${cv.summary}\n\n`;
      }

      textContent += `WORK EXPERIENCE\n`;
      textContent += `--------------------------------------------------\n`;
      cv.workExperience.forEach((exp, idx) => {
        textContent += `${exp.role} | ${exp.company} - ${exp.location}\n`;
        textContent += `Period: ${exp.period}\n`;
        getRenderedBullets(exp, bulletStyle, lengthTarget, idx === 0).forEach((bullet: string) => {
          const cleanBullet = bullet.replace(/<[^>]*>/g, '');
          textContent += `- ${cleanBullet}\n`;
        });
        textContent += `\n`;
      });

      textContent += `EDUCATION\n`;
      textContent += `--------------------------------------------------\n`;
      cv.education.forEach((edu) => {
        textContent += `${edu.degree} | ${edu.institution} - ${edu.location}\n`;
        textContent += `Period: ${edu.period}\n\n`;
      });

      textContent += `SKILLS\n`;
      textContent += `--------------------------------------------------\n`;
      const skillNames = cv.skills.map((s: any) => typeof s === 'string' ? s : s.name);
      textContent += `${skillNames.join(', ')}\n\n`;

      textContent += `LANGUAGES\n`;
      textContent += `--------------------------------------------------\n`;
      cv.languages.forEach((lang) => {
        textContent += `${lang.language}: ${lang.level}\n`;
      });

      if (cv.signingLine) {
        textContent += `\n\n${cv.signingLine}\n`;
      }
    } else {
      const cl = result.tailoredCoverLetter;
      textContent += `SENDER:\n${cl.senderAddress}\n\n`;
      textContent += `RECIPIENT:\n${cl.recipientAddress}\n\n`;
      textContent += `DATE: ${cl.dateLine}\n\n`;
      textContent += `SUBJECT: ${cl.subjectLine}\n\n`;
      textContent += `${cl.salutation}\n\n`;
      getRenderedParagraphs(cl, clLength).forEach((p: string) => {
        const cleanPara = p.replace(/<[^>]*>/g, '');
        textContent += `${cleanPara}\n\n`;
      });
      textContent += `${cl.closing}\n\n`;
      textContent += `${cl.signatureName}\n`;
    }

    // Strip out remaining HTML tags that could be in text from editing
    textContent = textContent.replace(/<[^>]*>/g, '');

    // Download file
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const cleanCompany = (companyName || 'Company').trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const cleanPosition = (roleName || 'Position').trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
    const docLabel = type === 'cv' ? 'CV' : 'Cover Letter';
    const fileName = `${cleanCompany}_${cleanPosition}_${docLabel}.txt`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddSkillInteractive = async (skill: string, skipConfirm = false) => {
    if (!result) return;
    if (!skipConfirm) {
      const confirmAdd = window.confirm(`Would you like to add "${skill}" to your Master Profile and update the match scorecard?`);
      if (!confirmAdd) return;
    }

    const initialMatching = result.gapAnalysis.matchingKeywords;
    const initialMissing = result.gapAnalysis.missingSkills;

    if (!initialMissing.includes(skill)) return;

    const newMissing = initialMissing.filter(s => s !== skill);
    const newMatching = [...initialMatching, skill];

    // Recalculate match score in real-time
    const initialTotal = initialMatching.length + initialMissing.length;
    const currentMatching = newMatching.length;

    const originalScore = result.matchScore;
    const closedGapsRatio = (initialMissing.length - newMissing.length) / (initialMissing.length || 1);
    const newScore = Math.min(100, Math.round(originalScore + (closedGapsRatio * (100 - originalScore))));

    const updatedCvSkills = [...(result.tailoredCv.skills || []), { name: skill, level: 'Intermediate' }];

    setResult({
      ...result,
      matchScore: newScore,
      gapAnalysis: {
        ...result.gapAnalysis,
        missingSkills: newMissing,
        matchingKeywords: newMatching
      },
      tailoredCv: {
        ...result.tailoredCv,
        skills: updatedCvSkills
      }
    });

    try {
      const currentSkills = Array.isArray(profile.skills) ? profile.skills : JSON.parse(profile.skills || '[]');
      const hasSkill = currentSkills.some((s: any) => {
        const name = typeof s === 'string' ? s : s.name;
        return name?.toLowerCase() === skill.toLowerCase();
      });

      if (!hasSkill) {
        const updatedSkills = [...currentSkills, { name: skill, level: 'Intermediate' }];
        const updatedProfile = {
          ...profile,
          skills: updatedSkills
        };

        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile)
        });

        if (response.ok) {
          setProfile(updatedProfile);
        } else {
          console.error('Failed to sync new skill to database profile');
        }
      }
    } catch (err) {
      console.error('Error syncing profile skill:', err);
    }
  };

  const saveToApplicationsTracker = async () => {
    if (!result) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const payload = {
      company: companyName,
      role: roleName,
      salaryExpectation,
      noticePeriod,
      signingLocation,
      customNotes,
      rawJobDescription: jobDescription,
      matchScore: result.matchScore,
      gapAnalysis: result.gapAnalysis,
      targetLanguage: cvLanguage,
      documents: [
        { type: 'CV', content: JSON.stringify(result.tailoredCv) },
        { type: 'COVER_LETTER', content: JSON.stringify(result.tailoredCoverLetter) }
      ]
    };

    try {
      const url = editingAppId ? `/api/applications/${editingAppId}` : '/api/applications';
      const method = editingAppId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Inline result editing handlers
  const handleCvDetailsChange = (key: string, value: string) => {
    if (!result) return;
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        personalDetails: {
          ...result.tailoredCv.personalDetails,
          [key]: value
        }
      }
    });
  };

  const handleCvSummaryChange = (val: string) => {
    if (!result) return;
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        summary: val
      }
    });
  };

  const handleWorkExperienceChange = (expIdx: number, key: 'period' | 'role' | 'company' | 'location', value: string) => {
    if (!result) return;
    const newWorkExp = [...result.tailoredCv.workExperience];
    newWorkExp[expIdx] = {
      ...newWorkExp[expIdx],
      [key]: value
    };
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        workExperience: newWorkExp
      }
    });
  };

  const handleWorkExperienceBulletChange = (expIdx: number, bulletIdx: number, value: string) => {
    if (!result) return;
    const activeStyleKey = getActiveBulletStyleKey(bulletStyle);
    const newWorkExp = [...result.tailoredCv.workExperience];

    let currentBulletsObj = newWorkExp[expIdx].bullets;
    if (Array.isArray(currentBulletsObj)) {
      currentBulletsObj = {
        star: [...currentBulletsObj],
        punchy: [...currentBulletsObj],
        standard: [...currentBulletsObj]
      };
    } else {
      currentBulletsObj = { ...currentBulletsObj };
    }

    const variantBullets = [...(currentBulletsObj[activeStyleKey] || [])];
    variantBullets[bulletIdx] = value;

    newWorkExp[expIdx] = {
      ...newWorkExp[expIdx],
      bullets: {
        ...currentBulletsObj,
        [activeStyleKey]: variantBullets
      }
    };

    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        workExperience: newWorkExp
      }
    });
  };

  const handleDeleteWorkExperienceBullet = (expIdx: number, bulletIdx: number) => {
    if (!result) return;
    const activeStyleKey = getActiveBulletStyleKey(bulletStyle);
    const newWorkExp = [...result.tailoredCv.workExperience];

    let currentBulletsObj = newWorkExp[expIdx].bullets;
    if (Array.isArray(currentBulletsObj)) {
      currentBulletsObj = {
        star: [...currentBulletsObj],
        punchy: [...currentBulletsObj],
        standard: [...currentBulletsObj]
      };
    } else {
      currentBulletsObj = {
        star: currentBulletsObj.star ? [...currentBulletsObj.star] : [],
        punchy: currentBulletsObj.punchy ? [...currentBulletsObj.punchy] : [],
        standard: currentBulletsObj.standard ? [...currentBulletsObj.standard] : []
      };
    }

    const variantBullets = [...(currentBulletsObj[activeStyleKey] || [])];
    variantBullets.splice(bulletIdx, 1);

    newWorkExp[expIdx] = {
      ...newWorkExp[expIdx],
      bullets: {
        ...currentBulletsObj,
        [activeStyleKey]: variantBullets
      }
    };

    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        workExperience: newWorkExp
      }
    });
  };

  const handleEducationChange = (eduIdx: number, key: 'period' | 'degree' | 'institution' | 'location', value: string) => {
    if (!result) return;
    const newEdu = [...result.tailoredCv.education];
    newEdu[eduIdx] = {
      ...newEdu[eduIdx],
      [key]: value
    };
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        education: newEdu
      }
    });
  };

  const handleSkillsChange = (value: string) => {
    if (!result) return;
    const cleanValue = value.replace(/<[^>]*>/g, '');
    const names = cleanValue.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
    const existingSkills = result.tailoredCv.skills || [];

    const newSkills = names.map(name => {
      const match = existingSkills.find(es => (typeof es === 'string' ? es : es.name).toLowerCase() === name.toLowerCase());
      if (match) {
        return typeof match === 'string' ? { name, level: 'Intermediate' } : match;
      }
      return { name, level: 'Intermediate' };
    });

    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        skills: newSkills
      }
    });
  };

  const handleLanguagesChange = (idx: number, key: 'language' | 'level', value: string) => {
    if (!result) return;
    const newLanguages = [...result.tailoredCv.languages];
    newLanguages[idx] = {
      ...newLanguages[idx],
      [key]: value
    };
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        languages: newLanguages
      }
    });
  };

  const handleSigningLineChange = (value: string) => {
    if (!result) return;
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        signingLine: value
      }
    });
  };

  const handleClChange = (key: keyof TailoredCoverLetter, value: string) => {
    if (!result) return;
    setResult({
      ...result,
      tailoredCoverLetter: {
        ...result.tailoredCoverLetter,
        [key]: value
      }
    });
  };

  const handleClParagraphChange = (index: number, val: string) => {
    if (!result) return;
    const activeLengthKey = clLength.includes('Short') ? 'short' : 'detailed';
    const newCl = { ...result.tailoredCoverLetter };

    let currentParasObj = newCl.paragraphs;
    if (Array.isArray(currentParasObj)) {
      currentParasObj = {
        short: [...currentParasObj],
        detailed: [...currentParasObj]
      };
    } else {
      currentParasObj = { ...currentParasObj };
    }

    const variantParas = [...(currentParasObj[activeLengthKey] || [])];
    variantParas[index] = val;

    newCl.paragraphs = {
      ...currentParasObj,
      [activeLengthKey]: variantParas
    };

    setResult({
      ...result,
      tailoredCoverLetter: newCl
    });
  };

  if (profileLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4"></div>
        <p className="text-zinc-400 text-sm animate-pulse">Loading Workspace...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl mb-6">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Master Profile Vault is Empty</h2>
        <p className="text-zinc-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
          Before tailoring a CV or Resume, you need to populate your master details. This serves as the factual basis that the AI uses to structure your applications.
        </p>
        <Link
          href="/profile"
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all duration-300"
        >
          Setup Master Profile
        </Link>
      </div>
    );
  }

  const s = getTemplateStyles(styleTemplate);
  const pagesToRender = pages.length > 0 ? pages : [getOrderedBlocks()];


  return (
    <div className="flex-grow flex flex-col min-h-[calc(100vh-73px)] w-full overflow-x-hidden">
      {/* Mobile Switch Tab Bar */}
      <div className="lg:hidden sticky top-0 z-30 flex bg-[#030014]/90 backdrop-blur-md border-b border-white/5 p-2 gap-2 w-full shrink-0">
        <button
          onClick={() => setActiveMobileTab('edit')}
          className={`flex-grow flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMobileTab === 'edit'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white bg-white/5'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Edit & Strategy
        </button>
        <button
          onClick={() => setActiveMobileTab('preview')}
          className={`flex-grow flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeMobileTab === 'preview'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Document Preview
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 w-full overflow-hidden">
        {/* Left Input Pane: Col 5 */}
        <div className={`lg:col-span-5 border-r border-white/5 bg-zinc-950/40 p-6 md:p-8 overflow-y-auto h-[calc(100vh-125px)] lg:h-auto lg:max-h-[calc(100vh-73px)] space-y-6 ${
          activeMobileTab === 'edit' ? 'block' : 'hidden lg:block'
        }`}>
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            AI Tailoring Workspace
          </h1>
          <p className="text-xs text-zinc-400">
            Feed the job post requirements and details. The engine builds hyper-aligned outputs based exclusively on your master details.
          </p>
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. BMW Group"
                className="glass-input px-3.5 py-2.5 text-xs"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role Name</label>
              <input
                type="text"
                value={roleName}
                onChange={e => setRoleName(e.target.value)}
                placeholder="e.g. Senior Cloud Engineer"
                className="glass-input px-3.5 py-2.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">CV Language</label>
              <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setCvLanguage('EN')}
                  className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${cvLanguage === 'EN'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setCvLanguage('DE')}
                  className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${cvLanguage === 'DE'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  DE
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Cover Letter Language</label>
              <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => setClLanguage('EN')}
                  className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${clLanguage === 'EN'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setClLanguage('DE')}
                  className={`py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${clLanguage === 'DE'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                    }`}
                >
                  DE
                </button>
              </div>
            </div>
          </div>

          {/* Prompt Customization Options */}
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Tailoring Customizations
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">CV Tone</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="glass-input px-2.5 py-1.5 text-xs bg-zinc-900 border border-white/10 w-full"
                >
                  <option value="Bold & Action-oriented">Bold & Action-oriented</option>
                  <option value="Academic & Technical">Academic & Technical</option>
                  <option value="Executive & High-level">Executive & High-level</option>
                  <option value="Humble & Fact-driven">Humble & Fact-driven</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">CV Length Target</label>
                <select
                  value={lengthTarget}
                  onChange={e => setLengthTarget(e.target.value)}
                  className="glass-input px-2.5 py-1.5 text-xs bg-zinc-900 border border-white/10 w-full"
                >
                  <option value="Strict 1-Page (concise)">Strict 1-Page</option>
                  <option value="Standard 2-Page (detailed)">Standard 2-Page</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">CL Length</label>
                <select
                  value={clLength}
                  onChange={e => setClLength(e.target.value)}
                  className="glass-input px-2.5 py-1.5 text-xs bg-zinc-900 border border-white/10 w-full"
                >
                  <option value="Short & Punchy (under 300 words)">Short & Punchy</option>
                  <option value="Detailed & Elaborate">Detailed & Elaborate</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Skills Highlight Mode</label>
                <select
                  value={skillsFocus}
                  onChange={e => setSkillsFocus(e.target.value)}
                  className="glass-input px-2.5 py-1.5 text-xs bg-zinc-900 border border-white/10 w-full"
                >
                  <option value="Tech-Heavy Focus">Tech-Heavy Focus</option>
                  <option value="Soft Skills & Leadership focus">Soft Skills & Leadership Focus</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual Spacing Fine-Tuning Sidebar Panel */}
          {result && previewTab === 'cv' && (
            <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5 font-sans">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Visual Spacing Adjuster
                </span>
                <span className="text-[9px] text-zinc-500 font-normal font-sans">Fine-tune gaps</span>
              </h3>

              {/* Presets Row */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-lg border border-white/5 font-sans">
                <button
                  type="button"
                  onClick={() => applyPreset('default')}
                  className="py-1 text-[10px] font-bold rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer bg-zinc-900/50"
                >
                  Default
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('compact')}
                  className="py-1 text-[10px] font-bold rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer bg-zinc-900/50"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('tight')}
                  className="py-1 text-[10px] font-bold rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer bg-zinc-900/50"
                >
                  Ultra-Tight
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-2.5 pt-1 text-xs font-sans">
                {/* Font Size */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Base Font Size</span>
                    <span className="font-semibold text-white">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="9.5"
                    max="13"
                    step="0.1"
                    value={fontSize}
                    onChange={e => setFontSize(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Section Spacing */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Section Gaps</span>
                    <span className="font-semibold text-white">{sectionSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="36"
                    step="1"
                    value={sectionSpacing}
                    onChange={e => setSectionSpacing(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Header Spacing (Gap between Occupation and Contact info) */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Header Gap</span>
                    <span className="font-semibold text-white">{headerSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="32"
                    step="1"
                    value={headerSpacing}
                    onChange={e => setHeaderSpacing(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Page Padding Top */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Top Margins</span>
                    <span className="font-semibold text-white">{pagePaddingTop}mm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="1"
                    value={pagePaddingTop}
                    onChange={e => setPagePaddingTop(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Page Padding Bottom */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Bottom Margins</span>
                    <span className="font-semibold text-white">{pagePaddingBottom}mm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="35"
                    step="1"
                    value={pagePaddingBottom}
                    onChange={e => setPagePaddingBottom(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Page Padding Side */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Side Margins</span>
                    <span className="font-semibold text-white">{pagePaddingSide}mm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="35"
                    step="1"
                    value={pagePaddingSide}
                    onChange={e => setPagePaddingSide(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Bullet Spacing */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Bullet Spacing</span>
                    <span className="font-semibold text-white">{bulletSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="0.5"
                    value={bulletSpacing}
                    onChange={e => setBulletSpacing(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Signature Spacing */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Signature Space</span>
                    <span className="font-semibold text-white">{signatureSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="60"
                    step="1"
                    value={signatureSpacing}
                    onChange={e => setSignatureSpacing(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Match Strategy Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Match Strategy</label>
              <span className="text-[9px] text-zinc-500 font-medium">Selects AI prompt logic</span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setMatchStrategy('TACTICAL_PIVOT')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${matchStrategy === 'TACTICAL_PIVOT'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
                  }`}
                title="Explain skill gaps constructively in the cover letter"
              >
                Tactical Pivot
              </button>
              <button
                type="button"
                onClick={() => setMatchStrategy('AGGRESIVE_BRIDGING')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${matchStrategy === 'AGGRESIVE_BRIDGING'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
                  }`}
                title="Optimize terminology aggressively to align with ATS filters"
              >
                Aggressive Bridging
              </button>
            </div>
          </div>



          {/* Intake Method Tabs */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Job Intake Method</label>
            <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-xl border border-white/5 font-sans">
              <button
                type="button"
                onClick={() => setIntakeMethod('text')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${intakeMethod === 'text'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
                  }`}
              >
                Text Paste
              </button>
              <button
                type="button"
                onClick={() => setIntakeMethod('url')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${intakeMethod === 'url'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
                  }`}
              >
                Job URL
              </button>
              <button
                type="button"
                onClick={() => setIntakeMethod('pdf')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${intakeMethod === 'pdf'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
                  }`}
              >
                Job PDF
              </button>
            </div>
          </div>

          {/* Conditional Intake Content */}
          {intakeMethod === 'url' && (
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Job Posting URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={e => setJobUrl(e.target.value)}
                    placeholder="https://example.com/jobs/123"
                    className="glass-input px-3 py-2 text-xs flex-1"
                    disabled={scraping}
                  />
                  <button
                    type="button"
                    onClick={handleUrlScrape}
                    disabled={scraping}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {scraping ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Scraping...
                      </>
                    ) : (
                      'Scrape URL'
                    )}
                  </button>
                </div>
              </div>
              {scrapeWarning && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg text-[11px] leading-relaxed flex items-start gap-1.5 font-sans">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{scrapeWarning}</span>
                </div>
              )}
              {scrapeError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-[11px] leading-relaxed flex items-start gap-1.5 font-sans">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{scrapeError}</span>
                </div>
              )}
            </div>
          )}

          {intakeMethod === 'pdf' && (
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3 text-left">
              <label className="text-[10px] text-zinc-400 font-semibold uppercase">Upload Job Advertisement PDF</label>
              <div className="relative group">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleJobPdfUpload(file);
                  }}
                  className="hidden"
                  id="job-pdf-upload"
                  disabled={scraping}
                />
                <label
                  htmlFor="job-pdf-upload"
                  className="flex flex-col items-center justify-center border border-dashed border-zinc-700/50 bg-white/[0.02] hover:bg-white/[0.04] transition-all rounded-xl p-5 text-center cursor-pointer"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleJobPdfUpload(file);
                  }}
                >
                  <FileText className="w-8 h-8 text-indigo-400 mb-2 group-hover:scale-110 transition-transform duration-300" />
                  {scraping ? (
                    <div className="flex items-center gap-1.5 font-sans">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
                      <span className="text-[11px] text-zinc-400">Parsing PDF job description...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-white font-medium">Click to select JD PDF</span>
                      <span className="text-[10px] text-zinc-500 mt-1">Drag and drop here</span>
                    </>
                  )}
                </label>
              </div>
              {scrapeError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg text-[11px] leading-relaxed flex items-start gap-1.5 font-sans">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{scrapeError}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1 text-left">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Job Description (Raw Text)</label>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or requirements here..."
              rows={6}
              className="glass-input p-3 text-xs font-mono w-full resize-none"
            />
          </div>

          {/* Context Panel Toggle */}
          <div className="border border-white/5 bg-white/[0.01] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
              Additional Details / Overrides
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Salary Expectation</label>
                <input
                  type="text"
                  value={salaryExpectation}
                  onChange={e => setSalaryExpectation(e.target.value)}
                  placeholder="e.g. €85,000 / year"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Notice Period / Availability</label>
                <input
                  type="text"
                  value={noticePeriod}
                  onChange={e => setNoticePeriod(e.target.value)}
                  placeholder="e.g. 2 months notice"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Signing Location</label>
                <input
                  type="text"
                  value={signingLocation}
                  onChange={e => setSigningLocation(e.target.value)}
                  placeholder="e.g. Munich"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Custom Focus Notes</label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="e.g. Highlight AWS, omit old PHP"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Missing Assets Prompt */}
          {profile && (!profile.photo || !profile.signature) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs space-y-1 text-left">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                Missing Profile Assets
              </div>
              <p className="text-zinc-400 leading-relaxed">
                {!profile.photo && !profile.signature ? (
                  <>Your profile is missing a <strong>photo</strong> and a <strong>signature</strong> image. Default placeholders will be used on the documents. You can upload them in your <Link href="/profile" className="text-indigo-400 underline hover:text-indigo-300 font-semibold">Master Profile</Link>.</>
                ) : !profile.photo ? (
                  <>Your profile is missing a <strong>photo</strong>. A placeholder silhouette will be used. You can upload one in your <Link href="/profile" className="text-indigo-400 underline hover:text-indigo-300 font-semibold">Master Profile</Link>.</>
                ) : (
                  <>Your profile is missing a <strong>signature</strong>. A demo cursive signature will be used. You can upload one in your <Link href="/profile" className="text-indigo-400 underline hover:text-indigo-300 font-semibold">Master Profile</Link>.</>
                )}
              </p>
            </div>
          )}

          <button
            onClick={handleTailor}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing Job & Tailoring Documents...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 animate-pulse" />
                Tailor CV & Cover Letter Now
              </>
            )}
          </button>
        </div>

        {/* Scorecard and Analysis Result */}
        {result && (
          <div className="pt-6 border-t border-white/5 space-y-5">
            <div>
              <h2 className="text-md font-bold text-white mb-2 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-400" />
                AI Match Scorecard & Insights
              </h2>
              <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-zinc-800">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow"></div>
                  <span className="font-extrabold text-white text-lg">{result.matchScore}%</span>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Keyword/Skill Alignment</h4>
                  <p className="text-xs text-zinc-400">Based on factual CV entries parsed against target requirements.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div
                className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const skill = e.dataTransfer.getData('text/plain');
                  handleAddSkillInteractive(skill, true);
                }}
              >
                <h4 className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Matching Keywords
                </h4>
                <div className="flex flex-wrap gap-1 min-h-[40px] border border-dashed border-emerald-500/10 rounded p-1">
                  {result.gapAnalysis.matchingKeywords.map((k, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300">{k}</span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                <h4 className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Missing / Skill Gaps
                </h4>
                <div className="flex flex-wrap gap-1 min-h-[40px]">
                  {result.gapAnalysis.missingSkills.length > 0 ? (
                    result.gapAnalysis.missingSkills.map((s, i) => (
                      <span
                        key={i}
                        draggable={true}
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', s)}
                        onClick={() => handleAddSkillInteractive(s, false)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 cursor-pointer hover:bg-amber-500/20 active:scale-95 transition-all select-none"
                        title="Click or drag to add this skill to your profile"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-zinc-500">Perfect keyword alignment!</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs space-y-3">
              <h4 className="font-bold text-indigo-300 border-b border-indigo-500/10 pb-1.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                AI Placement Recommendation
              </h4>
              {renderRecommendation(result.gapAnalysis.recommendations)}
            </div>

            {/* Editable Fields Box */}
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Inline Editor</h3>
              <p className="text-[10px] text-zinc-500">Edit details below. The live preview on the right will update in real-time.</p>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400">Personal Contact Detail Header</label>
                <input
                  type="text"
                  value={result.tailoredCv.personalDetails.fullName}
                  onChange={e => handleCvDetailsChange('fullName', e.target.value)}
                  className="glass-input px-3 py-1.5 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400">CV Professional Summary</label>
                <textarea
                  value={result.tailoredCv.summary}
                  onChange={e => handleCvSummaryChange(e.target.value)}
                  rows={4}
                  className="glass-input p-2 text-xs resize-none"
                />
              </div>

              {previewTab === 'coverLetter' && getRenderedParagraphs(result.tailoredCoverLetter, clLength).map((para: string, pIdx: number) => (
                <div key={pIdx} className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400">Cover Letter Paragraph {pIdx + 1}</label>
                  <textarea
                    value={para}
                    onChange={e => handleClParagraphChange(pIdx, e.target.value)}
                    rows={4}
                    className="glass-input p-2 text-xs resize-none"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={saveToApplicationsTracker}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {editingAppId ? 'Updating...' : 'Saving...'}
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    {editingAppId ? 'Updated in Tracker!' : 'Saved to Tracker!'}
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    {editingAppId ? 'Update Tracked Application' : 'Save Application Tracker'}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Preview Pane: Col 7 */}
      <div className={`lg:col-span-7 bg-[#0b081e]/30 flex flex-col overflow-y-auto h-[calc(100vh-125px)] lg:h-auto lg:max-h-[calc(100vh-73px)] ${
        activeMobileTab === 'preview' ? 'block' : 'hidden lg:block'
      }`}>
        {/* Toolbar */}
        <div className="sticky top-0 z-20 no-print flex items-center justify-between px-6 py-3 bg-[#0a061b] border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 font-sans">
              <button
                onClick={() => setPreviewTab('cv')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${previewTab === 'cv'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                Tailored {cvLanguage === 'DE' ? 'Lebenslauf' : 'Resume'}
              </button>
              <button
                onClick={() => setPreviewTab('coverLetter')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${previewTab === 'coverLetter'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                Tailored {clLanguage === 'DE' ? 'Anschreiben' : 'Cover Letter'}
              </button>
            </div>

            <div className="flex bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-lg p-0.5 font-sans">
              <button
                type="button"
                onClick={() => setIsAtsMode(false)}
                className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all cursor-pointer ${
                  !isAtsMode
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Visual Layout (Standard)
              </button>
              <button
                type="button"
                onClick={() => setIsAtsMode(true)}
                className={`px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all cursor-pointer ${
                  isAtsMode
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Strict ATS Layout
              </button>
            </div>

            {result && (
              <span className="text-[10px] font-semibold px-2 py-1 rounded-md bg-zinc-900 border border-white/5 flex items-center gap-1.5 font-sans">
                <span>Height:</span>
                <span className={numPages > 1 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                  {numPages} {numPages === 1 ? 'Page' : 'Pages'}
                </span>
                {numPages > 1 && lengthTarget === 'Strict 1-Page (concise)' && previewTab === 'cv' && (
                  <span className="hidden md:inline text-amber-500 font-normal">
                    (Spillover warning: try reducing bullets to fit on 1 Page)
                  </span>
                )}
              </span>
            )}
          </div>



          {result && (
            <div className="relative no-print font-sans">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Format
              </button>

              {exportDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setExportDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-52 bg-[#0a061b] border border-white/10 rounded-xl shadow-xl z-30 py-1.5 text-xs text-zinc-300">
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        handleExportPdf(previewTab === 'cv' ? 'cv' : 'cl');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      Download PDF Document (.pdf)
                    </button>
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        handleExportWord();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      Download MS Word Document (.doc)
                    </button>
                    <button
                      onClick={() => {
                        setExportDropdownOpen(false);
                        handleExportText();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                    >
                      Download Plain Text (.txt)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Real-time page overflow alert */}
        {result && numPages > 1 && lengthTarget.includes('1-Page') && previewTab === 'cv' && (
          <div className="no-print mx-6 mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs flex items-center justify-between gap-3 text-rose-300 font-sans animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-bounce" />
              <div>
                <span className="font-bold">1-Page Target Limit Exceeded:</span> Currently rendering {numPages} pages. Your content has spilled over to the second page. Reduce text or spacing to fit within 1 page.
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-rose-500/25 text-rose-200 font-bold whitespace-nowrap">
              Action Required
            </span>
          </div>
        )}

        {/* Live A4 Sheet Render */}
        <div className="flex-1 p-6 md:p-8 bg-[#040116] flex items-start justify-center">
          {result ? (
            <div className="w-full max-w-[210mm] flex flex-col items-center">

              {/* Floating Customization Toolbar */}
              {previewTab === 'cv' && (
                <div className="w-full no-print mb-4 p-3 bg-white/5 border border-white/10 rounded-xl flex flex-wrap items-center justify-between gap-3 text-white font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-zinc-300">Quick Gaps Preset:</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyPreset('default')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Default
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('compact')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Compact
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('tight')}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Ultra-Tight
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Section:</span>
                      <input
                        type="range"
                        min="4"
                        max="36"
                        value={sectionSpacing}
                        onChange={e => setSectionSpacing(parseInt(e.target.value))}
                        className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        title="Section Spacing"
                      />
                      <span className="text-zinc-300 font-semibold w-8">{sectionSpacing}px</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Header Gap:</span>
                      <input
                        type="range"
                        min="2"
                        max="32"
                        value={headerSpacing}
                        onChange={e => setHeaderSpacing(parseInt(e.target.value))}
                        className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        title="Header Spacing"
                      />
                      <span className="text-zinc-300 font-semibold w-8">{headerSpacing}px</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Text Size:</span>
                      <input
                        type="range"
                        min="9.5"
                        max="13"
                        step="0.1"
                        value={fontSize}
                        onChange={e => setFontSize(parseFloat(e.target.value))}
                        className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        title="Font Size"
                      />
                      <span className="text-zinc-300 font-semibold w-9">{fontSize}px</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Margins:</span>
                      <input
                        type="range"
                        min="10"
                        max="40"
                        value={pagePaddingTop}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setPagePaddingTop(val);
                          setPagePaddingBottom(Math.max(10, Math.floor(val * 0.7)));
                          setPagePaddingSide(Math.max(10, Math.floor(val * 0.85)));
                        }}
                        className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        title="Page Margins"
                      />
                      <span className="text-zinc-300 font-semibold w-8">{pagePaddingTop}mm</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={previewContainerRef} className="w-full overflow-hidden shadow-2xl rounded-lg border border-white/5 flex flex-col items-center py-4">
                {result && previewTab === 'cv' && (
                  <div
                    id="cv-measurement-root"
                    className="absolute left-[-9999px] top-[-9999px] flex flex-col bg-white text-gray-800"
                    style={{
                      width: '794px',
                      padding: `${pagePaddingTop}mm ${pagePaddingSide}mm ${pagePaddingBottom}mm ${pagePaddingSide}mm`,
                      boxSizing: 'border-box',
                      fontFamily: '"Inter", "Calibri", "Segoe UI", system-ui, sans-serif',
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.55,
                    }}
                  >
                    {getOrderedBlocks().map(blockId => renderBlock(blockId, true))}
                  </div>
                )}

                {/* CV Preview Page */}
                {previewTab === 'cv' && (
                  <div
                    ref={cvPreviewRef}
                    id="cv-sheet"
                    className="flex flex-col gap-6 w-full items-center no-print"
                  >
                    {pagesToRender.map((pageBlockIds, pageIdx) => {
                      const a4Width = 794; // A4 width in px (210mm)
                      const a4Height = 1123; // A4 height in px (297mm)
                      const scale = previewWidth < a4Width ? (previewWidth - 24) / a4Width : 1;

                      return (
                        <div
                          key={pageIdx}
                          className="cv-page-scale-wrapper flex items-center justify-center no-print"
                          style={{
                            width: '100%',
                            height: `${a4Height * scale}px`,
                            overflow: 'hidden',
                            flexShrink: 0
                          }}
                        >
                          <div
                            className={`cv-page-box w-[794px] h-[1123px] relative flex flex-col bg-white text-gray-800 shadow-lg print:shadow-none ${lengthTarget.includes('1-Page') ? 'strict-1-page' : ''
                              }`}
                            style={{
                              width: '794px',
                              height: '1123px',
                              fontFamily: '"Inter", "Calibri", "Segoe UI", system-ui, sans-serif',
                              fontSize: `${fontSize}px`,
                              lineHeight: 1.55,
                              padding: `${pagePaddingTop}mm ${pagePaddingSide}mm ${pagePaddingBottom}mm ${pagePaddingSide}mm`,
                              boxSizing: 'border-box',
                              overflow: 'hidden',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                              transform: `scale(${scale})`,
                              transformOrigin: 'top center',
                              flexShrink: 0
                            }}
                          >
                            {pageBlockIds.map(blockId => renderBlock(blockId, false))}

                            {/* Page Number Indicator */}
                            <div className="absolute bottom-4 right-6 text-[10px] text-zinc-400 font-sans select-none no-print">
                              Page {pageIdx + 1} of {pagesToRender.length}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cover Letter Preview Page */}
                {previewTab === 'coverLetter' && (() => {
                  const a4Width = 794;
                  const a4Height = 1123;
                  const scale = previewWidth < a4Width ? (previewWidth - 24) / a4Width : 1;
                  return (
                    <div
                      className="cl-page-scale-wrapper flex items-center justify-center no-print"
                      style={{
                        width: '100%',
                        height: `${a4Height * scale}px`,
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      <div
                        ref={clPreviewRef}
                        id="cl-sheet"
                        className="w-[794px] min-h-[1123px] relative flex flex-col justify-between bg-white text-[#1a1a1a] mx-auto shadow-lg print:shadow-none"
                        style={{
                          width: '794px',
                          minHeight: '1123px',
                          fontFamily: '"Inter", "Calibri", "Segoe UI", system-ui, sans-serif',
                          fontSize: '11.5px',
                          lineHeight: 1.65,
                          padding: '32mm 28mm 24mm 28mm',
                          transform: `scale(${scale})`,
                          transformOrigin: 'top center',
                          flexShrink: 0
                        }}
                      >
                        <div className="text-xs">
                          {/* Sender block */}
                          <div className={`${isAtsMode ? 'text-left' : 'text-right'} text-[11.5px] leading-[1.7]`}>
                            <pre
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleClChange('senderAddress', e.target.innerText)}
                              className={`font-sans text-[11.5px] leading-[1.7] whitespace-pre-wrap inline-block ${isAtsMode ? 'text-left w-full' : 'text-right'}`}
                            >
                              {result.tailoredCoverLetter.senderAddress}
                            </pre>
                          </div>

                          {/* Recipient address + Date row */}
                          <div className={isAtsMode ? "mt-10 flex flex-col items-start gap-y-4 text-left font-sans" : "mt-10 flex justify-between items-end text-left font-sans"}>
                            <div>
                              <pre
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => handleClChange('recipientAddress', e.target.innerText)}
                                className="font-sans text-[11.5px] leading-[1.7] whitespace-pre-wrap"
                              >
                                {result.tailoredCoverLetter.recipientAddress}
                              </pre>
                            </div>
                            <div
                              contentEditable={true}
                              suppressContentEditableWarning={true}
                              onBlur={(e) => handleClChange('dateLine', e.target.innerText)}
                              className="text-[11.5px]"
                            >
                              {result.tailoredCoverLetter.dateLine}
                            </div>
                          </div>

                          {/* Subject line */}
                          <p
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => handleClChange('subjectLine', e.target.innerText)}
                            className="mt-12 font-bold text-[12px] text-left font-sans"
                          >
                            {result.tailoredCoverLetter.subjectLine}
                          </p>

                          {/* Salutation */}
                          <p
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => handleClChange('salutation', e.target.innerText)}
                            className="mt-8 text-[11.5px] text-left font-sans"
                          >
                            {result.tailoredCoverLetter.salutation}
                          </p>

                          {/* Body paragraphs */}
                          <div className="mt-5 space-y-4 text-[11.5px] leading-[1.65] text-left font-sans">
                            {getRenderedParagraphs(result.tailoredCoverLetter, clLength).map((p: string, i: number) => (
                              <p
                                key={i}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => handleClParagraphChange(i, e.target.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: p }}
                              />
                            ))}
                          </div>

                          {/* Closing */}
                          <p
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => handleClChange('closing', e.target.innerText)}
                            className="mt-8 text-[11.5px] text-left font-sans"
                          >
                            {result.tailoredCoverLetter.closing}
                          </p>

                          {/* Signature */}
                          <div className="mt-3 h-[32px] flex items-end">
                            {result.tailoredCv.personalDetails.signature ? (
                              <img
                                src={result.tailoredCv.personalDetails.signature}
                                alt="Signature"
                                className="max-h-full max-w-[120px] object-contain"
                              />
                            ) : (
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
                            )}
                          </div>

                          {/* Printed Name */}
                          <p
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onBlur={(e) => handleClChange('signatureName', e.target.innerText)}
                            className="mt-1.5 text-[11.5px] text-left font-sans"
                          >
                            {result.tailoredCoverLetter.signatureName}
                          </p>

                          {/* Enclosures */}
                          <div className="mt-8 text-[11.5px] text-left font-sans">
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

                        {/* Page Break Guide Lines */}
                        {Array.from({ length: numPages - 1 }).map((_, i) => (
                          <div
                            key={i}
                            className="absolute left-0 right-0 border-t-2 border-dashed border-rose-400 z-10 no-print flex items-center justify-between pointer-events-none select-none font-sans"
                            style={{
                              top: `${120.9 + (i + 1) * 910.9}px`,
                              margin: 0,
                              padding: '4px 8px'
                            }}
                          >
                            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded shadow-md font-bold">
                              Page {i + 1} Cutoff (A4 Height)
                            </span>
                            <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded shadow-md font-medium opacity-80">
                              Content below overflows to Page {i + 2}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl w-full max-w-lg">
              <FileText className="w-12 h-12 mb-3 text-zinc-600" />
              <h3 className="font-bold text-zinc-300 mb-1 text-md">Document Preview Engine</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Inputs are empty. Provide the job details on the left and trigger tailoring to render high-fidelity, culturally conforming documents here.
              </p>
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Floating Selection Toolbar (Self-contained to prevent page re-renders) */}
      <FloatingToolbar cvPreviewRef={cvPreviewRef} />
    </div>
  );
}

interface FloatingToolbarProps {
  cvPreviewRef: React.RefObject<HTMLDivElement | null>;
}

function FloatingToolbar({ cvPreviewRef }: FloatingToolbarProps) {
  const [selectionCoords, setSelectionCoords] = useState<{ top: number; left: number } | null>(null);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showBgColorDropdown, setShowBgColorDropdown] = useState(false);

  useEffect(() => {
    const handleSelection = () => {
      // Small timeout to let selection settle
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
          setSelectionCoords(null);
          return;
        }

        const anchorNode = selection.anchorNode;
        if (!anchorNode) return;

        let element: Node | null = anchorNode;
        let isInsideEditor = false;
        while (element) {
          if (element instanceof HTMLElement && (element.id === 'cv-sheet' || element.id === 'cl-sheet')) {
            isInsideEditor = true;
            break;
          }
          element = element.parentNode;
        }

        if (!isInsideEditor) {
          setSelectionCoords(null);
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position fixed relative to viewport to prevent viewport escaping
        const topOffset = 55;
        let computedTop = rect.top - topOffset;
        let computedLeft = rect.left + rect.width / 2;

        const toolbarWidth = 360;
        const margin = 12;
        const minLeft = toolbarWidth / 2 + margin;
        const maxLeft = window.innerWidth - toolbarWidth / 2 - margin;
        computedLeft = Math.max(minLeft, Math.min(computedLeft, maxLeft));

        const minTop = margin;
        if (computedTop < minTop) {
          // Position below selection if going off top of screen
          computedTop = rect.bottom + 10;
        }

        setSelectionCoords({
          top: computedTop,
          left: computedLeft
        });
      }, 10);
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.floating-editor-toolbar')) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionCoords(null);
        setShowColorDropdown(false);
        setShowBgColorDropdown(false);
      }
    };

    const handleScroll = () => {
      setSelectionCoords(null);
      setShowColorDropdown(false);
      setShowBgColorDropdown(false);
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);
    document.addEventListener('mousedown', handleClickOutside);

    // Find the scrollable right pane wrapper
    const rightPane = cvPreviewRef.current?.closest('.overflow-y-auto');
    if (rightPane) {
      rightPane.addEventListener('scroll', handleScroll);
    }

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
      document.removeEventListener('mousedown', handleClickOutside);
      if (rightPane) {
        rightPane.removeEventListener('scroll', handleScroll);
      }
    };
  }, [cvPreviewRef]);

  if (!selectionCoords) return null;

  return (
    <div
      className="floating-editor-toolbar fixed z-50 flex items-center gap-1 bg-zinc-900/95 border border-white/10 rounded-xl shadow-2xl p-1.5 backdrop-blur-md no-print text-zinc-300 font-sans -translate-x-1/2 transition-all duration-150 animate-in fade-in zoom-in-95"
      style={{
        top: `${selectionCoords.top}px`,
        left: `${selectionCoords.left}px`
      }}
    >
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('bold', false);
        }}
        className="p-1.5 hover:text-white rounded hover:bg-white/5 font-bold text-xs w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Bold"
      >
        <span className="font-bold">B</span>
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('italic', false);
        }}
        className="p-1.5 hover:text-white rounded hover:bg-white/5 italic text-xs w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Italic"
      >
        <span className="italic">I</span>
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('underline', false);
        }}
        className="p-1.5 hover:text-white rounded hover:bg-white/5 underline text-xs w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Underline"
      >
        <span className="underline">U</span>
      </button>

      <div className="w-px h-4 bg-white/10 mx-0.5"></div>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('insertUnorderedList', false);
        }}
        className="p-1.5 hover:text-white rounded hover:bg-white/5 w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Bullet List"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('insertOrderedList', false);
        }}
        className="p-1.5 hover:text-white rounded hover:bg-white/5 w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Numbered List"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-white/10 mx-0.5"></div>

      {/* Alignment */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('justifyLeft', false);
        }}
        className="p-1.5 hover:text-white rounded hover:bg-white/5 w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Align Left"
      >
        <AlignLeft className="w-3.5 h-3.5" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('justifyCenter', false);
        }}
        className="p-1.5 hover:text-white rounded hover:bg-white/5 w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Align Center"
      >
        <AlignCenter className="w-3.5 h-3.5" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('justifyRight', false);
        }}
        className="p-1.5 hover:text-white rounded hover:bg-white/5 w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Align Right"
      >
        <AlignRight className="w-3.5 h-3.5" />
      </button>

      <div className="w-px h-4 bg-white/10 mx-0.5"></div>

      {/* Text Color Picker */}
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            setShowColorDropdown(!showColorDropdown);
            setShowBgColorDropdown(false);
          }}
          className="p-1.5 hover:text-white rounded hover:bg-white/5 w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
          title="Text Color"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>

        {showColorDropdown && (
          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-1.5 bg-zinc-950 border border-white/10 rounded-lg p-1.5 shadow-xl">
            {[
              { label: 'Default', value: '#1f2937' },
              { label: 'Indigo', value: '#4f46e5' },
              { label: 'Emerald', value: '#10b981' },
              { label: 'Ruby', value: '#ef4444' },
              { label: 'Slate', value: '#64748b' }
            ].map((col) => (
              <button
                key={col.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand('styleWithCSS', false, 'true');
                  document.execCommand('foreColor', false, col.value);
                  setShowColorDropdown(false);
                }}
                className="w-4 h-4 rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: col.value }}
                title={col.label}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight Color Picker */}
      <div className="relative">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            setShowBgColorDropdown(!showBgColorDropdown);
            setShowColorDropdown(false);
          }}
          className="p-1.5 hover:text-white rounded hover:bg-white/5 w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
          title="Text Highlight"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>

        {showBgColorDropdown && (
          <div className="absolute bottom-9 left-1/2 -translate-x-1/2 flex gap-1.5 bg-zinc-950 border border-white/10 rounded-lg p-1.5 shadow-xl">
            {[
              { label: 'None', value: 'transparent' },
              { label: 'Yellow', value: '#fef08a' },
              { label: 'Green', value: '#bbf7d0' },
              { label: 'Blue', value: '#bfdbfe' },
              { label: 'Pink', value: '#fbcfe8' }
            ].map((col) => (
              <button
                key={col.label}
                onMouseDown={(e) => {
                  e.preventDefault();
                  document.execCommand('styleWithCSS', false, 'true');
                  document.execCommand('backColor', false, col.value);
                  setShowBgColorDropdown(false);
                }}
                className="w-4 h-4 rounded border border-white/10 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: col.value === 'transparent' ? '#ffffff' : col.value }}
                title={col.label}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-white/10 mx-0.5"></div>

      {/* Clear Formatting */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          document.execCommand('styleWithCSS', false, 'true');
          document.execCommand('removeFormat', false);
        }}
        className="p-1.5 hover:text-red-400 rounded hover:bg-white/5 w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
        title="Clear Formatting"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
