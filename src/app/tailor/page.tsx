'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Sparkles, FileText, Download, Briefcase, Award, CheckCircle2, AlertTriangle, Languages, Save, Check,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Palette, Highlighter, RotateCcw, Sliders, Coins, Plus, FolderGit,
  ChevronUp, ChevronDown, Eye, EyeOff, Wand2, RefreshCw, Target, X, GitCompare, Loader2, Layers, Trash2, Tag, ArrowUp, ArrowDown,
  Settings, CheckSquare, Square, PenTool, ChevronRight, SlidersHorizontal, PlusCircle, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { groupSkillsByCategory } from '@/lib/skills';
import { CustomSection, CustomSectionType, CustomSectionItem, CustomSectionSubgroup, createDefaultCustomSection, formatCityCountry } from '@/lib/customSections';
import { useTokens } from '@/context/TokenContext';
import { useAlertModal } from '@/context/AlertModalContext';
import SectionControlsPanel from './components/SectionControlsPanel';

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
  category?: string;
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
  projects?: any[];
  customSections?: CustomSection[];
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
  enclosure?: string;
}

interface TailorResponse {
  matchScore: number;
  gapAnalysis: {
    missingSkills: string[];
    matchingKeywords: string[];
    recommendations: string;
    exactMatches?: string[];
    adjacentMatches?: string[];
  };
  tailoredCv: TailoredCv;
  tailoredCoverLetter: TailoredCoverLetter;
  jobMetadata?: {
    techStack: string;
    mainRequirements: string;
    recruiterName: string;
    contactInfo: string;
    jobType: string;
    location: string;
    remoteOrPhysical: string;
    rawJobDescription?: string;
  };
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

interface ContentEditableProps {
  tagName: 'h1' | 'h2' | 'p' | 'span' | 'div' | 'pre';
  value: string;
  onChange: (val: string) => void;
  onBlur?: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
  isMeasurement?: boolean;
  useInnerText?: boolean;
  highlightHtml?: string;
  [key: string]: any;
}

const getCaretOffset = (element: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;
  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
};

const setCaretOffset = (element: HTMLElement, offset: number) => {
  const selection = window.getSelection();
  if (!selection) return;
  const range = document.createRange();
  let currentOffset = 0;
  let found = false;

  const traverseNodes = (node: Node) => {
    if (found) return;
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      if (currentOffset + textLength >= offset) {
        range.setStart(node, offset - currentOffset);
        range.collapse(true);
        found = true;
      } else {
        currentOffset += textLength;
      }
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverseNodes(node.childNodes[i]);
        if (found) break;
      }
    }
  };

  traverseNodes(element);
  if (found) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
};

const ContentEditable = ({
  tagName: Tag,
  value,
  onChange,
  onBlur,
  className,
  style,
  isMeasurement,
  useInnerText = false,
  highlightHtml,
  ...props
}: ContentEditableProps) => {
  const ref = useRef<HTMLElement>(null);
  const isFocusedRef = useRef(false);
  const expectedValueRef = useRef(value);

  // Initialize content on mount
  useEffect(() => {
    if (ref.current) {
      if (highlightHtml && highlightHtml !== value) {
        ref.current.innerHTML = highlightHtml;
      } else if (useInnerText) {
        ref.current.innerText = value;
      } else {
        ref.current.innerHTML = value;
      }
    }
  }, []);

  // Handle external updates & ATS highlight toggle safely without destroying caret position
  useEffect(() => {
    if (!ref.current) return;

    // Do NOT force innerHTML overwrite while user is actively typing inside this field!
    if (isFocusedRef.current || document.activeElement === ref.current) {
      return;
    }

    if (highlightHtml && highlightHtml !== value) {
      ref.current.innerHTML = highlightHtml;
      expectedValueRef.current = value;
    } else if (value !== expectedValueRef.current || !highlightHtml) {
      expectedValueRef.current = value;
      if (useInnerText) {
        ref.current.innerText = value;
      } else {
        ref.current.innerHTML = value;
      }
    }
  }, [value, highlightHtml, useInnerText]);

  const handleFocus = () => {
    isFocusedRef.current = true;
  };

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const domVal = useInnerText ? e.currentTarget.innerText : e.currentTarget.innerHTML;
    expectedValueRef.current = domVal;
    onChange(domVal);
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    isFocusedRef.current = false;
    const domVal = useInnerText ? e.currentTarget.innerText : e.currentTarget.innerHTML;
    expectedValueRef.current = domVal;

    // Re-apply ATS keyword highlights when focus leaves
    if (ref.current && highlightHtml && highlightHtml !== value) {
      ref.current.innerHTML = highlightHtml;
    }

    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <Tag
      ref={ref as any}
      contentEditable={!isMeasurement}
      suppressContentEditableWarning={true}
      onFocus={handleFocus}
      onInput={handleInput}
      onBlur={handleBlur}
      className={className}
      style={style}
      {...props}
    />
  );
};

export default function TailorWorkspace() {
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [sectionOrder, setSectionOrder] = useState<string[]>(['summary', 'work', 'education', 'projects', 'skills', 'languages']);
  const [isAdjustSpacingOpen, setIsAdjustSpacingOpen] = useState<boolean>(false);
  const { tokens, setIsTokenModalOpen, fetchTokens } = useTokens();
  const { showAlert } = useAlertModal();

  // Navigation Sub-tab inside Left Side Panel: Generation, ATS Intelligence, Customization & Spacing
  const [sidePanelTab, setSidePanelTab] = useState<'generation' | 'ats' | 'customization'>('generation');

  // Section Margins & Custom Sections State
  const [customSections, setCustomSections] = useState<CustomSection[]>([]);
  const [sectionMargins, setSectionMargins] = useState<Record<string, { top: number; bottom: number }>>({});
  const [showSignatureSection, setShowSignatureSection] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    work: true,
    education: false,
    projects: false,
    skills: false,
    signature: false
  });

  // Modals for Adding Items & Custom Sections
  const [isAddCustomSecModalOpen, setIsAddCustomSecModalOpen] = useState(false);
  const [newCustomSecTitle, setNewCustomSecTitle] = useState('');
  const [newCustomSecType, setNewCustomSecType] = useState<CustomSectionType>('bullet-list');
  const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
  const [newWorkRole, setNewWorkRole] = useState('');
  const [newWorkCompany, setNewWorkCompany] = useState('');
  const [newWorkLocation, setNewWorkLocation] = useState('');
  const [newWorkPeriod, setNewWorkPeriod] = useState('');
  const [newWorkBullets, setNewWorkBullets] = useState('');
  const [isAddEduModalOpen, setIsAddEduModalOpen] = useState(false);
  const [newEduInstitution, setNewEduInstitution] = useState('');
  const [newEduDegree, setNewEduDegree] = useState('');
  const [newEduLocation, setNewEduLocation] = useState('');
  const [newEduPeriod, setNewEduPeriod] = useState('');
  const [isAddProjModalOpen, setIsAddProjModalOpen] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');
  const [newProjUrl, setNewProjUrl] = useState('');
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('Intermediate');
  const [newSkillCategory, setNewSkillCategory] = useState('Tools');
  const [saveToVaultOnAdd, setSaveToVaultOnAdd] = useState(false);

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
  const [isNudgeEnabled, setIsNudgeEnabled] = useState<boolean>(true);

  // Project Description Polish Modal State
  const [projectPolishModal, setProjectPolishModal] = useState<{
    isOpen: boolean;
    projectIndex: number;
    originalDescription: string;
    projectName: string;
    variations: { ats: string; impact: string; concise: string } | null;
  }>({
    isOpen: false,
    projectIndex: -1,
    originalDescription: '',
    projectName: '',
    variations: null
  });
  const [projectCustomPrompt, setProjectCustomPrompt] = useState<string>('');
  const [isPolishingProject, setIsPolishingProject] = useState<boolean>(false);

  // On-Preview Section & Enhancements States
  const [hiddenSections, setHiddenSections] = useState<string[]>([]);
  const [isAtsHighlightEnabled, setIsAtsHighlightEnabled] = useState<boolean>(false);

  // Section AI Regeneration Modal State
  const [regenModal, setRegenModal] = useState<{
    isOpen: boolean;
    sectionKey: string;
    sectionTitle: string;
    currentContent: any;
  }>({
    isOpen: false,
    sectionKey: '',
    sectionTitle: '',
    currentContent: null
  });
  const [selectedPresetChip, setSelectedPresetChip] = useState<string | null>(null);
  const [customRegenInstruction, setCustomRegenInstruction] = useState<string>('');
  const [isRegeneratingSection, setIsRegeneratingSection] = useState<boolean>(false);

  // Bullet Polish Modal State
  const [bulletPolishModal, setBulletPolishModal] = useState<{
    isOpen: boolean;
    expIndex: number;
    bulletIndex: number;
    originalBullet: string;
    variations: { star: string; punchy: string; ats: string } | null;
  }>({
    isOpen: false,
    expIndex: -1,
    bulletIndex: -1,
    originalBullet: '',
    variations: null
  });
  const [isPolishingBullet, setIsPolishingBullet] = useState<boolean>(false);

  // Cover Letter Paragraph Polish Modal State
  const [clPolishModal, setClPolishModal] = useState<{
    isOpen: boolean;
    paraIndex: number;
    originalPara: string;
    variations: { persuasive: string; formal: string; concise: string } | null;
  }>({
    isOpen: false,
    paraIndex: -1,
    originalPara: '',
    variations: null
  });
  const [clCustomPrompt, setClCustomPrompt] = useState<string>('');
  const [isPolishingClPara, setIsPolishingClPara] = useState<boolean>(false);

  // Compare Original vs Tailored Modal State
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  const handleInjectMissingSkill = (skillName: string) => {
    if (!result) return;
    setResult((prev: any) => {
      if (!prev) return prev;
      const currentSkills = prev.tailoredCv.skills || [];
      const exists = currentSkills.some((s: any) => s.name.toLowerCase() === skillName.toLowerCase());
      const updatedSkills = exists
        ? currentSkills
        : [...currentSkills, { name: skillName, level: 'Intermediate', category: 'General' }];

      const gap = prev.gapAnalysis || {};
      const updatedMissing = (gap.missingSkills || []).filter((s: string) => s.toLowerCase() !== skillName.toLowerCase());
      const updatedExacts = Array.from(new Set([...(gap.exactMatches || gap.matchingKeywords || []), skillName]));

      return {
        ...prev,
        gapAnalysis: {
          ...gap,
          missingSkills: updatedMissing,
          exactMatches: updatedExacts,
          matchingKeywords: updatedExacts
        },
        tailoredCv: {
          ...prev.tailoredCv,
          skills: updatedSkills
        }
      };
    });

    showAlert({ title: 'Keyword Injected', message: `Skill '${skillName}' injected into CV Skills & marked as matched!`, type: 'success' });
  };

  const handleFetchClParagraphVariations = async (paraIndex: number, originalPara: string) => {
    setClPolishModal({
      isOpen: true,
      paraIndex,
      originalPara,
      variations: null
    });
    setIsPolishingClPara(true);
    try {
      const res = await fetch('/api/tailor/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'coverLetter',
          mode: 'cl-paragraph',
          targetLanguage: clLanguage,
          jobDescription,
          profile,
          currentContent: { paragraph: originalPara },
          customInstruction: clCustomPrompt,
          tone
        })
      });
      const data = await res.json();
      if (res.ok && data.data?.variations) {
        setClPolishModal(prev => ({ ...prev, variations: data.data.variations }));
        fetchTokens();
      } else {
        showAlert({ title: 'Paragraph Polish', message: data.error || 'Failed to polish paragraph', type: 'error' });
      }
    } catch (err) {
      showAlert({ title: 'Paragraph Polish', message: 'Error generating paragraph variations.', type: 'error' });
    } finally {
      setIsPolishingClPara(false);
    }
  };

  const handleApplyClParagraphVariation = (newParaText: string) => {
    const { paraIndex } = clPolishModal;
    if (paraIndex < 0 || !result) return;
    handleClParagraphChange(paraIndex, newParaText);
    showAlert({ title: 'Paragraph Polish', message: 'Cover Letter paragraph updated successfully!', type: 'success' });
    setClPolishModal({ isOpen: false, paraIndex: -1, originalPara: '', variations: null });
  };

  const handleMoveProject = (projIdx: number, direction: 'up' | 'down') => {
    if (!result || !result.tailoredCv.projects) return;
    const targetIdx = direction === 'up' ? projIdx - 1 : projIdx + 1;
    if (targetIdx < 0 || targetIdx >= result.tailoredCv.projects.length) return;

    const newProjects = [...result.tailoredCv.projects];
    const temp = newProjects[projIdx];
    newProjects[projIdx] = newProjects[targetIdx];
    newProjects[targetIdx] = temp;

    setResult(prev => {
      if (!prev) return null;
      return {
        ...prev,
        tailoredCv: {
          ...prev.tailoredCv,
          projects: newProjects
        }
      };
    });
  };

  const handleFetchProjectVariations = async (projectIndex: number, originalDescription: string, projectName: string) => {
    setProjectPolishModal({
      isOpen: true,
      projectIndex,
      originalDescription,
      projectName,
      variations: null
    });
    setIsPolishingProject(true);
    try {
      const res = await fetch('/api/tailor/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'projects',
          mode: 'project',
          targetLanguage: cvLanguage,
          jobDescription,
          profile,
          currentContent: { project: originalDescription },
          userInstruction: projectCustomPrompt,
          tone
        })
      });
      const data = await res.json();
      if (res.ok && data.data?.variations) {
        setProjectPolishModal(prev => ({ ...prev, variations: data.data.variations }));
        fetchTokens();
      } else {
        showAlert({ title: 'Project Polish', message: data.error || 'Failed to polish project description', type: 'error' });
      }
    } catch (err) {
      showAlert({ title: 'Project Polish', message: 'Error generating project variations.', type: 'error' });
    } finally {
      setIsPolishingProject(false);
    }
  };

  const handleApplyProjectVariation = (newDescText: string) => {
    const { projectIndex } = projectPolishModal;
    if (projectIndex < 0 || !result) return;
    handleProjectChange(projectIndex, 'description', newDescText);
    showAlert({ title: 'Project Polish', message: 'Project description updated successfully!', type: 'success' });
    setProjectPolishModal({ isOpen: false, projectIndex: -1, originalDescription: '', projectName: '', variations: null });
  };

  const getAtsMatchStats = () => {
    if (!result?.gapAnalysis) return null;
    const gap = result.gapAnalysis;
    const exacts = (gap.exactMatches?.length ?? gap.matchingKeywords?.length) || 0;
    const adjacents = gap.adjacentMatches?.length || 0;
    const missing = gap.missingSkills?.length || 0;
    const total = exacts + adjacents + missing;
    if (total === 0) return null;
    const matched = exacts + adjacents;
    const percentage = Math.round((matched / total) * 100);
    return { exacts, adjacents, missing, total, matched, percentage };
  };

  const getHighlightedHtml = (text: string) => {
    if (!isAtsHighlightEnabled || !result?.gapAnalysis || !text) return text;

    const exacts = result.gapAnalysis.exactMatches || result.gapAnalysis.matchingKeywords || [];
    const adjacents = result.gapAnalysis.adjacentMatches || [];
    const keywords = Array.from(new Set([...exacts, ...adjacents])).filter(k => k && k.length >= 2);

    if (keywords.length === 0) return text;

    const escaped = keywords
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .sort((a, b) => b.length - a.length);

    const regex = new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');

    return text.replace(regex, (matched) => {
      const lower = matched.toLowerCase();
      const isExact = exacts.some(e => e.toLowerCase() === lower);
      if (isExact) {
        return `<mark style="background-color: rgba(16, 185, 129, 0.28); color: #064e3b; font-weight: 700; padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(16, 185, 129, 0.5);">${matched}</mark>`;
      }
      return `<mark style="background-color: rgba(99, 102, 241, 0.28); color: #1e1b4b; font-weight: 700; padding: 1px 4px; border-radius: 4px; border: 1px solid rgba(99, 102, 241, 0.5);">${matched}</mark>`;
    });
  };

  const handleMoveSection = (sectionKey: string, direction: 'up' | 'down') => {
    const idx = sectionOrder.indexOf(sectionKey);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectionOrder.length) return;

    const newOrder = [...sectionOrder];
    const temp = newOrder[idx];
    newOrder[idx] = newOrder[targetIdx];
    newOrder[targetIdx] = temp;
    setSectionOrder(newOrder);
  };

  const handleToggleHideSection = (sectionKey: string) => {
    setHiddenSections((prev) =>
      prev.includes(sectionKey) ? prev.filter((s) => s !== sectionKey) : [...prev, sectionKey]
    );
  };

  const handleOpenRegenModal = (sectionKey: string, sectionTitle: string, currentContent: any) => {
    setRegenModal({
      isOpen: true,
      sectionKey,
      sectionTitle,
      currentContent
    });
    setSelectedPresetChip(null);
    setCustomRegenInstruction('');
  };

  const handleExecuteSectionRegen = async () => {
    if (!regenModal.sectionKey || !result) return;
    setIsRegeneratingSection(true);
    try {
      const instruction = [selectedPresetChip, customRegenInstruction].filter(Boolean).join('. ');
      const res = await fetch('/api/tailor/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: regenModal.sectionKey,
          mode: 'section',
          targetLanguage: previewTab === 'coverLetter' ? clLanguage : cvLanguage,
          jobDescription: jobDescription || result?.jobMetadata?.rawJobDescription || '',
          profile,
          currentContent: regenModal.currentContent,
          userInstruction: instruction,
          tone,
          bulletStyle,
          signingLocation
        })
      });

      const data = await res.json();
      if (!res.ok) {
        showAlert({ title: 'Section Regeneration', message: data.error || 'Failed to regenerate section', type: 'error' });
        return;
      }

      if (data.data) {
        setResult((prev: any) => {
          if (!prev) return prev;
          const newResult = { ...prev };
          if (regenModal.sectionKey === 'summary' && data.data.summary) {
            newResult.tailoredCv = { ...newResult.tailoredCv, summary: data.data.summary };
          } else if (regenModal.sectionKey === 'work' && data.data.workExperience) {
            newResult.tailoredCv = { ...newResult.tailoredCv, workExperience: data.data.workExperience };
          } else if (regenModal.sectionKey === 'projects' && data.data.projects) {
            newResult.tailoredCv = { ...newResult.tailoredCv, projects: data.data.projects };
          } else if (regenModal.sectionKey === 'skills' && data.data.skills) {
            newResult.tailoredCv = { ...newResult.tailoredCv, skills: data.data.skills };
          } else if (regenModal.sectionKey === 'education' && data.data.education) {
            newResult.tailoredCv = { ...newResult.tailoredCv, education: data.data.education };
          } else if (regenModal.sectionKey === 'coverLetter' && data.data.tailoredCoverLetter) {
            newResult.tailoredCoverLetter = data.data.tailoredCoverLetter;
          }
          return newResult;
        });
        fetchTokens();
        showAlert({ title: 'Section Regeneration', message: `Section '${regenModal.sectionTitle}' regenerated successfully!`, type: 'success' });
        setRegenModal({ isOpen: false, sectionKey: '', sectionTitle: '', currentContent: null });
      }
    } catch (err) {
      showAlert({ title: 'Section Regeneration', message: 'Error occurred while regenerating section.', type: 'error' });
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  const handleFetchBulletVariations = async (expIndex: number, bulletIndex: number, originalBullet: string) => {
    setBulletPolishModal({
      isOpen: true,
      expIndex,
      bulletIndex,
      originalBullet,
      variations: null
    });
    setIsPolishingBullet(true);
    try {
      const res = await fetch('/api/tailor/section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: 'bullet',
          mode: 'bullet',
          targetLanguage: cvLanguage,
          jobDescription,
          profile,
          currentContent: { bullet: originalBullet },
          tone,
          bulletStyle
        })
      });
      const data = await res.json();
      if (res.ok && data.data?.variations) {
        setBulletPolishModal((prev) => ({ ...prev, variations: data.data.variations }));
        fetchTokens();
      } else {
        showAlert({ title: 'Bullet Polish', message: data.error || 'Failed to polish bullet point', type: 'error' });
      }
    } catch (err) {
      showAlert({ title: 'Bullet Polish', message: 'Error generating bullet variations.', type: 'error' });
    } finally {
      setIsPolishingBullet(false);
    }
  };

  const handleApplyBulletVariation = (newBulletText: string) => {
    const { expIndex, bulletIndex } = bulletPolishModal;
    if (expIndex < 0 || bulletIndex < 0 || !result) return;

    setResult((prev: any) => {
      if (!prev) return prev;
      const newWork = [...prev.tailoredCv.workExperience];
      const exp = { ...newWork[expIndex] };
      const styleKey = bulletStyle === 'STAR Method' ? 'star' : bulletStyle === 'Short & Punchy' ? 'punchy' : 'standard';

      if (Array.isArray(exp.bullets)) {
        const updatedBullets = [...exp.bullets];
        updatedBullets[bulletIndex] = newBulletText;
        exp.bullets = updatedBullets;
      } else if (exp.bullets && typeof exp.bullets === 'object') {
        const currentList = exp.bullets[styleKey] || exp.bullets.standard || [];
        const updatedList = [...currentList];
        updatedList[bulletIndex] = newBulletText;
        exp.bullets = { ...exp.bullets, [styleKey]: updatedList };
      }
      newWork[expIndex] = exp;
      return { ...prev, tailoredCv: { ...prev.tailoredCv, workExperience: newWork } };
    });

    showAlert({ title: 'Bullet Polish', message: 'Bullet point updated successfully!', type: 'success' });
    setBulletPolishModal({ isOpen: false, expIndex: -1, bulletIndex: -1, originalBullet: '', variations: null });
  };

  const getRenderedBullets = (exp: any, style: string, length: string, isFirst = false): string[] => {
    if (!exp || !exp.bullets) return [];
    if (Array.isArray(exp.bullets)) return exp.bullets;
    if (typeof exp.bullets === 'object') {
      const styleKey = style === 'STAR Method' ? 'star' : style === 'Short & Punchy' ? 'punchy' : 'standard';
      const list = exp.bullets[styleKey] || exp.bullets.standard || Object.values(exp.bullets)[0];
      if (Array.isArray(list)) return list;
    }
    return [];
  };

  const handleAddWorkExperienceBullet = (expIndex: number) => {
    setResult((prev: any) => {
      if (!prev) return prev;
      const newWork = [...prev.tailoredCv.workExperience];
      const exp = { ...newWork[expIndex] };
      const styleKey = bulletStyle === 'STAR Method' ? 'star' : bulletStyle === 'Short & Punchy' ? 'punchy' : 'standard';

      const newBulletText = cvLanguage === 'DE'
        ? 'Neue Leistung oder Verantwortlichkeit hier eingeben...'
        : 'Enter new key achievement or responsibility here...';

      if (Array.isArray(exp.bullets)) {
        exp.bullets = [...exp.bullets, newBulletText];
      } else if (exp.bullets && typeof exp.bullets === 'object') {
        const currentList = exp.bullets[styleKey] || exp.bullets.standard || [];
        const updatedList = [...currentList, newBulletText];
        exp.bullets = {
          ...exp.bullets,
          [styleKey]: updatedList,
          standard: exp.bullets.standard ? [...exp.bullets.standard, newBulletText] : updatedList
        };
      } else {
        exp.bullets = [newBulletText];
      }
      newWork[expIndex] = exp;
      return { ...prev, tailoredCv: { ...prev.tailoredCv, workExperience: newWork } };
    });
  };

  const handleDeleteWorkExperienceBullet = (expIndex: number, bulletIndex: number) => {
    setResult((prev: any) => {
      if (!prev) return prev;
      const newWork = [...prev.tailoredCv.workExperience];
      const exp = { ...newWork[expIndex] };
      const styleKey = bulletStyle === 'STAR Method' ? 'star' : bulletStyle === 'Short & Punchy' ? 'punchy' : 'standard';

      if (Array.isArray(exp.bullets)) {
        exp.bullets = exp.bullets.filter((_: any, bIdx: number) => bIdx !== bulletIndex);
      } else if (exp.bullets && typeof exp.bullets === 'object') {
        const currentList = exp.bullets[styleKey] || exp.bullets.standard || [];
        const updatedList = currentList.filter((_: any, bIdx: number) => bIdx !== bulletIndex);
        exp.bullets = { ...exp.bullets, [styleKey]: updatedList };
      }
      newWork[expIndex] = exp;
      return { ...prev, tailoredCv: { ...prev.tailoredCv, workExperience: newWork } };
    });
  };

  // Custom Skill Add & Confirmation Modal States
  const [skillModal, setSkillModal] = useState<{
    isOpen: boolean;
    skillName: string;
    isGap: boolean;
    alsoSaveToProfile: boolean;
  }>({
    isOpen: false,
    skillName: '',
    isGap: false,
    alsoSaveToProfile: true
  });
  const [isAddingCustomSkill, setIsAddingCustomSkill] = useState(false);
  const [customSkillInput, setCustomSkillInput] = useState('');

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
  const [skillsLayout, setSkillsLayout] = useState<'level' | 'category'>('category');
  const [themeDirective, setThemeDirective] = useState('');

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
  const [showSignatureImage, setShowSignatureImage] = useState(true);

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
  const [result, rawSetResult] = useState<TailorResponse | null>(null);
  const [history, setHistory] = useState<TailorResponse[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const updateResultRealtime = (newResult: TailorResponse) => {
    rawSetResult(newResult);

    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
    }
    historyDebounceRef.current = setTimeout(() => {
      setHistory(prev => {
        const activeHistory = prev.slice(0, historyIndex + 1);
        const lastState = activeHistory[activeHistory.length - 1];
        if (lastState && JSON.stringify(lastState) === JSON.stringify(newResult)) {
          return prev;
        }
        return [...activeHistory, newResult];
      });
      setHistoryIndex(prev => prev + 1);
    }, 1200);
  };

  const setResult = (
    newResult: TailorResponse | null | ((prev: TailorResponse | null) => TailorResponse | null),
    skipHistory = false
  ) => {
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }

    if (typeof newResult === 'function') {
      rawSetResult(prev => {
        const computed = newResult(prev);
        if (!computed) {
          if (!skipHistory) {
            setHistory([]);
            setHistoryIndex(-1);
          }
          return null;
        }
        if (!skipHistory) {
          setHistory(hPrev => {
            const activeHistory = hPrev.slice(0, historyIndex + 1);
            const lastState = activeHistory[activeHistory.length - 1];
            if (lastState && JSON.stringify(lastState) === JSON.stringify(computed)) {
              return hPrev;
            }
            return [...activeHistory, computed];
          });
          setHistoryIndex(hPrev => hPrev + 1);
        }
        return computed;
      });
      return;
    }

    rawSetResult(newResult);
    if (!newResult) {
      if (!skipHistory) {
        setHistory([]);
        setHistoryIndex(-1);
      }
      return;
    }
    if (!skipHistory) {
      setHistory(prev => {
        const activeHistory = prev.slice(0, historyIndex + 1);
        const lastState = activeHistory[activeHistory.length - 1];
        if (lastState && JSON.stringify(lastState) === JSON.stringify(newResult)) {
          return prev;
        }
        return [...activeHistory, newResult];
      });
      setHistoryIndex(prev => prev + 1);
    }
  };

  const handleUndo = () => {
    setHistoryIndex(prevIndex => {
      if (prevIndex > 0) {
        const nextIndex = prevIndex - 1;
        rawSetResult(history[nextIndex]);
        return nextIndex;
      }
      return prevIndex;
    });
  };

  const handleRedo = () => {
    setHistoryIndex(prevIndex => {
      if (prevIndex < history.length - 1) {
        const nextIndex = prevIndex + 1;
        rawSetResult(history[nextIndex]);
        return nextIndex;
      }
      return prevIndex;
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';

      const activeEl = document.activeElement;
      const isInsidePreview = activeEl && (
        activeEl.closest('#cv-sheet') ||
        activeEl.closest('#cl-sheet') ||
        activeEl.closest('#cv-measurement-root')
      );

      if (!isInsidePreview) return;

      if ((e.ctrlKey || e.metaKey) && isZ && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && isY) ||
        ((e.ctrlKey || e.metaKey) && isZ && e.shiftKey)
      ) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [history, historyIndex]);

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

    sectionOrder.forEach((section) => {
      if (hiddenSections.includes(section)) return;

      if (section === 'summary' && result.tailoredCv.summary) {
        orderedBlocks.push('summary');
      }
      else if (section === 'work' && result.tailoredCv.workExperience && result.tailoredCv.workExperience.length > 0) {
        orderedBlocks.push('work-history-header');
        result.tailoredCv.workExperience.forEach((_, idx) => {
          orderedBlocks.push(`work-exp-${idx}`);
        });
      }
      else if (section === 'education' && result.tailoredCv.education && result.tailoredCv.education.length > 0) {
        orderedBlocks.push('education-header');
        result.tailoredCv.education.forEach((_, idx) => {
          orderedBlocks.push(`edu-${idx}`);
        });
      }
      else if (section === 'projects' && result.tailoredCv.projects && result.tailoredCv.projects.length > 0) {
        const activeProjs = result.tailoredCv.projects
          .map((p: any, idx: number) => ({ p, idx }))
          .filter(({ p }: any) => selectedProjects.length === 0 || selectedProjects.includes(p.name));

        if (activeProjs.length > 0) {
          orderedBlocks.push('projects-header');
          activeProjs.forEach(({ idx }: any) => {
            orderedBlocks.push(`project-${idx}`);
          });
        }
      }
      else if (section === 'skills' && result.tailoredCv.skills && result.tailoredCv.skills.length > 0) {
        orderedBlocks.push('skills');
      }
      else if (section === 'languages' && result.tailoredCv.languages && result.tailoredCv.languages.length > 0) {
        orderedBlocks.push('languages');
      }
      else if (section.startsWith('custom-')) {
        const customId = section.replace('custom-', '');
        const cSec = (customSections || []).find(c => c.id === customId || `custom-${c.id}` === section) ||
          (result.tailoredCv?.customSections || []).find((c: any) => c.id === customId || `custom-${c.id}` === section);
        if (cSec) {
          orderedBlocks.push(`custom-sec-${cSec.id}`);
        }
      }
    });

    if (showSignatureSection && !hiddenSections.includes('signature')) {
      orderedBlocks.push('signature');
    }
    return orderedBlocks;
  };

  const getFirstSectionWithData = () => {
    if (!result) return '';
    for (const section of sectionOrder) {
      if (hiddenSections.includes(section)) continue;
      if (section === 'summary' && result.tailoredCv.summary) return 'summary';
      if (section === 'work' && result.tailoredCv.workExperience && result.tailoredCv.workExperience.length > 0) return 'work-history-header';
      if (section === 'education' && result.tailoredCv.education && result.tailoredCv.education.length > 0) return 'education-header';
      if (section === 'projects' && result.tailoredCv.projects && result.tailoredCv.projects.length > 0) return 'projects-header';
      if (section === 'skills' && result.tailoredCv.skills && result.tailoredCv.skills.length > 0) return 'skills';
      if (section === 'languages' && result.tailoredCv.languages && result.tailoredCv.languages.length > 0) return 'languages';
      if (section.startsWith('custom-')) return `custom-sec-${section.replace('custom-', '')}`;
    }
    return '';
  };

  const renderSectionHeaderControls = (sectionKey: string, sectionTitle: string, currentContent: any) => {
    const idx = sectionOrder.indexOf(sectionKey);
    const isHidden = hiddenSections.includes(sectionKey);

    return (
      <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 flex items-center gap-1 bg-zinc-900/95 border border-zinc-700/80 rounded-lg p-1 text-[11px] shadow-xl backdrop-blur-md z-30 font-sans no-print">
        <button
          disabled={idx <= 0}
          onClick={(e) => {
            e.stopPropagation();
            handleMoveSection(sectionKey, 'up');
          }}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
          title="Move Section Up"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <button
          disabled={idx === -1 || idx >= sectionOrder.length - 1}
          onClick={(e) => {
            e.stopPropagation();
            handleMoveSection(sectionKey, 'down');
          }}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
          title="Move Section Down"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleHideSection(sectionKey);
          }}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-300 hover:text-white cursor-pointer transition-colors"
          title={isHidden ? "Unhide Section" : "Hide Section"}
        >
          {isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5 text-zinc-300" />}
        </button>

        <div className="w-[1px] h-3.5 bg-zinc-800 mx-0.5" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenRegenModal(sectionKey, sectionTitle, currentContent);
          }}
          className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded text-white font-medium cursor-pointer transition-all text-[10px]"
          title="Regenerate Section with AI"
        >
          <Sparkles className="w-3 h-3 text-indigo-200 animate-pulse" />
          <span>Regen AI</span>
        </button>
      </div>
    );
  };

  const renderBlock = (blockId: string, isMeasurement: boolean) => {
    if (!result) return null;
    const isFirstSection = getFirstSectionWithData() === blockId;

    if (blockId === 'personal-header') {
      if (isAtsMode) {
        return (
          <div key={blockId} data-block-id={blockId} className="flex flex-col items-start w-full animate-none" style={{ marginBottom: `${bulletSpacing}px` }}>
            <ContentEditable
              tagName="h1"
              value={result.tailoredCv.personalDetails.fullName}
              onChange={(val) => handleCvDetailsChange('fullName', val, true)}
              onBlur={(e: any) => handleCvDetailsChange('fullName', e.target.innerText, false)}
              useInnerText={true}
              isMeasurement={isMeasurement}
              className="text-[24px] font-bold text-gray-800 leading-tight text-left focus:outline-none"
            />
            <ContentEditable
              tagName="p"
              value={result.tailoredCv.personalDetails.occupation || roleName || 'Professional'}
              onChange={(val) => handleCvDetailsChange('occupation', val, true)}
              onBlur={(e: any) => handleCvDetailsChange('occupation', e.target.innerText, false)}
              useInnerText={true}
              isMeasurement={isMeasurement}
              className="text-[#2980B9] text-[13px] font-medium mt-0.5 text-left font-sans cursor-pointer focus:outline-none"
            />
          </div>
        );
      }

      return (
        <div key={blockId} data-block-id={blockId} className="flex justify-between items-start w-full" style={{ marginBottom: `${bulletSpacing}px` }}>
          <div>
            <ContentEditable
              tagName="h1"
              value={result.tailoredCv.personalDetails.fullName}
              onChange={(val) => handleCvDetailsChange('fullName', val, true)}
              onBlur={(e: any) => handleCvDetailsChange('fullName', e.target.innerText, false)}
              useInnerText={true}
              isMeasurement={isMeasurement}
              className="text-[24px] font-bold text-gray-800 leading-tight text-left focus:outline-none"
            />
            <ContentEditable
              tagName="p"
              value={result.tailoredCv.personalDetails.occupation || roleName || 'Professional'}
              onChange={(val) => handleCvDetailsChange('occupation', val, true)}
              onBlur={(e: any) => handleCvDetailsChange('occupation', e.target.innerText, false)}
              useInnerText={true}
              isMeasurement={isMeasurement}
              className="text-[#2980B9] text-[13px] font-medium mt-0.5 text-left font-sans cursor-pointer focus:outline-none"
            />
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
            <ContentEditable
              tagName="span"
              value={formatCityCountry(result.tailoredCv.personalDetails.address || '')}
              onChange={(val) => handleCvDetailsChange('address', val, true)}
              onBlur={(e: any) => handleCvDetailsChange('address', e.target.innerText, false)}
              useInnerText={true}
              isMeasurement={isMeasurement}
              className="focus:outline-none"
            />
          </p>
          <p className="flex items-center gap-1.5 overflow-hidden">
            <span className="font-semibold font-sans">Phone:</span>{' '}
            <ContentEditable
              tagName="span"
              value={result.tailoredCv.personalDetails.phone || ''}
              onChange={(val) => handleCvDetailsChange('phone', val, true)}
              onBlur={(e: any) => handleCvDetailsChange('phone', e.target.innerText, false)}
              useInnerText={true}
              isMeasurement={isMeasurement}
              className="focus:outline-none truncate"
            />
            {!isMeasurement && result.tailoredCv.personalDetails.phone && (
              <a
                href={`tel:${(result.tailoredCv.personalDetails.phone || '').replace(/\s+/g, '')}`}
                className="text-gray-400 hover:text-indigo-600 no-print transition-colors shrink-0"
                title="Call Phone Number"
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </p>
          <p className="flex items-center gap-1.5 overflow-hidden">
            <span className="font-semibold font-sans">Email:</span>{' '}
            <ContentEditable
              tagName="span"
              value={result.tailoredCv.personalDetails.email || ''}
              onChange={(val) => handleCvDetailsChange('email', val, true)}
              onBlur={(e: any) => handleCvDetailsChange('email', e.target.innerText, false)}
              useInnerText={true}
              isMeasurement={isMeasurement}
              className="focus:outline-none truncate"
            />
            {!isMeasurement && result.tailoredCv.personalDetails.email && (
              <a
                href={`mailto:${result.tailoredCv.personalDetails.email}`}
                className="text-gray-400 hover:text-indigo-600 no-print transition-colors shrink-0"
                title="Send Email"
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </p>

          {cvLanguage === 'DE' ? (
            <>
              {result.tailoredCv.personalDetails.dateOfBirth && (
                <p>
                  <span className="font-semibold font-sans">Geburtsdatum:</span>{' '}
                  <ContentEditable
                    tagName="span"
                    value={result.tailoredCv.personalDetails.dateOfBirth}
                    onChange={(val) => handleCvDetailsChange('dateOfBirth', val, true)}
                    onBlur={(e: any) => handleCvDetailsChange('dateOfBirth', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
                </p>
              )}
              {result.tailoredCv.personalDetails.birthplace && (
                <p>
                  <span className="font-semibold font-sans">Geburtsort:</span>{' '}
                  <ContentEditable
                    tagName="span"
                    value={result.tailoredCv.personalDetails.birthplace}
                    onChange={(val) => handleCvDetailsChange('birthplace', val, true)}
                    onBlur={(e: any) => handleCvDetailsChange('birthplace', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
                </p>
              )}
              {result.tailoredCv.personalDetails.nationality && (
                <p>
                  <span className="font-semibold font-sans">Staatsangehörigkeit:</span>{' '}
                  <ContentEditable
                    tagName="span"
                    value={result.tailoredCv.personalDetails.nationality}
                    onChange={(val) => handleCvDetailsChange('nationality', val, true)}
                    onBlur={(e: any) => handleCvDetailsChange('nationality', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
                </p>
              )}
            </>
          ) : (
            <>
              {result.tailoredCv.personalDetails.dateOfBirth && (
                <p>
                  <span className="font-semibold font-sans">Date of birth:</span>{' '}
                  <ContentEditable
                    tagName="span"
                    value={result.tailoredCv.personalDetails.dateOfBirth}
                    onChange={(val) => handleCvDetailsChange('dateOfBirth', val, true)}
                    onBlur={(e: any) => handleCvDetailsChange('dateOfBirth', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
                </p>
              )}
              {result.tailoredCv.personalDetails.nationality && (
                <p>
                  <span className="font-semibold font-sans">Nationality:</span>{' '}
                  <ContentEditable
                    tagName="span"
                    value={result.tailoredCv.personalDetails.nationality}
                    onChange={(val) => handleCvDetailsChange('nationality', val, true)}
                    onBlur={(e: any) => handleCvDetailsChange('nationality', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
                </p>
              )}
            </>
          )}

          {result.tailoredCv.personalDetails.linkedin && (
            <p className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-semibold font-sans">LinkedIn:</span>{' '}
              <ContentEditable
                tagName="span"
                value={result.tailoredCv.personalDetails.linkedin}
                onChange={(val) => handleCvDetailsChange('linkedin', val, true)}
                onBlur={(e: any) => handleCvDetailsChange('linkedin', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none truncate"
              />
              {!isMeasurement && (
                <a
                  href={result.tailoredCv.personalDetails.linkedin.startsWith('http') ? result.tailoredCv.personalDetails.linkedin : `https://${result.tailoredCv.personalDetails.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 no-print transition-colors shrink-0"
                  title="Open LinkedIn Profile"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </p>
          )}
          {result.tailoredCv.personalDetails.website && (
            <p className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-semibold font-sans">Website:</span>{' '}
              <ContentEditable
                tagName="span"
                value={result.tailoredCv.personalDetails.website}
                onChange={(val) => handleCvDetailsChange('website', val, true)}
                onBlur={(e: any) => handleCvDetailsChange('website', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none truncate"
              />
              {!isMeasurement && (
                <a
                  href={result.tailoredCv.personalDetails.website.startsWith('http') ? result.tailoredCv.personalDetails.website : `https://${result.tailoredCv.personalDetails.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 no-print transition-colors shrink-0"
                  title="Open Personal Website"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </p>
          )}
          {result.tailoredCv.personalDetails.github && (
            <p className="flex items-center gap-1.5 overflow-hidden">
              <span className="font-semibold font-sans">Github:</span>{' '}
              <ContentEditable
                tagName="span"
                value={result.tailoredCv.personalDetails.github}
                onChange={(val) => handleCvDetailsChange('github', val, true)}
                onBlur={(e: any) => handleCvDetailsChange('github', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none truncate"
              />
              {!isMeasurement && (
                <a
                  href={result.tailoredCv.personalDetails.github.startsWith('http') ? result.tailoredCv.personalDetails.github : `https://${result.tailoredCv.personalDetails.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-indigo-600 no-print transition-colors shrink-0"
                  title="Open GitHub Profile"
                >
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </p>
          )}
        </div>
      );
    }

    if (blockId === 'summary') {
      return (
        <div key={blockId} data-block-id={blockId} className="w-full text-left group relative">
          {!isMeasurement && renderSectionHeaderControls('summary', cvLanguage === 'DE' ? 'Berufliches Profil' : 'Professional Profile', result.tailoredCv.summary)}
          {(() => {
            const title = cvLanguage === 'DE' ? 'Berufliches Profil' : 'Professional Profile';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <div
                className="text-left animate-none"
                style={{
                  marginTop: `${isFirstSection ? 0 : sectionSpacing * 0.4}px`,
                  marginBottom: `${sectionSpacing * 0.3}px`
                }}
              >
                <h2 className="text-[15px] font-bold uppercase">
                  <span className="text-gray-800">{first}</span>
                  {rest && <span className="text-[#2980B9]">&nbsp;{rest}</span>}
                </h2>
                <div className="border-b border-[#CBD5E1] mt-1" />
              </div>
            );
          })()}
          <ContentEditable
            tagName="p"
            value={result.tailoredCv.summary}
            onChange={(val) => handleCvSummaryChange(val, true)}
            onBlur={(e: any) => handleCvSummaryChange(e.target.innerHTML, false)}
            isMeasurement={isMeasurement}
            highlightHtml={isAtsHighlightEnabled ? getHighlightedHtml(result.tailoredCv.summary) : undefined}
            className="text-gray-700 text-left font-sans focus:outline-none"
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.55
            }}
          />
        </div>
      );
    }

    if (blockId === 'work-history-header') {
      return (
        <div
          key={blockId}
          data-block-id={blockId}
          className="text-left w-full group relative"
          style={{
            marginTop: `${isFirstSection ? 0 : sectionSpacing * 0.4}px`,
            marginBottom: `${sectionSpacing * 0.2}px`
          }}
        >
          {!isMeasurement && renderSectionHeaderControls('work', cvLanguage === 'DE' ? 'Berufserfahrung' : 'Work History', result.tailoredCv.workExperience)}
          {(() => {
            const title = cvLanguage === 'DE' ? 'Berufserfahrung' : 'Work History';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <>
                <h2 className="text-[15px] font-bold uppercase">
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
            className="w-full text-left font-sans flex flex-col group/workitem relative"
            style={{ marginBottom: `${bulletSpacing * 1.5}px` }}
          >
            <p
              className="font-bold text-gray-500"
              style={{ fontSize: `${fontSize - 0.5}px`, marginBottom: '2px' }}
            >
              <ContentEditable
                tagName="span"
                value={exp.period}
                onChange={(val) => handleWorkExperienceChange(idx, 'period', val, true)}
                onBlur={(e: any) => handleWorkExperienceChange(idx, 'period', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none font-semibold"
              />
            </p>
            <p
              className="font-semibold text-[#2980B9]"
              style={{ fontSize: `${fontSize + 0.5}px` }}
            >
              <ContentEditable
                tagName="span"
                value={exp.role}
                onChange={(val) => handleWorkExperienceChange(idx, 'role', val, true)}
                onBlur={(e: any) => handleWorkExperienceChange(idx, 'role', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none"
              />
            </p>
            <p
              className="text-gray-600 font-medium"
              style={{ fontSize: `${fontSize - 0.5}px` }}
            >
              <ContentEditable
                tagName="span"
                value={exp.company}
                onChange={(val) => handleWorkExperienceChange(idx, 'company', val, true)}
                onBlur={(e: any) => handleWorkExperienceChange(idx, 'company', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none font-semibold"
              />
              {exp.location && (
                <>
                  {' – '}
                  <ContentEditable
                    tagName="span"
                    value={exp.location}
                    onChange={(val) => handleWorkExperienceChange(idx, 'location', val, true)}
                    onBlur={(e: any) => handleWorkExperienceChange(idx, 'location', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
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
                  <ContentEditable
                    tagName="span"
                    value={b}
                    onChange={(val) => handleWorkExperienceBulletChange(idx, bIdx, val, true)}
                    onBlur={(e: any) => handleWorkExperienceBulletChange(idx, bIdx, e.target.innerHTML, false)}
                    isMeasurement={isMeasurement}
                    highlightHtml={isAtsHighlightEnabled ? getHighlightedHtml(b) : undefined}
                    className="focus:outline-none flex-1"
                  />
                  {!isMeasurement && (
                    <div className="no-print opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-1.5 shrink-0 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleFetchBulletVariations(idx, bIdx, b)}
                        className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 border border-indigo-200"
                        title="Polish bullet point with AI"
                      >
                        <Wand2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkExperienceBullet(idx, bIdx)}
                        className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 select-none border border-rose-200 font-sans text-[10px]"
                        title="Delete bullet point"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {!isMeasurement && (
              <div className="no-print font-sans pt-1">
                <button
                  type="button"
                  onClick={() => handleAddWorkExperienceBullet(idx)}
                  className="opacity-0 group-hover/workitem:opacity-100 focus:opacity-100 px-2 py-0.5 rounded text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 inline-flex items-center gap-1 transition-all cursor-pointer select-none shadow-sm"
                  title="Add new bullet point to this work experience entry"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Bullet Point</span>
                </button>
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={blockId} data-block-id={blockId} className="w-full text-left font-sans group/workitem relative" style={{ marginBottom: `${bulletSpacing}px` }}>
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
                  <ContentEditable
                    tagName="span"
                    value={exp.period}
                    onChange={(val) => handleWorkExperienceChange(idx, 'period', val, true)}
                    onBlur={(e: any) => handleWorkExperienceChange(idx, 'period', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none font-semibold"
                  />
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
                    <ContentEditable
                      tagName="span"
                      value={exp.role}
                      onChange={(val) => handleWorkExperienceChange(idx, 'role', val, true)}
                      onBlur={(e: any) => handleWorkExperienceChange(idx, 'role', e.target.innerText, false)}
                      useInnerText={true}
                      isMeasurement={isMeasurement}
                      className="focus:outline-none"
                    />
                  </p>
                  <p
                    className="text-gray-600"
                    style={{ fontSize: `${fontSize - 0.5}px` }}
                  >
                    <ContentEditable
                      tagName="span"
                      value={exp.company}
                      onChange={(val) => handleWorkExperienceChange(idx, 'company', val, true)}
                      onBlur={(e: any) => handleWorkExperienceChange(idx, 'company', e.target.innerText, false)}
                      useInnerText={true}
                      isMeasurement={isMeasurement}
                      className="focus:outline-none"
                    />
                  </p>
                  {exp.location && (
                    <p
                      className="text-gray-500"
                      style={{ fontSize: `${fontSize - 0.5}px` }}
                    >
                      <ContentEditable
                        tagName="span"
                        value={exp.location}
                        onChange={(val) => handleWorkExperienceChange(idx, 'location', val, true)}
                        onBlur={(e: any) => handleWorkExperienceChange(idx, 'location', e.target.innerText, false)}
                        useInnerText={true}
                        isMeasurement={isMeasurement}
                        className="focus:outline-none"
                      />
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
                        <ContentEditable
                          tagName="span"
                          value={b}
                          onChange={(val) => handleWorkExperienceBulletChange(idx, bIdx, val, true)}
                          onBlur={(e: any) => handleWorkExperienceBulletChange(idx, bIdx, e.target.innerHTML, false)}
                          isMeasurement={isMeasurement}
                          highlightHtml={isAtsHighlightEnabled ? getHighlightedHtml(b) : undefined}
                          className="focus:outline-none flex-1"
                        />
                        {!isMeasurement && (
                          <div className="no-print opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1 ml-1.5 shrink-0 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleFetchBulletVariations(idx, bIdx, b)}
                              className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 cursor-pointer w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 border border-indigo-200"
                              title="Polish bullet point with AI"
                            >
                              <Wand2 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteWorkExperienceBullet(idx, bIdx)}
                              className="text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer w-4 h-4 rounded-full flex items-center justify-center transition-all duration-150 select-none border border-rose-200 font-sans text-[10px]"
                              title="Delete bullet point"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  {!isMeasurement && (
                    <div className="no-print font-sans pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddWorkExperienceBullet(idx)}
                        className="opacity-0 group-hover/workitem:opacity-100 focus:opacity-100 px-2 py-0.5 rounded text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 inline-flex items-center gap-1 transition-all cursor-pointer select-none shadow-sm"
                        title="Add new bullet point to this work experience entry"
                      >
                        <Plus className="w-3 h-3 text-indigo-600" />
                        <span>Add Bullet Point</span>
                      </button>
                    </div>
                  )}
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
          className="text-left w-full group relative"
          style={{
            marginTop: `${isFirstSection ? 0 : sectionSpacing * 0.4}px`,
            marginBottom: `${sectionSpacing * 0.2}px`
          }}
        >
          {!isMeasurement && renderSectionHeaderControls('education', cvLanguage === 'DE' ? 'Ausbildung' : 'Education', result.tailoredCv.education)}
          {(() => {
            const title = cvLanguage === 'DE' ? 'Ausbildung' : 'Education';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <>
                <h2 className="text-[15px] font-bold uppercase">
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
              <ContentEditable
                tagName="span"
                value={edu.period}
                onChange={(val) => handleEducationChange(idx, 'period', val, true)}
                onBlur={(e: any) => handleEducationChange(idx, 'period', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none font-semibold"
              />
            </p>
            <p
              className="font-semibold text-[#2980B9]"
              style={{ fontSize: `${fontSize + 0.5}px` }}
            >
              <ContentEditable
                tagName="span"
                value={edu.degree}
                onChange={(val) => handleEducationChange(idx, 'degree', val, true)}
                onBlur={(e: any) => handleEducationChange(idx, 'degree', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none font-semibold"
              />
            </p>
            <p
              className="text-gray-600 font-medium"
              style={{ fontSize: `${fontSize - 0.5}px` }}
            >
              <ContentEditable
                tagName="span"
                value={edu.institution}
                onChange={(val) => handleEducationChange(idx, 'institution', val, true)}
                onBlur={(e: any) => handleEducationChange(idx, 'institution', e.target.innerText, false)}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="focus:outline-none font-semibold"
              />
              {edu.location && (
                <>
                  {' – '}
                  <ContentEditable
                    tagName="span"
                    value={edu.location}
                    onChange={(val) => handleEducationChange(idx, 'location', val, true)}
                    onBlur={(e: any) => handleEducationChange(idx, 'location', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
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
                  <ContentEditable
                    tagName="span"
                    value={edu.period}
                    onChange={(val) => handleEducationChange(idx, 'period', val, true)}
                    onBlur={(e: any) => handleEducationChange(idx, 'period', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
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
                    <ContentEditable
                      tagName="span"
                      value={edu.degree}
                      onChange={(val) => handleEducationChange(idx, 'degree', val, true)}
                      onBlur={(e: any) => handleEducationChange(idx, 'degree', e.target.innerText, false)}
                      useInnerText={true}
                      isMeasurement={isMeasurement}
                      className="focus:outline-none"
                    />
                  </p>
                  <p
                    className="text-gray-600"
                    style={{ fontSize: `${fontSize - 0.5}px` }}
                  >
                    <ContentEditable
                      tagName="span"
                      value={edu.institution}
                      onChange={(val) => handleEducationChange(idx, 'institution', val, true)}
                      onBlur={(e: any) => handleEducationChange(idx, 'institution', e.target.innerText, false)}
                      useInnerText={true}
                      isMeasurement={isMeasurement}
                      className="focus:outline-none"
                    />
                  </p>
                  {edu.location && (
                    <p
                      className="text-gray-500"
                      style={{ fontSize: `${fontSize - 0.5}px` }}
                    >
                      <ContentEditable
                        tagName="span"
                        value={edu.location}
                        onChange={(val) => handleEducationChange(idx, 'location', val, true)}
                        onBlur={(e: any) => handleEducationChange(idx, 'location', e.target.innerText, false)}
                        useInnerText={true}
                        isMeasurement={isMeasurement}
                        className="focus:outline-none"
                      />
                    </p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (blockId === 'projects-header') {
      return (
        <div
          key={blockId}
          data-block-id={blockId}
          className="text-left w-full group relative"
          style={{
            marginTop: `${sectionSpacing * 0.4}px`,
            marginBottom: `${sectionSpacing * 0.2}px`
          }}
        >
          {!isMeasurement && renderSectionHeaderControls('projects', cvLanguage === 'DE' ? 'Projekte' : 'Projects', result.tailoredCv.projects)}
          {(() => {
            const title = cvLanguage === 'DE' ? 'Projekte' : 'Projects';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <>
                <h2 className="text-[15px] font-bold uppercase font-sans">
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

    if (blockId.startsWith('project-')) {
      const idx = parseInt(blockId.substring(8));
      const proj = result.tailoredCv.projects?.[idx];
      if (!proj) return null;
      if (isAtsMode) {
        return (
          <div
            key={blockId}
            data-block-id={blockId}
            className="w-full text-left font-sans flex flex-col group relative"
            style={{ marginBottom: `${bulletSpacing * 1.5}px` }}
          >
            <div className="flex items-center justify-between gap-2">
              <p
                className="font-semibold text-[#2980B9] flex items-center gap-1.5 flex-wrap animate-none"
                style={{ fontSize: `${fontSize + 0.5}px` }}
              >
                <ContentEditable
                  tagName="span"
                  value={proj.name}
                  onChange={(val) => handleProjectChange(idx, 'name', val, true)}
                  onBlur={(e: any) => handleProjectChange(idx, 'name', e.target.innerText, false)}
                  useInnerText={true}
                  isMeasurement={isMeasurement}
                  className="focus:outline-none font-bold"
                />
                {proj.url && (
                  <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline no-print font-normal">
                    ({proj.url})
                  </a>
                )}
              </p>
              {!isMeasurement && (
                <div className="no-print opacity-100 sm:opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleMoveProject(idx, 'up')}
                    disabled={idx === 0}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer shadow-sm border border-zinc-200"
                    title="Move Project Up"
                  >
                    🔼
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveProject(idx, 'down')}
                    disabled={idx === (result.tailoredCv.projects?.length || 0) - 1}
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer shadow-sm border border-zinc-200"
                    title="Move Project Down"
                  >
                    🔽
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFetchProjectVariations(idx, proj.description, proj.name)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 cursor-pointer flex items-center gap-1 border border-indigo-200 shadow-sm"
                    title="Polish Project Description with AI (2 Tokens)"
                  >
                    <Wand2 className="w-2.5 h-2.5 text-indigo-500" />
                    <span>Polish</span>
                  </button>
                </div>
              )}
            </div>
            {proj.technologies && proj.technologies.length > 0 && (
              <p className="text-[10px] text-gray-500 font-semibold mb-1">
                Technologies:{' '}
                <ContentEditable
                  tagName="span"
                  value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                  onChange={(val) => handleProjectChange(idx, 'technologies', val, true)}
                  onBlur={(e: any) => handleProjectChange(idx, 'technologies', e.target.innerText, false)}
                  useInnerText={true}
                  isMeasurement={isMeasurement}
                  highlightHtml={isAtsHighlightEnabled ? getHighlightedHtml(Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies) : undefined}
                  className="focus:outline-none"
                />
              </p>
            )}
            <ContentEditable
              tagName="p"
              value={proj.description}
              onChange={(val) => handleProjectChange(idx, 'description', val, true)}
              onBlur={(e: any) => handleProjectChange(idx, 'description', e.target.innerHTML, false)}
              isMeasurement={isMeasurement}
              highlightHtml={isAtsHighlightEnabled ? getHighlightedHtml(proj.description) : undefined}
              className="text-gray-700 text-left font-sans focus:outline-none"
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: 1.55
              }}
            />
          </div>
        );
      }

      return (
        <div key={blockId} data-block-id={blockId} className="w-full text-left font-sans group relative" style={{ marginBottom: `${bulletSpacing}px` }}>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td
                  className="align-top pr-6 text-gray-800 w-[28%] font-bold"
                  style={{
                    paddingTop: `${bulletSpacing * 0.25}px`,
                    paddingBottom: `${bulletSpacing * 0.25}px`,
                    fontSize: `${fontSize}px`
                  }}
                >
                  <ContentEditable
                    tagName="span"
                    value={proj.name}
                    onChange={(val) => handleProjectChange(idx, 'name', val, true)}
                    onBlur={(e: any) => handleProjectChange(idx, 'name', e.target.innerText, false)}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none"
                  />
                </td>
                <td
                  className="align-top text-gray-700 leading-[1.55] relative"
                  style={{
                    paddingTop: `${bulletSpacing * 0.25}px`,
                    paddingBottom: `${bulletSpacing * 0.25}px`
                  }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {proj.technologies && proj.technologies.length > 0 && (
                        <span className="text-[10px] text-gray-500 font-semibold">
                          Technologies:{' '}
                          <ContentEditable
                            tagName="span"
                            value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                            onChange={(val) => handleProjectChange(idx, 'technologies', val, true)}
                            onBlur={(e: any) => handleProjectChange(idx, 'technologies', e.target.innerText, false)}
                            useInnerText={true}
                            isMeasurement={isMeasurement}
                            highlightHtml={isAtsHighlightEnabled ? getHighlightedHtml(Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies) : undefined}
                            className="focus:outline-none"
                          />
                        </span>
                      )}
                      {proj.url && (
                        <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#2980B9] hover:underline no-print font-normal">
                          ({proj.url})
                        </a>
                      )}
                    </div>
                    {!isMeasurement && (
                      <div className="no-print opacity-100 sm:opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleMoveProject(idx, 'up')}
                          disabled={idx === 0}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer shadow-sm border border-zinc-200"
                          title="Move Project Up"
                        >
                          🔼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveProject(idx, 'down')}
                          disabled={idx === (result.tailoredCv.projects?.length || 0) - 1}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 disabled:opacity-30 cursor-pointer shadow-sm border border-zinc-200"
                          title="Move Project Down"
                        >
                          🔽
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFetchProjectVariations(idx, proj.description, proj.name)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 cursor-pointer flex items-center gap-1 border border-indigo-200 shadow-sm"
                          title="Polish Project Description with AI (2 Tokens)"
                        >
                          <Wand2 className="w-2.5 h-2.5 text-indigo-500" />
                          <span>Polish</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <ContentEditable
                    tagName="p"
                    value={proj.description}
                    onChange={(val) => handleProjectChange(idx, 'description', val, true)}
                    onBlur={(e: any) => handleProjectChange(idx, 'description', e.target.innerHTML, false)}
                    isMeasurement={isMeasurement}
                    highlightHtml={isAtsHighlightEnabled ? getHighlightedHtml(proj.description) : undefined}
                    className="text-gray-700 text-left font-sans focus:outline-none"
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.55
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (blockId === 'skills') {
      return (
        <div key={blockId} data-block-id={blockId} className="w-full text-left font-sans group relative">
          {!isMeasurement && renderSectionHeaderControls('skills', cvLanguage === 'DE' ? 'Fähigkeiten' : 'Skills', result.tailoredCv.skills)}
          {(() => {
            const title = cvLanguage === 'DE' ? 'Fähigkeiten' : 'Skills';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <div
                className="text-left"
                style={{
                  marginTop: `${isFirstSection ? 0 : sectionSpacing * 0.4}px`,
                  marginBottom: `${sectionSpacing * 0.3}px`
                }}
              >
                <h2 className="text-[15px] font-bold uppercase">
                  <span className="text-gray-800">{first}</span>
                  {rest && <span className="text-[#2980B9]">&nbsp;{rest}</span>}
                </h2>
                <div className="border-b border-[#CBD5E1] mt-1" />
              </div>
            );
          })()}
          <div style={{ marginTop: `${bulletSpacing * 0.5}px` }}>
            <ul className="list-none pl-0">
              {skillsLayout === 'level' ? (
                Object.entries(getGroupedSkills(result.tailoredCv.skills)).map(([level, names], gIdx) => {
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
                        {isAtsHighlightEnabled ? (
                          <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: names.map(n => getHighlightedHtml(n)).join(', ') }} />
                        ) : (
                          <span className="text-gray-700">{names.join(', ')}</span>
                        )}
                      </span>
                    </li>
                  );
                })
              ) : (
                Object.entries(groupSkillsByCategory(result.tailoredCv.skills)).map(([cat, names], gIdx) => {
                  if (names.length === 0) return null;

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
                        <span className="font-semibold text-gray-800">{cat}:</span>{' '}
                        {isAtsHighlightEnabled ? (
                          <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: names.map(n => getHighlightedHtml(n)).join(', ') }} />
                        ) : (
                          <span className="text-gray-700">{names.join(', ')}</span>
                        )}
                      </span>
                    </li>
                  );
                })
              )}
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
          className="text-left w-full font-sans group relative"
          style={{ marginTop: `${isFirstSection ? 0 : sectionSpacing * 0.5}px` }}
        >
          {!isMeasurement && renderSectionHeaderControls('languages', cvLanguage === 'DE' ? 'Sprachen' : 'Languages', result.tailoredCv.languages)}
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

    if (blockId.startsWith('custom-sec-')) {
      const customSecId = blockId.replace('custom-sec-', '');
      const sec = (customSections || []).find(c => c.id === customSecId) ||
        (result.tailoredCv?.customSections || []).find((c: any) => c.id === customSecId);
      if (!sec) return null;

      const topMargin = sectionMargins[`custom-${sec.id}`]?.top || 0;
      const bottomMargin = sectionMargins[`custom-${sec.id}`]?.bottom || 0;

      return (
        <div
          key={blockId}
          data-block-id={blockId}
          className="text-left w-full font-sans group relative"
          style={{
            marginTop: `${(isFirstSection ? 0 : sectionSpacing) + topMargin}px`,
            marginBottom: `${bottomMargin}px`
          }}
        >
          {!isMeasurement && renderSectionHeaderControls(`custom-${sec.id}`, sec.title, sec)}
          {(() => {
            const title = sec.title || 'Custom Section';
            const idx = title.indexOf(' ');
            const first = idx === -1 ? title : title.slice(0, idx);
            const rest = idx === -1 ? '' : title.slice(idx + 1);
            return (
              <div
                className="text-left animate-none"
                style={{
                  marginTop: `${(isFirstSection ? 0 : sectionSpacing * 0.4) + topMargin}px`,
                  marginBottom: `${(sectionSpacing * 0.3) + bottomMargin}px`
                }}
              >
                <h2 className="text-[15px] font-bold uppercase">
                  <span className="text-gray-800">{first}</span>
                  {rest && <span className="text-[#2980B9]">&nbsp;{rest}</span>}
                </h2>
                <div className="border-b border-[#CBD5E1] mt-1" />
              </div>
            );
          })()}

          {sec.type === 'bullet-list' && (
            <ul className="list-none pl-0">
              {(sec.bullets || []).map((b: string, bIdx: number) => (
                <li
                  key={bIdx}
                  className="flex items-start gap-1.5 text-gray-700 leading-[1.55]"
                  style={{
                    fontSize: `${fontSize}px`,
                    marginTop: `${bulletSpacing}px`
                  }}
                >
                  <span className="text-gray-500 leading-none mt-[2px] shrink-0 font-sans">•</span>
                  <ContentEditable
                    tagName="span"
                    value={b}
                    onChange={(val) => {
                      const updated = customSections.map(c => {
                        if (c.id !== sec.id) return c;
                        const bullets = [...(c.bullets || [])];
                        bullets[bIdx] = val;
                        return { ...c, bullets };
                      });
                      setCustomSections(updated);
                    }}
                    onBlur={(e: any) => {
                      const updated = customSections.map(c => {
                        if (c.id !== sec.id) return c;
                        const bullets = [...(c.bullets || [])];
                        bullets[bIdx] = e.target.innerText;
                        return { ...c, bullets };
                      });
                      setCustomSections(updated);
                    }}
                    useInnerText={true}
                    isMeasurement={isMeasurement}
                    className="focus:outline-none flex-1"
                  />
                </li>
              ))}
            </ul>
          )}
          {sec.type === 'bullet-list' && !isMeasurement && (
            <div className="no-print font-sans pt-1">
              <button
                type="button"
                onClick={() => {
                  const updated = customSections.map(c => {
                    if (c.id !== sec.id) return c;
                    const bullets = [...(c.bullets || []), 'New key achievement or detail...'];
                    return { ...c, bullets };
                  });
                  setCustomSections(updated);
                }}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 px-2 py-0.5 rounded text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 inline-flex items-center gap-1 transition-all cursor-pointer select-none shadow-sm"
                title="Add new bullet point"
              >
                <Plus className="w-3 h-3" />
                <span>Add Bullet Point</span>
              </button>
            </div>
          )}

          {sec.type === 'paragraph' && (
            <div style={{ marginTop: `${bulletSpacing * 0.5}px` }}>
              <ContentEditable
                tagName="p"
                value={sec.content || ''}
                onChange={(val) => {
                  const updated = customSections.map(c => c.id === sec.id ? { ...c, content: val } : c);
                  setCustomSections(updated);
                }}
                onBlur={(e: any) => {
                  const updated = customSections.map(c => c.id === sec.id ? { ...c, content: e.target.innerText } : c);
                  setCustomSections(updated);
                }}
                useInnerText={true}
                isMeasurement={isMeasurement}
                className="text-gray-700 leading-relaxed focus:outline-none"
                style={{ fontSize: `${fontSize}px` }}
              />
            </div>
          )}

          {(sec.type === 'subgroup-chips' || sec.type === 'subgroup-items') && (
            <div className="space-y-2" style={{ marginTop: `${bulletSpacing * 0.5}px` }}>
              {(sec.subgroups || []).map((sub, sIdx) => (
                <div key={sub.id || sIdx} className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
                  <span className="font-semibold text-gray-800" style={{ fontSize: `${fontSize}px` }}>{sub.name}:</span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {sub.items.map((item, iIdx) => (
                      <span key={iIdx} className="px-2 py-0.5 rounded text-gray-800 bg-gray-100 border border-gray-200" style={{ fontSize: `${fontSize - 0.5}px` }}>
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {sec.type === 'structured-items' && (
            <div className="space-y-2" style={{ marginTop: `${bulletSpacing * 0.5}px` }}>
              {(sec.items || []).map((item, iIdx) => (
                <div key={iIdx} className="w-full text-left font-sans">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-gray-800" style={{ fontSize: `${fontSize}px` }}>{item.title}</span>
                    {item.dateOrLocation && <span className="text-gray-500" style={{ fontSize: `${fontSize - 1}px` }}>{item.dateOrLocation}</span>}
                  </div>
                  {item.subtitle && <p className="text-gray-600 font-medium" style={{ fontSize: `${fontSize - 0.5}px` }}>{item.subtitle}</p>}
                  {item.bullets && item.bullets.length > 0 && (
                    <ul className="list-none pl-0 mt-1">
                      {item.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-1.5 text-gray-700 leading-[1.5]" style={{ fontSize: `${fontSize}px` }}>
                          <span className="text-gray-500 mt-[2px]">•</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
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
          <div className="mb-2 h-[32px] flex items-end select-none" aria-hidden="true">
            {showSignatureImage && (
              result.tailoredCv.personalDetails.signature ? (
                <img
                  src={result.tailoredCv.personalDetails.signature}
                  alt=""
                  aria-hidden="true"
                  className="max-h-full max-w-[120px] object-contain"
                />
              ) : (
                <svg
                  width="80"
                  height="32"
                  viewBox="0 0 80 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
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
              )
            )}
          </div>
          <ContentEditable
            tagName="p"
            value={result.tailoredCv.signingLine || `${signingLocation || 'München'}, ${new Date().toLocaleDateString(cvLanguage === 'DE' ? 'de-DE' : 'en-US')}`}
            onChange={(val) => handleSigningLineChange(val, true)}
            onBlur={(e: any) => handleSigningLineChange(e.target.innerText, false)}
            useInnerText={true}
            isMeasurement={isMeasurement}
            className="text-[11px] text-gray-600 focus:outline-none"
          />
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
        const firstChild = element.firstElementChild as HTMLElement;
        const contentHeight = firstChild ? firstChild.offsetHeight : 0;
        const printableHeight = 911; // A4 height (1123px) - vertical padding (121px + 91px)
        const pagesVal = Math.max(1, Math.ceil(contentHeight / printableHeight));
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

        setPages(prev => {
          const isSame = prev.length === pagesList.length &&
            prev.every((p, i) => p.length === pagesList[i].length && p.every((val, j) => val === pagesList[i][j]));
          return isSame ? prev : pagesList;
        });
        setNumPages(pagesList.length);
      };

      // Listen to input events on the active preview container to sync the height in real-time
      const cvSheet = cvPreviewRef.current;
      const handleInput = (e: Event) => {
        const target = e.target as HTMLElement;
        const blockEl = target.closest('[data-block-id]') as HTMLElement;
        if (blockEl) {
          const blockId = blockEl.getAttribute('data-block-id');
          if (blockId) {
            const measEl = element.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
            if (measEl) {
              measEl.innerHTML = blockEl.innerHTML;
              measureAndSplit();
            }
          }
        }
      };

      if (cvSheet) {
        cvSheet.addEventListener('input', handleInput);
      }

      measureAndSplit();
      const observer = new ResizeObserver(measureAndSplit);
      observer.observe(element);

      return () => {
        observer.disconnect();
        if (cvSheet) {
          cvSheet.removeEventListener('input', handleInput);
        }
      };
    }
  }, [result, fontSize, sectionSpacing, pagePaddingTop, pagePaddingBottom, pagePaddingSide, bulletSpacing, signatureSpacing, photoHeight, headerSpacing, bulletStyle, lengthTarget, previewTab, showSignatureImage, showSignatureSection, sectionOrder, selectedProjects, isAtsHighlightEnabled, hiddenSections, customSections, sectionMargins]);


  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        // If the profile is completely empty (no fullName), mark as not set
        if (data.fullName) {
          setProfile(data);
          // By default, select all projects if available
          if (data.projects && data.projects.length > 0) {
            setSelectedProjects(data.projects.map((p: any) => p.name));
          }
          // Load custom sections from master profile
          if (data.customSections && Array.isArray(data.customSections)) {
            setCustomSections(data.customSections);
            setSectionOrder(prev => {
              const existing = new Set(prev);
              const toAdd = data.customSections
                .map((cs: any) => `custom-${cs.id}`)
                .filter((k: string) => !existing.has(k));
              return [...prev, ...toAdd];
            });
          }
          // Set default signing location based on profile address
          if (data.address && !signingLocation) {
            const cityCountry = formatCityCountry(data.address);
            if (cityCountry) {
              setSigningLocation(cityCountry.split(',')[0]?.trim() || cityCountry);
            }
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
          const parsedCv = JSON.parse(cvDoc.content);
          setResult({
            matchScore: app.matchScore,
            gapAnalysis: app.gapAnalysis,
            tailoredCv: parsedCv,
            tailoredCoverLetter: JSON.parse(clDoc.content),
            jobMetadata: {
              techStack: app.techStack || '',
              mainRequirements: app.mainRequirements || '',
              recruiterName: app.recruiterName || '',
              contactInfo: app.contactInfo || '',
              jobType: app.jobType || '',
              location: app.location || '',
              remoteOrPhysical: app.remoteOrPhysical || ''
            }
          });
          if (parsedCv.sectionOrder) {
            setSectionOrder(parsedCv.sectionOrder);
          } else {
            setSectionOrder(['summary', 'work', 'education', 'projects', 'skills', 'languages']);
          }
          if (parsedCv.projects && parsedCv.projects.length > 0) {
            setSelectedProjects(parsedCv.projects.map((p: any) => p.name));
          }
        }
      }
    } catch (err) {
      console.error('Error loading application details:', err);
    }
  };

  const handleUrlScrape = async () => {
    if (!jobUrl.trim() || !jobUrl.startsWith('http')) {
      showAlert({
        title: 'Invalid URL',
        message: 'Please enter a valid job posting URL.',
        type: 'warning'
      });
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

      if (res.status === 403) {
        setIsTokenModalOpen(true);
        return;
      }

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

        fetchTokens();
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
      showAlert({
        title: 'Invalid File Format',
        message: 'Please select a valid PDF file.',
        type: 'warning'
      });
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

      if (res.status === 403) {
        setIsTokenModalOpen(true);
        return;
      }

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

      fetchTokens();
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
      showAlert({
        title: 'Missing Fields',
        message: 'Please fill out Company Name, Role Name, and Job Description.',
        type: 'warning'
      });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const allProjects = profile?.projects && Array.isArray(profile.projects) && profile.projects.length > 0
        ? profile.projects.map((p: any) => p.name)
        : selectedProjects;

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
          themeDirective,
          profile,
          matchStrategy,
          applicationId: editingAppId,
          roleName,
          selectedProjects: allProjects,
          isNudgeEnabled
        })
      });

      if (res.status === 403) {
        setIsTokenModalOpen(true);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Server error during tailoring');
      }

      const data = (await res.json()) as TailorResponse;
      setResult(data);
      fetchTokens();

      if (data.tailoredCv?.projects && Array.isArray(data.tailoredCv.projects)) {
        setSelectedProjects(data.tailoredCv.projects.map((p: any) => p.name));
      }

      // Switch to ATS tab automatically after generation so user sees match score
      setSidePanelTab('ats');

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
      showAlert({
        title: 'Tailoring Failed',
        message: err.message || 'An error occurred during CV/Cover Letter tailoring.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const extractCleanLines = (element: Element | null, fallbackText?: string): string[] => {
    let lines: string[] = [];

    // 1. If element is provided, convert HTML line breaks (<br>, <div>, <p>, etc.) to newlines
    if (element) {
      const html = element.innerHTML || '';
      const converted = html
        .replace(/<br\s*[\/]?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ');

      lines = converted
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
    }

    // 2. If fallbackText has more lines or was passed, consider it
    if (fallbackText) {
      const fbLines = fallbackText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      if (fbLines.length > lines.length) {
        lines = fbLines;
      }
    }

    // 3. If everything ended up on 1 line, split heuristically (e.g. Phone:, Email:, or commas with +/phone/email)
    if (lines.length === 1) {
      const raw = lines[0];
      if (raw.includes('Phone:') || raw.includes('Email:') || raw.includes('Tel:') || raw.includes('@') || raw.includes(',')) {
        const parts = raw
          .replace(/(Phone:|Tel:|Mobil:|Email:|E-Mail:)/gi, '\n$1')
          .replace(/(\+?\d[\d\s-]{6,}\d)/g, '\n$1')
          .replace(/,\s*/g, '\n')
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(Boolean);
        if (parts.length > 1) {
          lines = parts;
        }
      }
    }

    return lines;
  };

  const preparePrintClone = (element: HTMLElement, docType: 'cv' | 'cl' = 'cv'): HTMLElement => {
    const clone = element.cloneNode(true) as HTMLElement;

    // 1. Remove all elements with .no-print class (toolbars, AI polish buttons, guide lines, page badges)
    clone.querySelectorAll('.no-print').forEach(el => el.remove());

    // 2. Remove any interactive buttons or input fields
    clone.querySelectorAll('button, input, textarea, select, [role="button"]').forEach(el => el.remove());

    // 3. For Cover Letter: Format address blocks & enclosures into pristine paragraph stacks BEFORE stripping attributes
    if (docType === 'cl') {
      // 3a. Sender Address
      const senderEl = clone.querySelector('[data-cl-field="senderAddress"]') || clone.querySelector('pre');
      if (senderEl) {
        const senderLines = extractCleanLines(senderEl, result?.tailoredCoverLetter?.senderAddress);
        const isRight = !isAtsMode;
        const div = clone.ownerDocument.createElement('div');
        div.setAttribute('style', `
          text-align: ${isRight ? 'right' : 'left'} !important;
          font-size: 11.5px !important;
          line-height: 1.7 !important;
          font-family: inherit !important;
          color: #1A1A1A !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        `);

        senderLines.forEach(line => {
          const p = clone.ownerDocument.createElement('p');
          p.setAttribute('style', `
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.7 !important;
            font-size: 11.5px !important;
            color: inherit !important;
            display: block !important;
          `);
          p.textContent = line;
          div.appendChild(p);
        });

        senderEl.parentNode?.replaceChild(div, senderEl);
      }

      // 3b. Recipient Address
      const recipientEl = clone.querySelector('[data-cl-field="recipientAddress"]');
      if (recipientEl) {
        const recipientLines = extractCleanLines(recipientEl, result?.tailoredCoverLetter?.recipientAddress);
        const div = clone.ownerDocument.createElement('div');
        div.setAttribute('style', `
          text-align: left !important;
          font-size: 11.5px !important;
          line-height: 1.7 !important;
          font-family: inherit !important;
          color: #1A1A1A !important;
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        `);

        recipientLines.forEach(line => {
          const p = clone.ownerDocument.createElement('p');
          p.setAttribute('style', `
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.7 !important;
            font-size: 11.5px !important;
            color: inherit !important;
            display: block !important;
          `);
          p.textContent = line;
          div.appendChild(p);
        });

        recipientEl.parentNode?.replaceChild(div, recipientEl);
      }

      // 3c. Enclosures
      const enclosureEl = clone.querySelector('[data-cl-field="enclosure"]');
      if (enclosureEl) {
        const encLines = extractCleanLines(enclosureEl, result?.tailoredCoverLetter?.enclosure || "- Curriculum Vitae\n- Bachelor Degree Diploma\n- Reference letter from previous employers");
        const div = clone.ownerDocument.createElement('div');
        div.setAttribute('style', `
          margin-left: 16px !important;
          margin-top: 4px !important;
          font-size: 11.5px !important;
          line-height: 1.7 !important;
          color: #1A1A1A !important;
          display: block !important;
        `);

        encLines.forEach(line => {
          const p = clone.ownerDocument.createElement('p');
          p.setAttribute('style', `
            margin: 2px 0 !important;
            padding: 0 !important;
            line-height: 1.7 !important;
            font-size: 11.5px !important;
            color: inherit !important;
            display: block !important;
          `);
          p.textContent = line.startsWith('-') ? line : `- ${line}`;
          div.appendChild(p);
        });

        enclosureEl.parentNode?.replaceChild(div, enclosureEl);
      }
    }

    // 4. Strip all contenteditable and interactive attributes, and strip positioning classes / inline position
    const allDescendants = clone.querySelectorAll('*');
    allDescendants.forEach(el => {
      el.removeAttribute('contenteditable');
      el.removeAttribute('suppresscontenteditablewarning');
      el.removeAttribute('spellcheck');
      el.removeAttribute('tabindex');
      el.removeAttribute('role');
      el.removeAttribute('aria-multiline');
      el.removeAttribute('data-block-id');
      el.removeAttribute('data-section');
      el.removeAttribute('data-index');
      el.removeAttribute('data-cl-field');

      if (el instanceof HTMLElement) {
        el.style.outline = 'none';
        el.style.boxShadow = 'none';
        // Strip relative, absolute, fixed, sticky classes to prevent stacking context inversions
        el.classList.remove('relative', 'absolute', 'fixed', 'sticky');
        if (el !== clone) {
          el.style.position = 'static';
          el.style.zIndex = 'auto';
        }
      }
    });

    // 5. Unwrap all inline highlight marks while preserving text content
    clone.querySelectorAll('mark').forEach(el => {
      while (el.firstChild) {
        el.parentNode?.insertBefore(el.firstChild, el);
      }
      el.remove();
    });

    // 6. Clean up bullet lists for native PDF list rendering
    clone.querySelectorAll('li').forEach(li => {
      Array.from(li.childNodes).forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).textContent?.trim() === '•') {
          child.remove();
        }
      });
      li.style.display = 'list-item';
      li.style.listStyleType = 'disc';
      li.style.listStylePosition = 'outside';
      li.style.marginLeft = '18px';
      li.style.paddingLeft = '4px';
      li.style.lineHeight = '1.55';
    });
    clone.querySelectorAll('ul').forEach(ul => {
      ul.style.listStyleType = 'disc';
      ul.style.paddingLeft = '0';
      ul.style.marginLeft = '0';
    });

    // 7. Ensure contact details and project URLs are clickable <a> links in PDF output
    if (docType === 'cv' && result?.tailoredCv?.personalDetails) {
      const details = result.tailoredCv.personalDetails;
      clone.querySelectorAll('p, span').forEach(el => {
        const text = el.textContent?.trim() || '';
        if (details.email && text === details.email && el.tagName.toLowerCase() !== 'a') {
          const a = clone.ownerDocument.createElement('a');
          a.href = `mailto:${details.email}`;
          a.textContent = details.email;
          a.setAttribute('style', 'color: inherit !important; text-decoration: none !important; font-weight: inherit !important;');
          el.parentNode?.replaceChild(a, el);
        } else if (details.phone && text === details.phone && el.tagName.toLowerCase() !== 'a') {
          const a = clone.ownerDocument.createElement('a');
          a.href = `tel:${details.phone.replace(/\s+/g, '')}`;
          a.textContent = details.phone;
          a.setAttribute('style', 'color: inherit !important; text-decoration: none !important; font-weight: inherit !important;');
          el.parentNode?.replaceChild(a, el);
        } else if (details.linkedin && (text === details.linkedin || text.includes('linkedin.com')) && el.tagName.toLowerCase() !== 'a') {
          const a = clone.ownerDocument.createElement('a');
          const href = details.linkedin.startsWith('http') ? details.linkedin : `https://${details.linkedin}`;
          a.href = href;
          a.textContent = text;
          a.setAttribute('style', 'color: #2980B9 !important; text-decoration: none !important; font-weight: inherit !important;');
          el.parentNode?.replaceChild(a, el);
        } else if (details.github && (text === details.github || text.includes('github.com')) && el.tagName.toLowerCase() !== 'a') {
          const a = clone.ownerDocument.createElement('a');
          const href = details.github.startsWith('http') ? details.github : `https://${details.github}`;
          a.href = href;
          a.textContent = text;
          a.setAttribute('style', 'color: #2980B9 !important; text-decoration: none !important; font-weight: inherit !important;');
          el.parentNode?.replaceChild(a, el);
        } else if (details.website && (text === details.website || text.startsWith('http') || text.includes('www.')) && el.tagName.toLowerCase() !== 'a') {
          const a = clone.ownerDocument.createElement('a');
          const href = details.website.startsWith('http') ? details.website : `https://${details.website}`;
          a.href = href;
          a.textContent = text;
          a.setAttribute('style', 'color: #2980B9 !important; text-decoration: none !important; font-weight: inherit !important;');
          el.parentNode?.replaceChild(a, el);
        }
      });
    }

    // 8. Replace non-breaking spaces with standard ASCII space
    const walker = clone.ownerDocument.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
    let textNodeItem: Text | null;
    while ((textNodeItem = walker.nextNode() as Text | null)) {
      if (textNodeItem.nodeValue) {
        textNodeItem.nodeValue = textNodeItem.nodeValue.replace(/\u00A0/g, ' ');
      }
    }

    // 9. Merge contiguous text nodes so sentences are fully unified with standard space characters
    clone.normalize();

    return clone;
  };

  const getExportFileName = (type: 'cv' | 'cl', ext?: string) => {
    // 1. Resolve Company Name: from companyName state or extracted from CL recipient / job
    let rawCompany = companyName.trim();
    if (!rawCompany && result?.tailoredCoverLetter?.recipientAddress) {
      const firstLine = result.tailoredCoverLetter.recipientAddress.split(/\r?\n/)[0]?.trim();
      if (firstLine && !firstLine.toLowerCase().includes('hiring') && !firstLine.toLowerCase().includes('personal') && !firstLine.toLowerCase().includes('recruiting')) {
        rawCompany = firstLine;
      }
    }
    const cleanCompany = (rawCompany || 'Company')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_');

    // 2. Resolve Position: from roleName state or tailoredCv occupation
    let rawPosition = roleName.trim();
    if (!rawPosition && result?.tailoredCv?.personalDetails?.occupation) {
      rawPosition = result.tailoredCv.personalDetails.occupation.trim();
    }
    const cleanPosition = (rawPosition || 'Position')
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_');

    // 3. Document Label
    const docLabel = type === 'cv' ? 'CV' : 'CL';

    // 4. Construct format: company_name-Position-(CV/CL)
    const baseName = `${cleanCompany}-${cleanPosition}-(${docLabel})`;
    return ext ? `${baseName}.${ext}` : baseName;
  };

  const handleExportPdf = async (type: 'cv' | 'cl') => {
    const isCv = type === 'cv';
    let pagesHtml = '';

    const fileName = getExportFileName(type);

    if (isCv) {
      const pageElements = document.querySelectorAll('.cv-page-box');
      pageElements.forEach((pageEl, pageIdx) => {
        const isLastPage = pageIdx === pageElements.length - 1;
        const clone = preparePrintClone(pageEl as HTMLElement, 'cv');

        // Apply CV page styles directly in style attribute (without scaling)
        clone.setAttribute('style', `
          width: 210mm !important;
          min-height: 297mm !important;
          padding: ${pagePaddingTop}mm ${pagePaddingSide}mm ${pagePaddingBottom}mm ${pagePaddingSide}mm !important;
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: ${isLastPage ? 'avoid' : 'always'} !important;
          break-after: ${isLastPage ? 'auto' : 'page'} !important;
          background-color: #FFFFFF !important;
          position: relative !important;
          font-family: "Inter", "Calibri", "Segoe UI", Arial, sans-serif !important;
          font-size: ${fontSize}px !important;
          line-height: 1.55 !important;
          color: #1F2937 !important;
          display: block !important;
        `);
        pagesHtml += clone.outerHTML;
      });
    } else {
      const clSheet = document.getElementById('cl-sheet');
      if (clSheet) {
        const clone = preparePrintClone(clSheet as HTMLElement, 'cl');

        clone.setAttribute('style', `
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 32mm 28mm 24mm 28mm !important;
          box-sizing: border-box !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: avoid !important;
          break-after: auto !important;
          background-color: #FFFFFF !important;
          position: relative !important;
          font-family: "Inter", "Calibri", "Segoe UI", Arial, sans-serif !important;
          font-size: 11.5px !important;
          line-height: 1.65 !important;
          color: #1A1A1A !important;
          display: block !important;
        `);
        pagesHtml += clone.outerHTML;
      }
    }

    if (!pagesHtml) return;

    // Extract all compiled CSS rules directly from document.styleSheets
    let allCssText = '';
    try {
      Array.from(document.styleSheets).forEach(sheet => {
        try {
          if (sheet.cssRules) {
            Array.from(sheet.cssRules).forEach(rule => {
              allCssText += rule.cssText + '\n';
            });
          }
        } catch (e) {
          if (sheet.href) {
            allCssText += `@import url("${sheet.href}");\n`;
          }
        }
      });
    } catch (e) {
      console.warn('Could not extract all CSS rules:', e);
    }

    // Also copy any standalone link stylesheets
    let externalLinksHtml = '';
    document.querySelectorAll('link[rel="stylesheet"]').forEach(el => {
      externalLinksHtml += el.outerHTML;
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${fileName}</title>
        <meta charset="utf-8">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        ${externalLinksHtml}
        <style>
          ${allCssText}
        </style>
        <style>
          @page {
            size: A4 portrait;
            margin: 0 !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #FFFFFF !important;
            width: 210mm !important;
            font-family: "Inter", "Calibri", "Segoe UI", Arial, sans-serif !important;
          }
          .cv-page-box {
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            display: block !important;
          }
          #cl-sheet {
            width: 210mm !important;
            min-height: 297mm !important;
            box-sizing: border-box !important;
            display: block !important;
          }
          li {
            list-style-type: disc !important;
            display: list-item !important;
          }
        </style>
      </head>
      <body>${pagesHtml}</body>
      </html>
    `;

    // 1. Primary: Server-Side Pristine Binary PDF Download (Instant & Pixel-Perfect)
    try {
      const res = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: fullHtml, fileName })
      });

      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${fileName}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
        return;
      }
    } catch (err) {
      console.warn('Server PDF export failed, falling back to client print iframe:', err);
    }

    // 2. Fallback: Client Iframe Print
    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) return;

      iframeDoc.open();
      iframeDoc.write(fullHtml);
      iframeDoc.close();

      // Transfer decoded FontFace objects from main window into iframe
      if (document.fonts && iframe.contentWindow?.document?.fonts) {
        document.fonts.forEach(font => {
          try {
            iframe.contentWindow?.document.fonts.add(font);
          } catch (e) { }
        });
      }

      // Temporarily update document.title on window so the browser print dialog names the file after fileName!
      const originalTitle = document.title;
      document.title = fileName;

      const restoreTitle = () => {
        setTimeout(() => {
          document.title = originalTitle;
        }, 8000);
      };

      const triggerPrint = () => {
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            restoreTitle();
          }
        }, 300);
      };

      if (iframe.contentWindow?.document?.fonts?.ready) {
        iframe.contentWindow.document.fonts.ready.then(triggerPrint).catch(triggerPrint);
      } else {
        setTimeout(triggerPrint, 500);
      }

      // Clean up after print triggers
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 60000);
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: 'PDF Export Failed',
        message: err.message || 'An error occurred while printing the PDF.',
        type: 'error'
      });
    }
  };

  const handleExportWord = () => {
    const type = previewTab === 'cv' ? 'cv' : 'cl';
    const element = type === 'cv' ? cvPreviewRef.current : clPreviewRef.current;
    if (!element) return;

    // Clean up contentEditable attributes and guide lines using DOM cloning
    const tempElement = preparePrintClone(element);
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

    const fileName = getExportFileName(type, 'doc');

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

      sectionOrder.forEach((section) => {
        if (section === 'summary' && cv.summary) {
          textContent += `PROFESSIONAL SUMMARY\n`;
          textContent += `--------------------------------------------------\n`;
          textContent += `${cv.summary}\n\n`;
        }
        else if (section === 'work' && cv.workExperience && cv.workExperience.length > 0) {
          textContent += `WORK EXPERIENCE\n`;
          textContent += `--------------------------------------------------\n`;
          cv.workExperience.forEach((exp: any, idx: number) => {
            textContent += `${exp.role} | ${exp.company} - ${exp.location}\n`;
            textContent += `Period: ${exp.period}\n`;
            getRenderedBullets(exp, bulletStyle, lengthTarget, idx === 0).forEach((bullet: string) => {
              const cleanBullet = bullet.replace(/<[^>]*>/g, '');
              textContent += `- ${cleanBullet}\n`;
            });
            textContent += `\n`;
          });
        }
        else if (section === 'education' && cv.education && cv.education.length > 0) {
          textContent += `EDUCATION\n`;
          textContent += `--------------------------------------------------\n`;
          cv.education.forEach((edu: any) => {
            textContent += `${edu.degree} | ${edu.institution} - ${edu.location}\n`;
            textContent += `Period: ${edu.period}\n\n`;
          });
        }
        else if (section === 'projects' && cv.projects && cv.projects.length > 0) {
          textContent += `PROJECTS\n`;
          textContent += `--------------------------------------------------\n`;
          cv.projects.forEach((proj: any) => {
            textContent += `${proj.name} ${proj.url ? `(${proj.url})` : ''}\n`;
            if (proj.technologies && proj.technologies.length > 0) {
              const techStr = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies;
              textContent += `Technologies: ${techStr}\n`;
            }
            const cleanDesc = proj.description.replace(/<[^>]*>/g, '');
            textContent += `${cleanDesc}\n\n`;
          });
        }
        else if (section === 'skills' && cv.skills && cv.skills.length > 0) {
          textContent += `SKILLS\n`;
          textContent += `--------------------------------------------------\n`;
          const skillNames = cv.skills.map((s: any) => typeof s === 'string' ? s : s.name);
          textContent += `${skillNames.join(', ')}\n\n`;
        }
        else if (section === 'languages' && cv.languages && cv.languages.length > 0) {
          textContent += `LANGUAGES\n`;
          textContent += `--------------------------------------------------\n`;
          cv.languages.forEach((lang: any) => {
            textContent += `${lang.language}: ${lang.level}\n`;
          });
          textContent += `\n`;
        }
      });
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

      const enclosureContent = cl.enclosure !== undefined
        ? cl.enclosure
        : "- Curriculum Vitae\n- Bachelor Degree Diploma\n- Reference letter from previous employers";
      if (enclosureContent) {
        textContent += `\nEnclosure:\n${enclosureContent}\n`;
      }
    }

    // Strip out remaining HTML tags that could be in text from editing
    textContent = textContent.replace(/<[^>]*>/g, '');

    // Download file
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const fileName = getExportFileName(type, 'txt');

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddSkillInteractive = (skill: string, skipConfirm = false) => {
    if (!result) return;
    if (skipConfirm) {
      executeAddSkill(skill, true, true);
    } else {
      setSkillModal({
        isOpen: true,
        skillName: skill,
        isGap: true,
        alsoSaveToProfile: true
      });
    }
  };

  const executeAddSkill = async (skill: string, isGap: boolean, alsoSaveToProfile: boolean) => {
    if (!result || !skill.trim()) return;
    const cleanSkill = skill.trim();

    const initialMatching = result.gapAnalysis.matchingKeywords;
    const initialMissing = result.gapAnalysis.missingSkills;

    if (initialMatching.some(k => k.toLowerCase() === cleanSkill.toLowerCase())) {
      return;
    }

    const isActualMissing = initialMissing.some(s => s.toLowerCase() === cleanSkill.toLowerCase());
    const newMissing = initialMissing.filter(s => s.toLowerCase() !== cleanSkill.toLowerCase());
    const newMatching = [...initialMatching, cleanSkill];

    let newScore = result.matchScore;
    if (isActualMissing) {
      const closedGapsRatio = (initialMissing.length - newMissing.length) / (initialMissing.length || 1);
      newScore = Math.min(100, Math.round(result.matchScore + (closedGapsRatio * (100 - result.matchScore))));
    }

    const currentCvSkills = result.tailoredCv.skills || [];
    const hasCvSkill = currentCvSkills.some((s: any) => s.name?.toLowerCase() === cleanSkill.toLowerCase());
    const updatedCvSkills = hasCvSkill
      ? currentCvSkills
      : [...currentCvSkills, { name: cleanSkill, level: 'Intermediate' }];

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

    if (alsoSaveToProfile) {
      try {
        const currentSkills = Array.isArray(profile.skills) ? profile.skills : JSON.parse(profile.skills || '[]');
        const hasSkill = currentSkills.some((s: any) => {
          const name = typeof s === 'string' ? s : s.name;
          return name?.toLowerCase() === cleanSkill.toLowerCase();
        });

        if (!hasSkill) {
          const updatedSkills = [...currentSkills, { name: cleanSkill, level: 'Intermediate' }];
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
    }
  };

  const handleRemoveSkillInteractive = (skill: string) => {
    if (!result) return;
    const cleanSkill = skill.trim();

    const initialMatching = result.gapAnalysis.matchingKeywords;
    const initialMissing = result.gapAnalysis.missingSkills;

    const newMatching = initialMatching.filter(k => k.toLowerCase() !== cleanSkill.toLowerCase());

    const alreadyMissing = initialMissing.some(s => s.toLowerCase() === cleanSkill.toLowerCase());
    const newMissing = alreadyMissing ? initialMissing : [...initialMissing, cleanSkill];

    const totalKeywords = newMatching.length + newMissing.length;
    const newScore = totalKeywords > 0
      ? Math.round((newMatching.length / totalKeywords) * 100)
      : 0;

    const currentCvSkills = result.tailoredCv.skills || [];
    const updatedCvSkills = currentCvSkills.filter((s: any) => s.name?.toLowerCase() !== cleanSkill.toLowerCase());

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
      techStack: result.jobMetadata?.techStack || '',
      mainRequirements: result.jobMetadata?.mainRequirements || '',
      recruiterName: result.jobMetadata?.recruiterName || '',
      contactInfo: result.jobMetadata?.contactInfo || '',
      jobType: result.jobMetadata?.jobType || '',
      location: result.jobMetadata?.location || '',
      remoteOrPhysical: result.jobMetadata?.remoteOrPhysical || '',
      documents: [
        { type: 'CV', content: JSON.stringify({ ...result.tailoredCv, sectionOrder }) },
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
        const savedApp = await res.json();
        if (savedApp && savedApp.id) {
          setEditingAppId(savedApp.id);
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      showAlert({
        title: 'Save Failed',
        message: err.message || 'An error occurred while saving the application details.',
        type: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Inline result editing handlers
  const handleCvDetailsChange = (key: string, value: string, isRealtime = false) => {
    if (!result) return;
    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        personalDetails: {
          ...result.tailoredCv.personalDetails,
          [key]: value
        }
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleCvSummaryChange = (val: string, isRealtime = false) => {
    if (!result) return;
    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        summary: val
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleWorkExperienceChange = (expIdx: number, key: 'period' | 'role' | 'company' | 'location', value: string, isRealtime = false) => {
    if (!result) return;
    const newWorkExp = [...result.tailoredCv.workExperience];
    newWorkExp[expIdx] = {
      ...newWorkExp[expIdx],
      [key]: value
    };
    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        workExperience: newWorkExp
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleWorkExperienceBulletChange = (expIdx: number, bulletIdx: number, value: string, isRealtime = false) => {
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

    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        workExperience: newWorkExp
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };



  const handleEducationChange = (eduIdx: number, key: 'period' | 'degree' | 'institution' | 'location', value: string, isRealtime = false) => {
    if (!result) return;
    const newEdu = [...result.tailoredCv.education];
    newEdu[eduIdx] = {
      ...newEdu[eduIdx],
      [key]: value
    };
    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        education: newEdu
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleSkillsChange = (value: string, isRealtime = false) => {
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

    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        skills: newSkills
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleLanguagesChange = (idx: number, key: 'language' | 'level', value: string, isRealtime = false) => {
    if (!result) return;
    const newLanguages = [...result.tailoredCv.languages];
    newLanguages[idx] = {
      ...newLanguages[idx],
      [key]: value
    };
    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        languages: newLanguages
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleSigningLineChange = (value: string, isRealtime = false) => {
    if (!result) return;
    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        signingLine: value
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleProjectChange = (idx: number, key: 'name' | 'description' | 'technologies', value: any, isRealtime = false) => {
    if (!result) return;
    const newProjects = [...(result.tailoredCv.projects || [])];

    let processedValue = value;
    if (key === 'technologies' && typeof value === 'string') {
      processedValue = value.split(',').map(s => s.trim()).filter(Boolean);
    }

    newProjects[idx] = {
      ...newProjects[idx],
      [key]: processedValue
    };

    const updated = {
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        projects: newProjects
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleClChange = (key: keyof TailoredCoverLetter, value: string, isRealtime = false) => {
    if (!result) return;
    const updated = {
      ...result,
      tailoredCoverLetter: {
        ...result.tailoredCoverLetter,
        [key]: value
      }
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
  };

  const handleClParagraphChange = (index: number, val: string, isRealtime = false) => {
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

    const updated = {
      ...result,
      tailoredCoverLetter: newCl
    };
    if (isRealtime) {
      updateResultRealtime(updated);
    } else {
      setResult(updated);
    }
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
      <div className="lg:hidden sticky top-[49px] sm:top-[65px] z-30 flex bg-zinc-950/95 backdrop-blur-md border-b border-white/10 p-2 gap-2 w-full shrink-0">
        <button
          onClick={() => setActiveMobileTab('edit')}
          className={`flex-grow flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeMobileTab === 'edit'
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
            : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Edit & Strategy
        </button>
        <button
          onClick={() => setActiveMobileTab('preview')}
          className={`flex-grow flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeMobileTab === 'preview'
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
        <div className={`w-full col-span-1 lg:col-span-5 border-r border-white/5 bg-zinc-950/40 p-4 sm:p-6 md:p-8 overflow-y-auto h-[calc(100vh-125px)] lg:h-auto lg:max-h-[calc(100vh-73px)] space-y-6 ${activeMobileTab === 'edit' ? 'block' : 'hidden lg:block'
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

          {/* Token Balance Widget */}
          {tokens !== null && (
            <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex items-center gap-2 text-xs animate-in fade-in duration-200">
              <Coins className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold tracking-wider">Remaining Balance</span>
                <span className="font-bold text-zinc-200 text-xs">{tokens} Tokens</span>
              </div>
            </div>
          )}

          {/* 3-Tab Switcher Header */}
          <div className="flex bg-zinc-900 border border-white/10 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setSidePanelTab('generation')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${sidePanelTab === 'generation'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generation</span>
            </button>
            <button
              type="button"
              onClick={() => setSidePanelTab('ats')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${sidePanelTab === 'ats'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>ATS &amp; Insights</span>
              {result?.matchScore !== undefined && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {result.matchScore}%
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSidePanelTab('customization')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${sidePanelTab === 'customization'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Customization</span>
            </button>
          </div>

          {/* TAB 1: GENERATION & STRATEGY */}
          {sidePanelTab === 'generation' && (
            <div className="space-y-4 animate-in fade-in duration-200">
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

                {/* AI Description Nudging Toggle Switch */}
                <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between gap-3 font-sans">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      AI Description Nudging
                    </span>
                    <span className="text-[10px] text-zinc-400 leading-tight">
                      Adapts project & work descriptions towards target Job Description
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNudgeEnabled(prev => !prev)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${isNudgeEnabled ? 'bg-indigo-600' : 'bg-zinc-800 border border-white/10'
                      }`}
                    title="Toggle AI Description Nudging"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${isNudgeEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                  </button>
                </div>
              </div>

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
                  >
                    Aggressive Bridging
                  </button>
                </div>
              </div>

              {/* Intake Method Toggle & Inputs */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Job Intake Method</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
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

              {intakeMethod === 'url' && (
                <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3 text-left">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Target Job Posting URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={jobUrl}
                      onChange={e => setJobUrl(e.target.value)}
                      placeholder="https://linkedin.com/jobs/view/... or any job posting URL"
                      className="glass-input px-3 py-2 text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleUrlScrape}
                      disabled={scraping || !jobUrl.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5 transition-all shadow-md shrink-0"
                    >
                      {scraping ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Scraping...</span>
                        </>
                      ) : (
                        <span>Scrape (5 tokens)</span>
                      )}
                    </button>
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
                          <span className="text-xs text-white font-medium">Select JD PDF (5 tokens)</span>
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

                <div className="flex flex-col gap-1 mt-3">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase text-left">Overarching Theme / Directive (Optional)</label>
                  <textarea
                    value={themeDirective}
                    onChange={e => setThemeDirective(e.target.value)}
                    placeholder="e.g. Focus heavily on my leadership experience and crisis management in the cover letter..."
                    rows={3}
                    className="glass-input px-3 py-2 text-xs w-full resize-none"
                  />
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
                type="button"
                onClick={handleTailor}
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Analyzing Job &amp; Tailoring Documents...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Tailor CV &amp; Cover Letter (20 tokens)
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: ATS SCORES & INTELLIGENCE */}
          {sidePanelTab === 'ats' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {!result ? (
                <div className="p-8 border border-white/5 bg-zinc-900/30 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">No ATS Analysis Yet</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1">
                      Fill out your target job details in the <strong>Generation</strong> tab and click <strong>Tailor CV &amp; Cover Letter</strong> to compute live keyword matching, score breakdowns, and actionable recommendations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSidePanelTab('generation')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
                  >
                    Go to Generation Tab
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-md font-bold text-white mb-2 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-400" />
                      AI Match Scorecard &amp; Insights
                    </h2>
                    <div className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4 border-zinc-800 shrink-0">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow"></div>
                        <span className="font-extrabold text-white text-lg">{result.matchScore}%</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">Keyword / Skill Alignment</h4>
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
                      <div className="flex flex-wrap gap-1 min-h-[40px] border border-dashed border-emerald-500/10 rounded p-1 items-center">
                        {result.gapAnalysis.matchingKeywords.map((k, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 flex items-center gap-1.5">
                            {k}
                            <button
                              onClick={() => handleRemoveSkillInteractive(k)}
                              className="hover:text-rose-400 hover:bg-white/10 rounded-full w-3.5 h-3.5 flex items-center justify-center transition-colors cursor-pointer text-[9px] font-bold"
                              title={`Remove ${k} from CV`}
                            >
                              ×
                            </button>
                          </span>
                        ))}

                        {isAddingCustomSkill ? (
                          <input
                            type="text"
                            value={customSkillInput}
                            onChange={(e) => setCustomSkillInput(e.target.value)}
                            onBlur={() => {
                              const val = customSkillInput.trim();
                              if (val) {
                                setSkillModal({
                                  isOpen: true,
                                  skillName: val,
                                  isGap: false,
                                  alsoSaveToProfile: true
                                });
                              }
                              setIsAddingCustomSkill(false);
                              setCustomSkillInput('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const val = customSkillInput.trim();
                                if (val) {
                                  setSkillModal({
                                    isOpen: true,
                                    skillName: val,
                                    isGap: false,
                                    alsoSaveToProfile: true
                                  });
                                }
                                setIsAddingCustomSkill(false);
                                setCustomSkillInput('');
                              } else if (e.key === 'Escape') {
                                setIsAddingCustomSkill(false);
                                setCustomSkillInput('');
                              }
                            }}
                            autoFocus
                            placeholder="Type skill..."
                            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white w-20 focus:outline-none focus:border-indigo-500"
                          />
                        ) : (
                          <button
                            onClick={() => setIsAddingCustomSkill(true)}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5 transition-colors cursor-pointer"
                            title="Add custom skill"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            Add Skill
                          </button>
                        )}
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
                      {result.gapAnalysis.missingSkills.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const missing = [...result.gapAnalysis.missingSkills];
                            missing.forEach(s => handleAddSkillInteractive(s, true));
                          }}
                          className="mt-2 w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-amber-500/30 hover:border-amber-500/50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add All Missing Keywords ({result.gapAnalysis.missingSkills.length})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs space-y-3">
                    <h4 className="font-bold text-indigo-300 border-b border-indigo-500/10 pb-1.5 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-400" />
                      AI Placement Recommendation
                    </h4>
                    {renderRecommendation(result.gapAnalysis.recommendations)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOMIZATION & SPACING */}
          {sidePanelTab === 'customization' && (
            <div className="animate-in fade-in duration-200">
              <SectionControlsPanel
                result={result}
                setResult={setResult}
                profile={profile}
                setProfile={setProfile}
                sectionOrder={sectionOrder}
                setSectionOrder={setSectionOrder}
                hiddenSections={hiddenSections}
                setHiddenSections={setHiddenSections}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                showSignatureSection={showSignatureSection}
                setShowSignatureSection={setShowSignatureSection}
                showSignatureImage={showSignatureImage}
                setShowSignatureImage={setShowSignatureImage}
                signingLocation={signingLocation}
                setSigningLocation={setSigningLocation}
                customSections={customSections}
                setCustomSections={setCustomSections}
                cvLanguage={cvLanguage}
                clLanguage={clLanguage}
                fontSize={fontSize}
                setFontSize={setFontSize}
                sectionSpacing={sectionSpacing}
                setSectionSpacing={setSectionSpacing}
                headerSpacing={headerSpacing}
                setHeaderSpacing={setHeaderSpacing}
                pagePaddingTop={pagePaddingTop}
                setPagePaddingTop={setPagePaddingTop}
                pagePaddingBottom={pagePaddingBottom}
                setPagePaddingBottom={setPagePaddingBottom}
                pagePaddingSide={pagePaddingSide}
                setPagePaddingSide={setPagePaddingSide}
                bulletSpacing={bulletSpacing}
                setBulletSpacing={setBulletSpacing}
                signatureSpacing={signatureSpacing}
                setSignatureSpacing={setSignatureSpacing}
                applyPreset={applyPreset}
                skillsLayout={skillsLayout}
                setSkillsLayout={setSkillsLayout}
                handleOpenRegenModal={handleOpenRegenModal}
                handleFetchBulletVariations={handleFetchBulletVariations}
                handleFetchProjectVariations={handleFetchProjectVariations}
                showAlert={showAlert}
              />
            </div>
          )}
        </div>

        {/* Right Preview Pane: Col 7 */}
        <div className={`w-full col-span-1 lg:col-span-7 bg-[var(--layout-surface-card-bg)]/30 flex flex-col overflow-y-auto h-[calc(100vh-125px)] lg:h-auto lg:max-h-[calc(100vh-73px)] ${activeMobileTab === 'preview' ? 'block' : 'hidden lg:block'
          }`}>
          {/* Multi-Row Sticky Responsive Toolbar */}
          <div className="sticky top-[49px] sm:top-0 z-40 no-print flex flex-col gap-2.5 px-3 sm:px-6 py-2.5 sm:py-3 bg-[var(--layout-surface-panel-bg)]/95 backdrop-blur-md border-b border-white/5 font-sans">
            {/* Top Row: Document Tabs & Layout Modes & Export Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap w-full sm:w-auto">
                <div className="flex gap-1.5 font-sans w-full sm:w-auto">
                  <button
                    onClick={() => setPreviewTab('cv')}
                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${previewTab === 'cv'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    Tailored {cvLanguage === 'DE' ? 'Lebenslauf' : 'Resume'}
                  </button>
                  <button
                    onClick={() => setPreviewTab('coverLetter')}
                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${previewTab === 'coverLetter'
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    Tailored {clLanguage === 'DE' ? 'Anschreiben' : 'Cover Letter'}
                  </button>
                </div>

                <div className="flex bg-white/5 backdrop-blur-md border border-white/10 rounded-lg p-0.5 font-sans w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsAtsMode(false)}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all cursor-pointer ${!isAtsMode
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    Visual Layout (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAtsMode(true)}
                    className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 rounded-md text-[10px] md:text-xs font-bold transition-all cursor-pointer ${isAtsMode
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                  >
                    Strict ATS Layout
                  </button>
                </div>
              </div>

              {/* Top Row Right: Height badge & Export Format button */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-white/5">
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

                {result && (
                  <div className="relative no-print font-sans z-50">
                    <button
                      onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Format</span>
                    </button>

                    {exportDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setExportDropdownOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-white/15 rounded-xl shadow-2xl z-50 py-1.5 text-xs text-zinc-300 backdrop-blur-xl">
                          <button
                            onClick={() => {
                              setExportDropdownOpen(false);
                              handleExportPdf(previewTab === 'cv' ? 'cv' : 'cl');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Download PDF Document (.pdf)</span>
                          </button>
                          <button
                            onClick={() => {
                              setExportDropdownOpen(false);
                              handleExportWord();
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-400" />
                            <span>Download MS Word Document (.doc)</span>
                          </button>
                          <button
                            onClick={() => {
                              setExportDropdownOpen(false);
                              handleExportText();
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-white/10 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                          >
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Download Plain Text (.txt)</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: Layout Presets & ATS Toolbar (Sticky on top of document) */}
            {result && previewTab === 'cv' && (
              <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2.5 text-white font-sans text-xs">
                {/* Left Group: Layout & Spacing Presets */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-zinc-300 text-[11px]">Spacing:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => applyPreset('default')}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Default
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('compact')}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Compact
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('tight')}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        Ultra-Tight
                      </button>
                    </div>
                  </div>

                  {/* Section Layout Order Dropdown */}
                  <div className="flex items-center gap-1.5 border-l border-zinc-700/60 pl-3">
                    <span className="font-semibold text-zinc-400 text-[10px]">Layout:</span>
                    <select
                      value={
                        sectionOrder[1] === 'work' ? 'work' : sectionOrder[1] === 'skills' ? 'skills' : 'education'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'work') setSectionOrder(['summary', 'work', 'projects', 'education', 'skills', 'languages']);
                        else if (val === 'skills') setSectionOrder(['summary', 'skills', 'projects', 'work', 'education', 'languages']);
                        else if (val === 'education') setSectionOrder(['summary', 'education', 'work', 'projects', 'skills', 'languages']);
                      }}
                      className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="work">Work-First</option>
                      <option value="skills">Tech-First</option>
                      <option value="education">Academic-First</option>
                    </select>
                  </div>
                </div>

                {/* Right Group: ATS Highlights, Compare & Fine-Tune Popover */}
                <div className="flex items-center gap-2 flex-wrap relative">
                  <button
                    type="button"
                    onClick={() => setIsCompareModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer shadow-sm"
                    title="Compare Master Profile text side-by-side with Tailored Document"
                  >
                    <GitCompare className="w-3 h-3 text-indigo-400" />
                    <span>⚖️ Compare</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAtsHighlightEnabled((prev) => !prev)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${isAtsHighlightEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      }`}
                    title="Highlight ATS Job Description keywords in preview text"
                  >
                    <Target className="w-3 h-3 text-emerald-400" />
                    <span>ATS Highlights {isAtsHighlightEnabled ? '(ON)' : '(OFF)'}</span>
                  </button>

                  {(() => {
                    const stats = getAtsMatchStats();
                    if (!stats) return null;
                    const colorClass = stats.percentage >= 75
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : stats.percentage >= 50
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300';
                    return (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${colorClass}`} title={`${stats.matched} matched out of ${stats.total} total extracted job keywords`}>
                        <span>ATS: {stats.matched}/{stats.total} ({stats.percentage}%)</span>
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => setIsAdjustSpacingOpen((prev) => !prev)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${isAdjustSpacingOpen
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      }`}
                    title="Fine-tune exact pixel spacing and margins"
                  >
                    <Sliders className="w-3 h-3 text-indigo-400" />
                    <span>⚙️ Fine-Tune</span>
                  </button>

                  {/* Fine-Tune Spacing Floating Popover */}
                  {isAdjustSpacingOpen && (
                    <div className="absolute right-0 top-9 z-50 bg-zinc-900/98 border border-zinc-700/90 rounded-2xl p-4 shadow-2xl backdrop-blur-xl text-xs text-white w-80 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="font-bold text-indigo-300 text-[11px] uppercase tracking-wider flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                          Fine-Tune Page Spacing (Live)
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAdjustSpacingOpen(false)}
                          className="text-zinc-400 hover:text-white p-0.5 rounded hover:bg-zinc-800 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="space-y-2.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Section Spacing:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="4"
                              max="36"
                              value={sectionSpacing}
                              onChange={e => setSectionSpacing(parseInt(e.target.value))}
                              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-zinc-200 font-semibold w-8 text-right">{sectionSpacing}px</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Header Gap:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="2"
                              max="32"
                              value={headerSpacing}
                              onChange={e => setHeaderSpacing(parseInt(e.target.value))}
                              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-zinc-200 font-semibold w-8 text-right">{headerSpacing}px</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Font Size:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="9"
                              max="14"
                              step="0.5"
                              value={fontSize}
                              onChange={e => setFontSize(parseFloat(e.target.value))}
                              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-zinc-200 font-semibold w-8 text-right">{fontSize}px</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Bullet Spacing:</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min="1"
                              max="14"
                              value={bulletSpacing}
                              onChange={e => setBulletSpacing(parseInt(e.target.value))}
                              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-zinc-200 font-semibold w-8 text-right">{bulletSpacing}px</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Page Margins:</span>
                          <div className="flex items-center gap-2">
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
                              className="w-24 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                            <span className="text-zinc-200 font-semibold w-8 text-right">{pagePaddingTop}mm</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Real-time page overflow alert */}
          {result && numPages > 1 && lengthTarget.includes('1-Page') && previewTab === 'cv' && (
            <div className="no-print mx-4 sm:mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs flex items-center justify-between gap-3 text-rose-300 font-sans animate-in slide-in-from-top duration-300">
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

          {/* Live A4 Sheet Render - Fully Scrollable on Mobile */}
          <div className="flex-1 p-3 sm:p-6 md:p-8 bg-[var(--layout-workspace-bg)] flex flex-col items-center justify-start overflow-x-auto overflow-y-auto w-full max-w-full">
            {result ? (
              <div className="w-full max-w-full sm:max-w-[210mm] flex flex-col items-center">


                {/* Hidden Sections Unhide Banner */}
                {hiddenSections.length > 0 && (
                  <div className="w-full max-w-[210mm] no-print mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-3 text-amber-300 font-sans text-xs animate-in slide-in-from-top duration-200">
                    <div className="flex items-center gap-2">
                      <EyeOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>
                        <strong>{hiddenSections.length} Hidden Section(s):</strong>{' '}
                        {hiddenSections.map((s) => (s === 'summary' ? 'Summary' : s === 'work' ? 'Work History' : s === 'education' ? 'Education' : s === 'projects' ? 'Projects' : s === 'skills' ? 'Skills' : 'Languages')).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {hiddenSections.map((secKey) => {
                        const label = secKey === 'summary' ? 'Summary' : secKey === 'work' ? 'Work' : secKey === 'education' ? 'Education' : secKey === 'projects' ? 'Projects' : secKey === 'skills' ? 'Skills' : 'Languages';
                        return (
                          <button
                            key={secKey}
                            type="button"
                            onClick={() => handleToggleHideSection(secKey)}
                            className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Unhide {label}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setHiddenSections([])}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Unhide All
                      </button>
                    </div>
                  </div>
                )}

                <div ref={previewContainerRef} className="w-full overflow-hidden shadow-2xl rounded-lg border border-white/5 flex flex-col items-center py-4">
                  {result && previewTab === 'cv' && (
                    <div
                      id="cv-measurement-root"
                      className="absolute left-[-9999px] top-[-9999px] flex flex-col bg-white text-gray-800 no-print"
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
                        const containerW = previewWidth > 0 ? previewWidth : (typeof window !== 'undefined' ? Math.min(window.innerWidth - 24, 794) : 360);
                        const rawScale = containerW < a4Width ? (containerW - 16) / a4Width : 1;
                        const scale = Math.max(0.48, Math.min(1, rawScale));

                        return (
                          <div
                            key={pageIdx}
                            className="cv-page-scale-wrapper flex items-start justify-center no-print"
                            style={{
                              width: '100%',
                              height: `${a4Height * scale}px`,
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
                    const containerW = previewWidth > 0 ? previewWidth : (typeof window !== 'undefined' ? Math.min(window.innerWidth - 24, 794) : 360);
                    const rawScale = containerW < a4Width ? (containerW - 16) / a4Width : 1;
                    const scale = Math.max(0.48, Math.min(1, rawScale));
                    return (
                      <div
                        className="cl-page-scale-wrapper flex items-start justify-center no-print"
                        style={{
                          width: '100%',
                          height: `${a4Height * scale}px`,
                          flexShrink: 0
                        }}
                      >
                        <div
                          ref={clPreviewRef}
                          id="cl-sheet"
                          className="w-[794px] min-h-[1123px] relative flex flex-col justify-between bg-white text-[#1a1a1a] mx-auto shadow-lg print:shadow-none group"
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
                          {/* Cover Letter Header AI Action Bar */}
                          <div className="absolute right-6 top-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 flex items-center gap-1 bg-zinc-900/95 border border-zinc-700/80 rounded-xl p-1.5 text-xs shadow-2xl backdrop-blur-md z-30 font-sans no-print">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRegenModal('coverLetter', clLanguage === 'DE' ? 'Anschreiben' : 'Cover Letter', result.tailoredCoverLetter);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-lg text-white font-bold cursor-pointer transition-all text-xs shadow-md"
                              title="Regenerate Cover Letter with AI"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-200 animate-pulse" />
                              <span>Regenerate Cover Letter (AI)</span>
                            </button>
                          </div>
                          <div className="text-xs">
                            {/* Sender block */}
                            <div className={`${isAtsMode ? 'text-left' : 'text-right'} text-[11.5px] leading-[1.7]`}>
                              <ContentEditable
                                tagName="pre"
                                data-cl-field="senderAddress"
                                value={result.tailoredCoverLetter.senderAddress}
                                onChange={(val) => handleClChange('senderAddress', val, true)}
                                onBlur={(e: any) => handleClChange('senderAddress', e.target.innerText, false)}
                                useInnerText={true}
                                isMeasurement={false}
                                className={`font-sans text-[11.5px] leading-[1.7] whitespace-pre-wrap inline-block ${isAtsMode ? 'text-left w-full' : 'text-right'}`}
                              />
                            </div>

                            {/* Recipient address + Date row */}
                            <div className={isAtsMode ? "mt-10 flex flex-col items-start gap-y-4 text-left font-sans" : "mt-10 flex justify-between items-end text-left font-sans"}>
                              <div>
                                <ContentEditable
                                  tagName="pre"
                                  data-cl-field="recipientAddress"
                                  value={result.tailoredCoverLetter.recipientAddress}
                                  onChange={(val) => handleClChange('recipientAddress', val, true)}
                                  onBlur={(e: any) => handleClChange('recipientAddress', e.target.innerText, false)}
                                  useInnerText={true}
                                  isMeasurement={false}
                                  className="font-sans text-[11.5px] leading-[1.7] whitespace-pre-wrap"
                                />
                              </div>
                              <ContentEditable
                                tagName="div"
                                value={result.tailoredCoverLetter.dateLine}
                                onChange={(val) => handleClChange('dateLine', val, true)}
                                onBlur={(e: any) => handleClChange('dateLine', e.target.innerText, false)}
                                useInnerText={true}
                                isMeasurement={false}
                                className="text-[11.5px]"
                              />
                            </div>

                            {/* Subject line */}
                            <ContentEditable
                              tagName="p"
                              value={result.tailoredCoverLetter.subjectLine}
                              onChange={(val) => handleClChange('subjectLine', val, true)}
                              onBlur={(e: any) => handleClChange('subjectLine', e.target.innerText, false)}
                              useInnerText={true}
                              isMeasurement={false}
                              className="mt-12 font-bold text-[12px] text-left font-sans"
                            />

                            {/* Salutation */}
                            <ContentEditable
                              tagName="p"
                              value={result.tailoredCoverLetter.salutation}
                              onChange={(val) => handleClChange('salutation', val, true)}
                              onBlur={(e: any) => handleClChange('salutation', e.target.innerText, false)}
                              useInnerText={true}
                              isMeasurement={false}
                              className="mt-8 text-[11.5px] text-left font-sans"
                            />

                            {/* Body paragraphs */}
                            <div className="mt-5 space-y-4 text-[11.5px] leading-[1.65] text-left font-sans">
                              {getRenderedParagraphs(result.tailoredCoverLetter, clLength).map((p: string, i: number) => (
                                <div key={i} className="group relative">
                                  <ContentEditable
                                    tagName="p"
                                    value={p}
                                    onChange={(val) => handleClParagraphChange(i, val, true)}
                                    onBlur={(e: any) => handleClParagraphChange(i, e.target.innerHTML, false)}
                                    isMeasurement={false}
                                    highlightHtml={isAtsHighlightEnabled ? getHighlightedHtml(p) : undefined}
                                    className="focus:outline-none"
                                  />
                                  <div className="no-print opacity-0 group-hover:opacity-100 absolute -right-2 top-0 flex items-center gap-1 shrink-0 transition-opacity">
                                    <button
                                      type="button"
                                      onClick={() => handleFetchClParagraphVariations(i, p)}
                                      className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 cursor-pointer px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all border border-indigo-200 shadow-sm"
                                      title="Polish paragraph with AI (2 Tokens)"
                                    >
                                      <Wand2 className="w-3 h-3 text-indigo-500" />
                                      <span>Polish</span>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Closing */}
                            <ContentEditable
                              tagName="p"
                              value={result.tailoredCoverLetter.closing}
                              onChange={(val) => handleClChange('closing', val, true)}
                              onBlur={(e: any) => handleClChange('closing', e.target.innerText, false)}
                              useInnerText={true}
                              isMeasurement={false}
                              className="mt-8 text-[11.5px] text-left font-sans"
                            />

                            {/* Signature */}
                            <div className="mt-3 h-[32px] flex items-end select-none" aria-hidden="true">
                              {result.tailoredCv.personalDetails.signature ? (
                                <img
                                  src={result.tailoredCv.personalDetails.signature}
                                  alt=""
                                  aria-hidden="true"
                                  className="max-h-full max-w-[120px] object-contain"
                                />
                              ) : (
                                <svg
                                  width="80"
                                  height="32"
                                  viewBox="0 0 80 32"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  aria-hidden="true"
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
                            <ContentEditable
                              tagName="p"
                              value={result.tailoredCoverLetter.signatureName}
                              onChange={(val) => handleClChange('signatureName', val, true)}
                              onBlur={(e: any) => handleClChange('signatureName', e.target.innerText, false)}
                              useInnerText={true}
                              isMeasurement={false}
                              className="mt-1.5 text-[11.5px] text-left font-sans"
                            />

                            {/* Enclosures */}
                            <div className="mt-8 text-[11.5px] text-left font-sans">
                              <p>Enclosure:</p>
                              <ContentEditable
                                tagName="div"
                                data-cl-field="enclosure"
                                value={
                                  result.tailoredCoverLetter.enclosure !== undefined
                                    ? result.tailoredCoverLetter.enclosure
                                    : "- Curriculum Vitae\n- Bachelor Degree Diploma\n- Reference letter from previous employers"
                                }
                                onChange={(val) => handleClChange('enclosure', val, true)}
                                onBlur={(e: any) => handleClChange('enclosure', e.target.innerText, false)}
                                useInnerText={true}
                                isMeasurement={false}
                                className="ml-4 mt-1 whitespace-pre-wrap outline-none font-sans text-[11.5px] leading-[1.7] text-left"
                              />
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

      {/* Premium Skill Confirmation Modal Overlay */}
      {skillModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 font-sans text-left">
            <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                Add Skill to Application
              </h3>
              <button
                onClick={() => setSkillModal(prev => ({ ...prev, isOpen: false }))}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Skill Name</label>
                <input
                  type="text"
                  value={skillModal.skillName}
                  onChange={(e) => setSkillModal(prev => ({ ...prev, skillName: e.target.value }))}
                  className="bg-zinc-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Next.js"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="modalAlsoSaveToProfile"
                  checked={skillModal.alsoSaveToProfile}
                  onChange={(e) => setSkillModal(prev => ({ ...prev, alsoSaveToProfile: e.target.checked }))}
                  className="accent-indigo-500 rounded cursor-pointer"
                />
                <label htmlFor="modalAlsoSaveToProfile" className="text-zinc-300 select-none cursor-pointer">
                  Also save to Master Profile database
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex gap-3">
              <button
                onClick={() => {
                  executeAddSkill(skillModal.skillName, skillModal.isGap, skillModal.alsoSaveToProfile);
                  setSkillModal(prev => ({ ...prev, isOpen: false }));
                }}
                disabled={!skillModal.skillName.trim()}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-center text-xs font-bold transition-colors cursor-pointer"
              >
                Add Skill
              </button>
              <button
                onClick={() => setSkillModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-center text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Regeneration Modal */}
      {regenModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    Regenerate {regenModal.sectionTitle}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Customize prompt instruction for AI section generation (5 Tokens)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRegenModal({ isOpen: false, sectionKey: '', sectionTitle: '', currentContent: null })}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preset Prompt Chips */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 block">Select Quick Directive Preset:</label>
              <div className="flex flex-wrap gap-1.5">
                {(regenModal.sectionKey === 'coverLetter' ? [
                  'Corporate Formal (DIN 5008)',
                  'Energetic & Enthusiastic',
                  'Executive Leadership',
                  'Short & Punchy (under 250 words)',
                  'Highlight technical achievements'
                ] : [
                  'More metric-focused & STAR formula',
                  'Emphasize leadership & ownership',
                  'More technical & ATS keyword dense',
                  'Shorten & make more punchy',
                  'Highlight cloud & modern devops tech'
                ]).map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setSelectedPresetChip(selectedPresetChip === chip ? null : chip)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${selectedPresetChip === chip
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                      : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instruction Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 block">Custom AI Instructions (Optional):</label>
              <textarea
                value={customRegenInstruction}
                onChange={(e) => setCustomRegenInstruction(e.target.value)}
                placeholder="e.g. Highlight React, Next.js, and API optimization achievements specifically..."
                rows={3}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none font-sans"
              />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>Cost: <strong>5 Tokens</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isRegeneratingSection}
                  onClick={() => setRegenModal({ isOpen: false, sectionKey: '', sectionTitle: '', currentContent: null })}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isRegeneratingSection}
                  onClick={handleExecuteSectionRegen}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 cursor-pointer transition-all shadow-lg shadow-indigo-600/20"
                >
                  {isRegeneratingSection ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Regenerating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Section</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bullet Point Polish Modal */}
      {bulletPolishModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 font-sans text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    Polish Bullet Point with AI
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Select an AI variation to replace your bullet point (2 Tokens)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulletPolishModal({ isOpen: false, expIndex: -1, bulletIndex: -1, originalBullet: '', variations: null })}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300">
              <span className="text-zinc-500 font-bold block mb-1">Original Bullet:</span>
              <p className="italic">{bulletPolishModal.originalBullet}</p>
            </div>

            {isPolishingBullet ? (
              <div className="p-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-zinc-400">Crafting 3 AI variations tailored to job description...</p>
              </div>
            ) : bulletPolishModal.variations ? (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                <label className="text-xs font-semibold text-zinc-300 block">AI Suggested Variations:</label>

                {/* STAR Variation */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-indigo-500/30 hover:border-indigo-500 transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                      STAR Formula (Metric Heavy)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyBulletVariation(bulletPolishModal.variations!.star)}
                      className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Apply This
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{bulletPolishModal.variations.star}</p>
                </div>

                {/* Punchy Variation */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      Concise & Punchy
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyBulletVariation(bulletPolishModal.variations!.punchy)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Apply This
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{bulletPolishModal.variations.punchy}</p>
                </div>

                {/* ATS Keyword Variation */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 group">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                      ATS Keyword-Dense
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyBulletVariation(bulletPolishModal.variations!.ats)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      Apply This
                    </button>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">{bulletPolishModal.variations.ats}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Cover Letter Paragraph Polish Modal */}
      {clPolishModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4 font-sans text-left overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                    Polish Cover Letter Paragraph
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Generate 3 tailored tone variations (2 Tokens)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClPolishModal({ isOpen: false, paraIndex: -1, originalPara: '', variations: null })}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 space-y-4 flex-1">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Original Paragraph:</span>
                <p className="text-xs text-zinc-300 italic leading-relaxed">{clPolishModal.originalPara}</p>
              </div>

              {/* Optional Custom User Directive Prompt Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 block">Optional Writing Prompt Directive:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clCustomPrompt}
                    onChange={(e) => setClCustomPrompt(e.target.value)}
                    placeholder="e.g. Focus on WebSockets, low-latency, and senior leadership experience..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={isPolishingClPara}
                    onClick={() => handleFetchClParagraphVariations(clPolishModal.paraIndex, clPolishModal.originalPara)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPolishingClPara ? 'animate-spin' : ''}`} />
                    <span>Re-Polish</span>
                  </button>
                </div>
              </div>

              {isPolishingClPara ? (
                <div className="p-8 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                  <p className="text-xs text-zinc-400">Generating 3 executive tone variations...</p>
                </div>
              ) : clPolishModal.variations ? (
                <div className="space-y-3">
                  {/* Persuasive Variation */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        Persuasive & High Impact
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyClParagraphVariation(clPolishModal.variations!.persuasive)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Apply This
                      </button>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{clPolishModal.variations.persuasive}</p>
                  </div>

                  {/* Formal Corporate Variation */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        Formal Corporate (DIN 5008)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyClParagraphVariation(clPolishModal.variations!.formal)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Apply This
                      </button>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{clPolishModal.variations.formal}</p>
                  </div>

                  {/* Short & Concise Variation */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                        Short & Concise (Direct)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyClParagraphVariation(clPolishModal.variations!.concise)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Apply This
                      </button>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{clPolishModal.variations.concise}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Project Description Polish Modal */}
      {projectPolishModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-xl w-full flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AI Project Polish: {projectPolishModal.projectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProjectPolishModal({ isOpen: false, projectIndex: -1, originalDescription: '', projectName: '', variations: null })}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Original Description Display */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Original Project Description:
                </label>
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/5 text-xs text-zinc-300">
                  {projectPolishModal.originalDescription}
                </div>
              </div>

              {/* Custom Prompt Directives Box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Custom AI Directive (Optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectCustomPrompt}
                    onChange={(e) => setProjectCustomPrompt(e.target.value)}
                    placeholder="e.g. Highlight React & Next.js architecture, emphasize metrics..."
                    className="flex-1 bg-zinc-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchProjectVariations(projectPolishModal.projectIndex, projectPolishModal.originalDescription, projectPolishModal.projectName)}
                    disabled={isPolishingProject}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isPolishingProject ? 'Polishing...' : 'Re-generate'}</span>
                  </button>
                </div>
              </div>

              {/* Variations Display */}
              {isPolishingProject ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-indigo-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-semibold">Crafting project variations with DeepSeek AI...</span>
                </div>
              ) : projectPolishModal.variations ? (
                <div className="space-y-3 pt-2">
                  {/* ATS Keyword Aligned Variation */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase">
                        🎯 ATS Keyword Aligned
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyProjectVariation(projectPolishModal.variations!.ats)}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Apply Variation
                      </button>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{projectPolishModal.variations.ats}</p>
                  </div>

                  {/* Impact & Metrics Variation */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        🚀 Impact & Metrics Driven
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyProjectVariation(projectPolishModal.variations!.impact)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Apply Variation
                      </button>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{projectPolishModal.variations.impact}</p>
                  </div>

                  {/* Short & Punchy Variation */}
                  <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2 group">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                        ⚡ Short & Concise
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApplyProjectVariation(projectPolishModal.variations!.concise)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Apply Variation
                      </button>
                    </div>
                    <p className="text-xs text-zinc-200 leading-relaxed">{projectPolishModal.variations.concise}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Compare Original vs Tailored Modal */}
      {isCompareModalOpen && result && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 no-print">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Document Version Comparer: Master Profile vs. AI Tailored Output
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCompareModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 flex-1 overflow-y-auto divide-x divide-white/10 text-xs">
              {/* Left: Original Master Profile */}
              <div className="p-6 space-y-4 bg-zinc-900/30">
                <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm p-2 rounded-lg border border-zinc-800 font-bold text-zinc-400 uppercase tracking-wider text-[11px] mb-3">
                  📋 Original Master Profile
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Full Name: {profile?.fullName || 'Not provided'}</h4>
                  <p className="text-zinc-400">Target Occupation: {profile?.targetOccupation || 'Not specified'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-zinc-300 mb-1 uppercase tracking-wider text-[10px]">Master Summary</h4>
                  <p className="text-zinc-400 bg-zinc-900 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">
                    {profile?.summary || 'No master summary provided.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-zinc-300 mb-1 uppercase tracking-wider text-[10px]">Master Experience</h4>
                  <div className="space-y-2">
                    {profile?.workExperience?.map((w: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400">
                        <span className="font-semibold text-zinc-200 block">{w.role} at {w.company}</span>
                        <span className="text-[10px] text-zinc-500 block mb-1">{w.period}</span>
                        <p className="line-clamp-3">{w.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: AI Tailored Output */}
              <div className="p-6 space-y-4 bg-zinc-950">
                <div className="sticky top-0 bg-indigo-950/90 backdrop-blur-sm p-2 rounded-lg border border-indigo-800/50 font-bold text-indigo-300 uppercase tracking-wider text-[11px] mb-3 flex items-center justify-between">
                  <span>✨ AI Tailored Document Output</span>
                  <span className="text-emerald-400 text-[10px]">Match Score: {result.matchScore}%</span>
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Full Name: {result.tailoredCv.personalDetails.fullName}</h4>
                  <p className="text-indigo-300 font-semibold">{roleName || 'Tailored Position'}</p>
                </div>
                <div>
                  <h4 className="font-bold text-indigo-300 mb-1 uppercase tracking-wider text-[10px]">Tailored Summary</h4>
                  <p className="text-zinc-200 bg-indigo-500/5 p-3 rounded-lg border border-indigo-500/20 whitespace-pre-wrap">
                    {result.tailoredCv.summary}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-indigo-300 mb-1 uppercase tracking-wider text-[10px]">Tailored Work Experience</h4>
                  <div className="space-y-2">
                    {result.tailoredCv.workExperience?.map((w: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-zinc-300">
                        <span className="font-semibold text-white block">{w.role} at {w.company}</span>
                        <span className="text-[10px] text-indigo-400 block mb-1">{w.period}</span>
                        <ul className="list-disc pl-4 space-y-1 text-zinc-300 text-[11px]">
                          {getRenderedBullets(w, bulletStyle, lengthTarget, idx === 0).map((b: string, bIdx: number) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

