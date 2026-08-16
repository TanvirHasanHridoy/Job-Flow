'use client';

import React, { useState } from 'react';
import {
  ChevronUp, ChevronDown, Eye, EyeOff, Plus, Trash2, Sparkles, Wand2,
  Briefcase, GraduationCap, FolderGit, Code2, FileText, Layers, PenTool,
  Sliders, AlignLeft, List, Tag, CheckSquare, Square, ChevronRight, Check, X, ExternalLink,
  GripVertical, Award, ArrowUp, ArrowDown, ArrowLeft, ArrowRight
} from 'lucide-react';
import { CustomSection, CustomSectionType, CustomSectionItem, CustomSectionSubgroup, createDefaultCustomSection } from '@/lib/customSections';

interface SectionControlsPanelProps {
  result: any;
  setResult: React.Dispatch<React.SetStateAction<any>>;
  profile: any;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  sectionOrder: string[];
  setSectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
  hiddenSections: string[];
  setHiddenSections: React.Dispatch<React.SetStateAction<string[]>>;
  selectedProjects: string[];
  setSelectedProjects: React.Dispatch<React.SetStateAction<string[]>>;
  showSignatureSection: boolean;
  setShowSignatureSection: React.Dispatch<React.SetStateAction<boolean>>;
  showSignatureImage: boolean;
  setShowSignatureImage: React.Dispatch<React.SetStateAction<boolean>>;
  signingLocation: string;
  setSigningLocation: React.Dispatch<React.SetStateAction<string>>;
  customSections: CustomSection[];
  setCustomSections: React.Dispatch<React.SetStateAction<CustomSection[]>>;
  cvLanguage: 'EN' | 'DE';
  clLanguage: 'EN' | 'DE';
  // Spacing props
  fontSize: number;
  setFontSize: (val: number) => void;
  sectionSpacing: number;
  setSectionSpacing: (val: number) => void;
  headerSpacing: number;
  setHeaderSpacing: (val: number) => void;
  pagePaddingTop: number;
  setPagePaddingTop: (val: number) => void;
  pagePaddingBottom: number;
  setPagePaddingBottom: (val: number) => void;
  pagePaddingSide: number;
  setPagePaddingSide: (val: number) => void;
  bulletSpacing: number;
  setBulletSpacing: (val: number) => void;
  signatureSpacing: number;
  setSignatureSpacing: (val: number) => void;
  applyPreset: (preset: 'default' | 'compact' | 'tight') => void;
  skillsLayout: 'level' | 'category';
  setSkillsLayout: (val: 'level' | 'category') => void;
  handleOpenRegenModal: (sectionKey: string, sectionTitle: string, currentContent: any) => void;
  handleFetchBulletVariations?: (expIdx: number, bIdx: number, bulletText: string) => void;
  handleFetchProjectVariations?: (projIdx: number, projName: string, desc: string) => void;
  showAlert: (opts: { title: string; message: string; type?: 'success' | 'error' | 'warning' | 'info' }) => void;
}

export default function SectionControlsPanel({
  result,
  setResult,
  profile,
  setProfile,
  sectionOrder,
  setSectionOrder,
  hiddenSections,
  setHiddenSections,
  selectedProjects,
  setSelectedProjects,
  showSignatureSection,
  setShowSignatureSection,
  showSignatureImage,
  setShowSignatureImage,
  signingLocation,
  setSigningLocation,
  customSections,
  setCustomSections,
  cvLanguage,
  clLanguage,
  fontSize,
  setFontSize,
  sectionSpacing,
  setSectionSpacing,
  headerSpacing,
  setHeaderSpacing,
  pagePaddingTop,
  setPagePaddingTop,
  pagePaddingBottom,
  setPagePaddingBottom,
  pagePaddingSide,
  setPagePaddingSide,
  bulletSpacing,
  setBulletSpacing,
  signatureSpacing,
  setSignatureSpacing,
  applyPreset,
  skillsLayout,
  setSkillsLayout,
  handleOpenRegenModal,
  handleFetchBulletVariations,
  handleFetchProjectVariations,
  showAlert
}: SectionControlsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    work: true,
    education: false,
    projects: false,
    skills: false,
    signature: false
  });

  // Drag-and-drop state for sections
  const [draggedSectionKey, setDraggedSectionKey] = useState<string | null>(null);
  const [dragOverSectionKey, setDragOverSectionKey] = useState<string | null>(null);

  // Drag-and-drop state for skill categories / skills
  const [draggedSkillCategory, setDraggedSkillCategory] = useState<string | null>(null);
  const [dragOverSkillCategory, setDragOverSkillCategory] = useState<string | null>(null);

  // New Category input state in skills
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryNameInput, setNewCategoryNameInput] = useState('');
  const [addingSkillToCategory, setAddingSkillToCategory] = useState<string | null>(null);
  const [newSkillInCategoryInput, setNewSkillInCategoryInput] = useState('');

  // Modal States
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [newCustomTitle, setNewCustomTitle] = useState('');
  const [newCustomType, setNewCustomType] = useState<CustomSectionType>('subgroup-items');
  const [saveToVaultOnAdd, setSaveToVaultOnAdd] = useState(false);

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
  const [newSkillCategory, setNewSkillCategory] = useState('Tools & Cloud');

  // Toggle Accordion Collapse
  const toggleAccordion = (secKey: string) => {
    setExpandedSections(prev => ({ ...prev, [secKey]: !prev[secKey] }));
  };

  // Section Drag Reordering
  const handleReorderSectionsDrag = (sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;
    const sourceIdx = sectionOrder.indexOf(sourceKey);
    const targetIdx = sectionOrder.indexOf(targetKey);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const nextOrder = [...sectionOrder];
    const [moved] = nextOrder.splice(sourceIdx, 1);
    nextOrder.splice(targetIdx, 0, moved);
    setSectionOrder(nextOrder);
  };

  // Section Move Up/Down Buttons
  const handleMoveSection = (secKey: string, direction: 'up' | 'down') => {
    const idx = sectionOrder.indexOf(secKey);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sectionOrder.length) return;
    const nextOrder = [...sectionOrder];
    const temp = nextOrder[idx];
    nextOrder[idx] = nextOrder[targetIdx];
    nextOrder[targetIdx] = temp;
    setSectionOrder(nextOrder);
  };

  // Toggle Hide Section
  const handleToggleHideSection = (secKey: string) => {
    setHiddenSections(prev =>
      prev.includes(secKey) ? prev.filter(s => s !== secKey) : [...prev, secKey]
    );
  };

  // Sync with Profile Vault
  const syncToVault = async (updatedProfile: any) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      if (res.ok) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      console.error('Failed to sync to profile vault:', err);
    }
  };

  // Work Experience Operations
  const getBulletsArray = (bullets: any): string[] => {
    if (!bullets) return [];
    if (Array.isArray(bullets)) return bullets;
    if (typeof bullets === 'object') {
      const list = bullets.star || bullets.punchy || bullets.standard || Object.values(bullets).find(Array.isArray);
      if (Array.isArray(list)) return list as string[];
    }
    return [];
  };

  const updateWorkBullets = (wIdx: number, newBulletsList: string[]) => {
    if (!result?.tailoredCv?.workExperience) return;
    const currentWork = [...result.tailoredCv.workExperience];
    const w = currentWork[wIdx];
    if (!w) return;

    if (Array.isArray(w.bullets)) {
      currentWork[wIdx] = { ...w, bullets: newBulletsList };
    } else if (w.bullets && typeof w.bullets === 'object') {
      const key = w.bullets.star ? 'star' : w.bullets.punchy ? 'punchy' : 'standard';
      currentWork[wIdx] = {
        ...w,
        bullets: {
          ...w.bullets,
          [key]: newBulletsList
        }
      };
    } else {
      currentWork[wIdx] = { ...w, bullets: newBulletsList };
    }

    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        workExperience: currentWork
      }
    });
  };

  const handleMoveWorkExp = (idx: number, direction: 'up' | 'down') => {
    if (!result?.tailoredCv?.workExperience) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= result.tailoredCv.workExperience.length) return;
    const list = [...result.tailoredCv.workExperience];
    const temp = list[idx];
    list[idx] = list[target];
    list[target] = temp;
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, workExperience: list } });
  };

  const handleDeleteWorkExp = (idx: number) => {
    if (!result?.tailoredCv?.workExperience) return;
    const list = result.tailoredCv.workExperience.filter((_: any, i: number) => i !== idx);
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, workExperience: list } });
  };

  const handleAddWorkExp = async () => {
    if (!newWorkRole.trim() || !newWorkCompany.trim() || !result) return;
    const bulletList = newWorkBullets
      .split('\n')
      .map(b => b.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean);

    const newEntry = {
      role: newWorkRole.trim(),
      company: newWorkCompany.trim(),
      location: newWorkLocation.trim(),
      period: newWorkPeriod.trim() || '2024 - Present',
      bullets: bulletList.length > 0 ? bulletList : ['Led core initiatives and delivered key architectural outcomes.']
    };

    const updatedWork = [newEntry, ...(result.tailoredCv.workExperience || [])];
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, workExperience: updatedWork } });

    if (saveToVaultOnAdd && profile) {
      const currentWork = Array.isArray(profile.workExperience) ? profile.workExperience : [];
      const updatedProfile = {
        ...profile,
        workExperience: [
          {
            role: newEntry.role,
            company: newEntry.company,
            location: newEntry.location,
            startDate: newEntry.period.split('-')[0]?.trim() || '',
            endDate: newEntry.period.split('-')[1]?.trim() || 'Present',
            current: newEntry.period.toLowerCase().includes('present'),
            bullets: newEntry.bullets
          },
          ...currentWork
        ]
      };
      await syncToVault(updatedProfile);
    }

    setIsAddWorkModalOpen(false);
    setNewWorkRole('');
    setNewWorkCompany('');
    setNewWorkLocation('');
    setNewWorkPeriod('');
    setNewWorkBullets('');
    setSaveToVaultOnAdd(false);
  };

  // Education Operations
  const handleMoveEducation = (idx: number, direction: 'up' | 'down') => {
    if (!result?.tailoredCv?.education) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= result.tailoredCv.education.length) return;
    const list = [...result.tailoredCv.education];
    const temp = list[idx];
    list[idx] = list[target];
    list[target] = temp;
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, education: list } });
  };

  const handleDeleteEducation = (idx: number) => {
    if (!result?.tailoredCv?.education) return;
    const list = result.tailoredCv.education.filter((_: any, i: number) => i !== idx);
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, education: list } });
  };

  const handleAddEducation = async () => {
    if (!newEduInstitution.trim() || !newEduDegree.trim() || !result) return;
    const newEntry = {
      institution: newEduInstitution.trim(),
      degree: newEduDegree.trim(),
      location: newEduLocation.trim(),
      period: newEduPeriod.trim() || '2020 - 2024'
    };

    const updatedEdu = [newEntry, ...(result.tailoredCv.education || [])];
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, education: updatedEdu } });

    if (saveToVaultOnAdd && profile) {
      const currentEdu = Array.isArray(profile.education) ? profile.education : [];
      const updatedProfile = {
        ...profile,
        education: [
          {
            institution: newEntry.institution,
            degree: newEntry.degree,
            field: '',
            location: newEntry.location,
            startDate: newEntry.period.split('-')[0]?.trim() || '',
            endDate: newEntry.period.split('-')[1]?.trim() || ''
          },
          ...currentEdu
        ]
      };
      await syncToVault(updatedProfile);
    }

    setIsAddEduModalOpen(false);
    setNewEduInstitution('');
    setNewEduDegree('');
    setNewEduLocation('');
    setNewEduPeriod('');
    setSaveToVaultOnAdd(false);
  };

  // Projects Operations
  const handleMoveProject = (idx: number, direction: 'up' | 'down') => {
    if (!result?.tailoredCv?.projects) return;
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= result.tailoredCv.projects.length) return;
    const list = [...result.tailoredCv.projects];
    const temp = list[idx];
    list[idx] = list[target];
    list[target] = temp;
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, projects: list } });
  };

  const handleDeleteProject = (idx: number) => {
    if (!result?.tailoredCv?.projects) return;
    const list = result.tailoredCv.projects.filter((_: any, i: number) => i !== idx);
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, projects: list } });
  };

  const handleToggleProjectVisibility = (projName: string) => {
    setSelectedProjects(prev =>
      prev.includes(projName) ? prev.filter(p => p !== projName) : [...prev, projName]
    );
  };

  const handleAddProject = async () => {
    if (!newProjName.trim() || !result) return;
    const techArray = newProjTech
      .split(/[,]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const newEntry = {
      name: newProjName.trim(),
      description: newProjDesc.trim() || 'High-performance production application and architecture.',
      technologies: techArray.length > 0 ? techArray : ['TypeScript', 'Next.js', 'Node.js'],
      url: newProjUrl.trim()
    };

    const updatedProjects = [newEntry, ...(result.tailoredCv.projects || [])];
    setResult({ ...result, tailoredCv: { ...result.tailoredCv, projects: updatedProjects } });
    if (!selectedProjects.includes(newEntry.name)) {
      setSelectedProjects(prev => [...prev, newEntry.name]);
    }

    if (saveToVaultOnAdd && profile) {
      const currentProjects = Array.isArray(profile.projects) ? profile.projects : [];
      const updatedProfile = {
        ...profile,
        projects: [
          {
            name: newEntry.name,
            description: newEntry.description,
            technologies: newEntry.technologies,
            url: newEntry.url
          },
          ...currentProjects
        ]
      };
      await syncToVault(updatedProfile);
    }

    setIsAddProjModalOpen(false);
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTech('');
    setNewProjUrl('');
    setSaveToVaultOnAdd(false);
  };

  // Helper for Normalized Skills in Category Mode
  const getCategorizedSkillsMap = (): Record<string, string[]> => {
    const rawSkills = result?.tailoredCv?.skills || [];
    const map: Record<string, string[]> = {};

    if (Array.isArray(rawSkills)) {
      rawSkills.forEach((s: any) => {
        if (s && typeof s === 'object') {
          if (s.category && Array.isArray(s.skills)) {
            map[s.category] = [...s.skills];
          } else if (s.name) {
            const cat = s.category || 'Tools & Cloud';
            if (!map[cat]) map[cat] = [];
            if (!map[cat].includes(s.name)) map[cat].push(s.name);
          }
        } else if (typeof s === 'string') {
          const cat = 'General Skills';
          if (!map[cat]) map[cat] = [];
          if (!map[cat].includes(s)) map[cat].push(s);
        }
      });
    }
    return map;
  };

  const updateCategorizedSkillsMap = (newMap: Record<string, string[]>) => {
    const nextSkillsArray: Array<{ category: string; skills: string[] }> = Object.entries(newMap).map(([category, skills]) => ({
      category,
      skills
    }));
    setResult({
      ...result,
      tailoredCv: {
        ...result.tailoredCv,
        skills: nextSkillsArray
      }
    });
  };

  // Reorder Skill Categories
  const handleMoveSkillCategory = (catName: string, direction: 'up' | 'down') => {
    const currentMap = getCategorizedSkillsMap();
    const categories = Object.keys(currentMap);
    const idx = categories.indexOf(catName);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;

    const nextCategories = [...categories];
    const temp = nextCategories[idx];
    nextCategories[idx] = nextCategories[targetIdx];
    nextCategories[targetIdx] = temp;

    const newMap: Record<string, string[]> = {};
    nextCategories.forEach(cat => {
      newMap[cat] = currentMap[cat];
    });
    updateCategorizedSkillsMap(newMap);
  };

  // Reorder Individual Skill Tag inside Category
  const handleMoveSkillInsideCategory = (category: string, skillIdx: number, direction: 'left' | 'right') => {
    const currentMap = getCategorizedSkillsMap();
    const list = currentMap[category] ? [...currentMap[category]] : [];
    const targetIdx = direction === 'left' ? skillIdx - 1 : skillIdx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[skillIdx];
    list[skillIdx] = list[targetIdx];
    list[targetIdx] = temp;

    currentMap[category] = list;
    updateCategorizedSkillsMap(currentMap);
  };

  // Remove Skill from Category
  const handleRemoveSkillFromCategory = (category: string, skillName: string) => {
    const currentMap = getCategorizedSkillsMap();
    if (!currentMap[category]) return;
    currentMap[category] = currentMap[category].filter(s => s !== skillName);
    updateCategorizedSkillsMap(currentMap);
  };

  // Add Skill to Category
  const handleAddSkillToCategory = (category: string) => {
    const val = newSkillInCategoryInput.trim();
    if (!val) {
      setAddingSkillToCategory(null);
      return;
    }
    const currentMap = getCategorizedSkillsMap();
    if (!currentMap[category]) currentMap[category] = [];
    if (!currentMap[category].includes(val)) {
      currentMap[category].push(val);
    }
    updateCategorizedSkillsMap(currentMap);
    setNewSkillInCategoryInput('');
    setAddingSkillToCategory(null);
  };

  // Add New Category
  const handleCreateNewCategory = () => {
    const val = newCategoryNameInput.trim();
    if (!val) {
      setIsAddingNewCategory(false);
      return;
    }
    const currentMap = getCategorizedSkillsMap();
    if (!currentMap[val]) {
      currentMap[val] = [];
      updateCategorizedSkillsMap(currentMap);
    }
    setNewCategoryNameInput('');
    setIsAddingNewCategory(false);
  };

  // Add Skill Modal Handler
  const handleAddSkill = async () => {
    if (!newSkillName.trim() || !result) return;
    const cat = newSkillCategory.trim() || 'Tools & Cloud';
    const currentMap = getCategorizedSkillsMap();
    if (!currentMap[cat]) currentMap[cat] = [];
    if (!currentMap[cat].includes(newSkillName.trim())) {
      currentMap[cat].push(newSkillName.trim());
    }
    updateCategorizedSkillsMap(currentMap);

    if (saveToVaultOnAdd && profile) {
      const currentSkills = Array.isArray(profile.skills) ? profile.skills : [];
      const updatedProfile = {
        ...profile,
        skills: [
          {
            name: newSkillName.trim(),
            level: newSkillLevel,
            category: cat
          },
          ...currentSkills
        ]
      };
      await syncToVault(updatedProfile);
    }

    setIsAddSkillModalOpen(false);
    setNewSkillName('');
    setSaveToVaultOnAdd(false);
  };

  // Custom Section Operations
  const handleAddCustomSection = async () => {
    if (!newCustomTitle.trim()) return;
    const newSec = createDefaultCustomSection(newCustomType, newCustomTitle.trim());
    const updatedCustoms = [...customSections, newSec];
    setCustomSections(updatedCustoms);

    if (!sectionOrder.includes(`custom-${newSec.id}`)) {
      setSectionOrder(prev => [...prev, `custom-${newSec.id}`]);
    }

    if (saveToVaultOnAdd && profile) {
      const currentCustoms = Array.isArray(profile.customSections)
        ? profile.customSections
        : typeof profile.customSections === 'string'
          ? JSON.parse(profile.customSections || '[]')
          : [];
      const updatedProfile = {
        ...profile,
        customSections: JSON.stringify([...currentCustoms, newSec])
      };
      await syncToVault(updatedProfile);
    }

    setIsAddCustomModalOpen(false);
    setNewCustomTitle('');
    setSaveToVaultOnAdd(false);
  };

  const handleDeleteCustomSection = (secId: string) => {
    setCustomSections(prev => prev.filter(c => c.id !== secId));
    setSectionOrder(prev => prev.filter(s => s !== `custom-${secId}`));
  };

  // Subgroup Custom Section item operations (e.g. Certifications)
  const handleAddSubgroupToCustomSec = (secId: string, name: string) => {
    const sec = customSections.find(c => c.id === secId);
    if (!sec) return;
    const subgroups = sec.subgroups ? [...sec.subgroups] : [];
    subgroups.push({
      id: 'sub-' + Date.now(),
      name: name || 'New Category',
      items: ['Sample Certification / Item']
    });
    setCustomSections(prev => prev.map(c => c.id === secId ? { ...c, subgroups } : c));
  };

  const handleAddItemToSubgroup = (secId: string, subId: string, itemText: string) => {
    const sec = customSections.find(c => c.id === secId);
    if (!sec || !sec.subgroups) return;
    const subgroups = sec.subgroups.map(sub => {
      if (sub.id === subId) {
        return { ...sub, items: [...sub.items, itemText || 'New Credential'] };
      }
      return sub;
    });
    setCustomSections(prev => prev.map(c => c.id === secId ? { ...c, subgroups } : c));
  };

  const handleRemoveItemFromSubgroup = (secId: string, subId: string, itemIdx: number) => {
    const sec = customSections.find(c => c.id === secId);
    if (!sec || !sec.subgroups) return;
    const subgroups = sec.subgroups.map(sub => {
      if (sub.id === subId) {
        return { ...sub, items: sub.items.filter((_, i) => i !== itemIdx) };
      }
      return sub;
    });
    setCustomSections(prev => prev.map(c => c.id === secId ? { ...c, subgroups } : c));
  };

  const categorizedSkills = getCategorizedSkillsMap();
  const skillCategories = Object.keys(categorizedSkills);

  return (
    <div className="space-y-5 text-left text-xs font-sans">
      {/* 1. VISUAL SPACING ADJUSTER PRESETS & SLIDERS */}
      <div className="border border-white/10 bg-zinc-950/40 rounded-2xl p-4 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-xs block">Visual Page Spacing</span>
              <span className="text-[10px] text-zinc-400">Fine-tune global gaps & typography live</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-zinc-300 font-semibold">Live Preview</span>
        </div>

        {/* Spacing Presets */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => applyPreset('default')}
            className="py-1.5 text-[11px] font-bold rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer bg-zinc-900/50"
          >
            Default
          </button>
          <button
            type="button"
            onClick={() => applyPreset('compact')}
            className="py-1.5 text-[11px] font-bold rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer bg-zinc-900/50"
          >
            Compact
          </button>
          <button
            type="button"
            onClick={() => applyPreset('tight')}
            className="py-1.5 text-[11px] font-bold rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer bg-zinc-900/50"
          >
            Ultra-Tight
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1 text-[11px]">
          {/* Base Font Size */}
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex justify-between text-zinc-400 text-[10px]">
              <span>Base Font</span>
              <span className="font-bold text-indigo-300">{fontSize}px</span>
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

          {/* Section Gaps */}
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex justify-between text-zinc-400 text-[10px]">
              <span>Section Gaps</span>
              <span className="font-bold text-indigo-300">{sectionSpacing}px</span>
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

          {/* Header Gap */}
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex justify-between text-zinc-400 text-[10px]">
              <span>Header Gap</span>
              <span className="font-bold text-indigo-300">{headerSpacing}px</span>
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

          {/* Bullet Spacing */}
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex justify-between text-zinc-400 text-[10px]">
              <span>Bullet Gaps</span>
              <span className="font-bold text-indigo-300">{bulletSpacing}px</span>
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

          {/* Page Padding Top */}
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex justify-between text-zinc-400 text-[10px]">
              <span>Top Margins</span>
              <span className="font-bold text-indigo-300">{pagePaddingTop}mm</span>
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

          {/* Page Padding Side */}
          <div className="flex flex-col gap-1 p-2 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex justify-between text-zinc-400 text-[10px]">
              <span>Side Margins</span>
              <span className="font-bold text-indigo-300">{pagePaddingSide}mm</span>
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
        </div>
      </div>

      {/* 2. SECTION & ITEM CONTROLS HEADER */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Document Sections</span>
        </div>
        <button
          type="button"
          onClick={() => setIsAddCustomModalOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Section</span>
        </button>
      </div>

      <p className="text-[11px] text-zinc-400 leading-tight">
        Drag sections or use arrows to reorder. Expand any section to edit, reorder, or toggle individual items.
      </p>

      {/* 3. DRAGGABLE SECTION LIST */}
      <div className="space-y-3">
        {sectionOrder.map((secKey, idx) => {
          const isCustom = secKey.startsWith('custom-');
          const customSecId = isCustom ? secKey.replace('custom-', '') : null;
          const customSec = isCustom ? customSections.find(c => c.id === customSecId) : null;
          const isHidden = hiddenSections.includes(secKey);
          const isExpanded = expandedSections[secKey] || false;
          const isDragging = draggedSectionKey === secKey;
          const isOver = dragOverSectionKey === secKey;

          let label = secKey === 'summary' ? (cvLanguage === 'DE' ? 'Berufliches Profil' : 'Professional Profile')
            : secKey === 'work' ? (cvLanguage === 'DE' ? 'Berufserfahrung' : 'Work Experience')
            : secKey === 'education' ? (cvLanguage === 'DE' ? 'Ausbildung' : 'Education')
            : secKey === 'projects' ? (cvLanguage === 'DE' ? 'Projekte' : 'Projects')
            : secKey === 'skills' ? (cvLanguage === 'DE' ? 'Kenntnisse & Fähigkeiten' : 'Skills & Tech Stack')
            : secKey === 'languages' ? (cvLanguage === 'DE' ? 'Sprachen' : 'Languages')
            : secKey === 'signature' ? (cvLanguage === 'DE' ? 'Unterschrift' : 'Signature & Date')
            : customSec?.title || 'Custom Section';

          let icon = secKey === 'summary' ? <FileText className="w-3.5 h-3.5 text-indigo-400" />
            : secKey === 'work' ? <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            : secKey === 'education' ? <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
            : secKey === 'projects' ? <FolderGit className="w-3.5 h-3.5 text-purple-400" />
            : secKey === 'skills' ? <Code2 className="w-3.5 h-3.5 text-amber-400" />
            : secKey === 'signature' ? <PenTool className="w-3.5 h-3.5 text-rose-400" />
            : <Award className="w-3.5 h-3.5 text-cyan-400" />;

          return (
            <div
              key={secKey}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverSectionKey !== secKey) setDragOverSectionKey(secKey);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverSectionKey(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverSectionKey(null);
                const source = e.dataTransfer.getData('text/plain') || draggedSectionKey;
                if (source && source !== secKey) {
                  handleReorderSectionsDrag(source, secKey);
                }
                setDraggedSectionKey(null);
              }}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOver ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                : isHidden ? 'border-zinc-800 bg-zinc-950/20 opacity-60'
                : isDragging ? 'opacity-40 border-indigo-500/50 scale-98'
                : 'border-white/10 bg-zinc-900/60 hover:border-white/20'
              }`}
            >
              {/* Section Card Header */}
              <div className="flex items-center justify-between p-3 gap-2 select-none">
                {/* Drag Handle & Section Icon & Title */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', secKey);
                      setDraggedSectionKey(secKey);
                    }}
                    onDragEnd={() => setDraggedSectionKey(null)}
                    className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-white rounded hover:bg-white/5 transition-colors"
                    title="Drag to reorder section"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div className="p-1.5 rounded-lg bg-white/5 text-zinc-300 shrink-0">
                    {icon}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleAccordion(secKey)}
                    className="flex-1 text-left font-bold text-white text-xs truncate hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {label}
                    {isHidden && <span className="ml-2 text-[10px] text-amber-400 font-normal">(Hidden)</span>}
                  </button>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Up/Down Move Buttons */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveSection(secKey, 'up')}
                    className="p-1 hover:text-white text-zinc-500 disabled:opacity-20 hover:bg-white/5 rounded cursor-pointer transition-colors"
                    title="Move section up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sectionOrder.length - 1}
                    onClick={() => handleMoveSection(secKey, 'down')}
                    className="p-1 hover:text-white text-zinc-500 disabled:opacity-20 hover:bg-white/5 rounded cursor-pointer transition-colors"
                    title="Move section down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* AI Rewrite trigger */}
                  {secKey !== 'signature' && (
                    <button
                      type="button"
                      onClick={() => handleOpenRegenModal(secKey, label, result?.tailoredCv?.[secKey] || customSec)}
                      className="p-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded cursor-pointer transition-colors"
                      title="Regenerate this section with AI"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Hide/Unhide toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleHideSection(secKey)}
                    className={`p-1 rounded cursor-pointer transition-colors ${
                      isHidden ? 'text-amber-400 hover:bg-amber-500/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                    title={isHidden ? 'Unhide section in CV' : 'Hide section from CV'}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* Accordion toggle */}
                  <button
                    type="button"
                    onClick={() => toggleAccordion(secKey)}
                    className="p-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded cursor-pointer transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Accordion Content Body */}
              {isExpanded && (
                <div className="p-3.5 pt-0 border-t border-white/5 space-y-3 bg-zinc-950/30">
                  {/* SUMMARY SECTION */}
                  {secKey === 'summary' && (
                    <div className="space-y-2">
                      <textarea
                        value={result?.tailoredCv?.summary || ''}
                        onChange={(e) => setResult({
                          ...result,
                          tailoredCv: { ...result.tailoredCv, summary: e.target.value }
                        })}
                        rows={4}
                        placeholder="Professional summary text..."
                        className="glass-input w-full p-2.5 text-xs resize-none"
                      />
                    </div>
                  )}

                  {/* WORK EXPERIENCE SECTION */}
                  {secKey === 'work' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-zinc-400">Experience Items:</span>
                        <button
                          type="button"
                          onClick={() => setIsAddWorkModalOpen(true)}
                          className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Role
                        </button>
                      </div>

                      {(result?.tailoredCv?.workExperience || []).map((w: any, wIdx: number) => (
                        <div key={wIdx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="truncate">
                              <span className="font-bold text-white text-xs">{w.role}</span>
                              <span className="text-zinc-400 text-[11px] block">{w.company} • {w.period}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={wIdx === 0}
                                onClick={() => handleMoveWorkExp(wIdx, 'up')}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                              >
                                <ChevronUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={wIdx === (result.tailoredCv.workExperience.length - 1)}
                                onClick={() => handleMoveWorkExp(wIdx, 'down')}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                              >
                                <ChevronDown className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWorkExp(wIdx)}
                                className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Bullets List */}
                          <div className="space-y-1.5 pl-2 border-l border-white/5">
                            {getBulletsArray(w.bullets).map((b: string, bIdx: number) => (
                              <div key={bIdx} className="flex items-start gap-1.5 group">
                                <span className="text-zinc-500 text-[10px] mt-0.5">•</span>
                                <input
                                  type="text"
                                  value={b}
                                  onChange={(e) => {
                                    const currentBullets = getBulletsArray(w.bullets);
                                    const updatedBullets = [...currentBullets];
                                    updatedBullets[bIdx] = e.target.value;
                                    updateWorkBullets(wIdx, updatedBullets);
                                  }}
                                  className="glass-input px-2 py-1 text-[11px] flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentBullets = getBulletsArray(w.bullets);
                                    const updatedBullets = currentBullets.filter((_: any, i: number) => i !== bIdx);
                                    updateWorkBullets(wIdx, updatedBullets);
                                  }}
                                  className="p-1 text-zinc-600 hover:text-rose-400 rounded"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                const currentBullets = getBulletsArray(w.bullets);
                                const updatedBullets = [...currentBullets, 'Delivered impactful technical solution and optimizations.'];
                                updateWorkBullets(wIdx, updatedBullets);
                              }}
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              Add Bullet
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* EDUCATION SECTION */}
                  {secKey === 'education' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-zinc-400">Degrees & Qualifications:</span>
                        <button
                          type="button"
                          onClick={() => setIsAddEduModalOpen(true)}
                          className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Education
                        </button>
                      </div>

                      {(result?.tailoredCv?.education || []).map((edu: any, eduIdx: number) => (
                        <div key={eduIdx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
                          <div className="truncate">
                            <span className="font-bold text-white text-xs">{edu.degree}</span>
                            <span className="text-zinc-400 text-[11px] block">{edu.institution} • {edu.period}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={eduIdx === 0}
                              onClick={() => handleMoveEducation(eduIdx, 'up')}
                              className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={eduIdx === (result.tailoredCv.education.length - 1)}
                              onClick={() => handleMoveEducation(eduIdx, 'down')}
                              className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEducation(eduIdx)}
                              className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* PROJECTS SECTION */}
                  {secKey === 'projects' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-zinc-400">Tailored Projects:</span>
                        <button
                          type="button"
                          onClick={() => setIsAddProjModalOpen(true)}
                          className="px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          Add Project
                        </button>
                      </div>

                      {(result?.tailoredCv?.projects || []).map((proj: any, pIdx: number) => {
                        const isVisible = selectedProjects.includes(proj.name);
                        return (
                          <div key={pIdx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="flex items-center gap-2 cursor-pointer truncate">
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={() => handleToggleProjectVisibility(proj.name)}
                                  className="w-3.5 h-3.5 text-indigo-600 bg-zinc-950 border-zinc-800 rounded focus:ring-0 cursor-pointer"
                                />
                                <span className={`font-bold text-xs truncate ${isVisible ? 'text-white' : 'text-zinc-500 line-through'}`}>
                                  {proj.name}
                                </span>
                              </label>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={pIdx === 0}
                                  onClick={() => handleMoveProject(pIdx, 'up')}
                                  className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={pIdx === (result.tailoredCv.projects.length - 1)}
                                  onClick={() => handleMoveProject(pIdx, 'down')}
                                  className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProject(pIdx)}
                                  className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={proj.description || ''}
                              onChange={(e) => {
                                const updated = [...result.tailoredCv.projects];
                                updated[pIdx] = { ...proj, description: e.target.value };
                                setResult({ ...result, tailoredCv: { ...result.tailoredCv, projects: updated } });
                              }}
                              placeholder="Project description..."
                              className="glass-input px-2.5 py-1.5 text-[11px] w-full"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SKILLS SECTION (CATEGORIES & DRAGGABLE SKILLS) */}
                  {secKey === 'skills' && (
                    <div className="space-y-4">
                      {/* Skills Layout Toggle */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <span className="text-[11px] font-semibold text-zinc-400">Skills Display Mode:</span>
                        <div className="flex gap-1 bg-zinc-900 border border-white/10 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => setSkillsLayout('category')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                              skillsLayout === 'category' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            By Category
                          </button>
                          <button
                            type="button"
                            onClick={() => setSkillsLayout('level')}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                              skillsLayout === 'level' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            By Level
                          </button>
                        </div>
                      </div>

                      {/* CATEGORY MODE LIST */}
                      {skillsLayout === 'category' ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-zinc-400">Reorder categories & skills:</span>
                            <button
                              type="button"
                              onClick={() => setIsAddingNewCategory(true)}
                              className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              Add Category
                            </button>
                          </div>

                          {isAddingNewCategory && (
                            <div className="flex gap-2 p-2 rounded-xl bg-amber-500/5 border border-amber-500/20 animate-in fade-in">
                              <input
                                type="text"
                                value={newCategoryNameInput}
                                onChange={e => setNewCategoryNameInput(e.target.value)}
                                placeholder="e.g. Cloud & Infrastructure"
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && handleCreateNewCategory()}
                                className="glass-input px-2.5 py-1 text-xs flex-1"
                              />
                              <button
                                type="button"
                                onClick={handleCreateNewCategory}
                                className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAddingNewCategory(false)}
                                className="px-2 py-1 rounded-lg text-zinc-400 hover:text-white text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {skillCategories.map((catName, catIdx) => {
                            const skillsInCat = categorizedSkills[catName] || [];
                            const isCatOver = dragOverSkillCategory === catName;
                            return (
                              <div
                                key={catName}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  if (dragOverSkillCategory !== catName) setDragOverSkillCategory(catName);
                                }}
                                onDragLeave={(e) => {
                                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                                  setDragOverSkillCategory(null);
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setDragOverSkillCategory(null);
                                  const sourceCat = e.dataTransfer.getData('text/skill-category') || draggedSkillCategory;
                                  if (sourceCat && sourceCat !== catName) {
                                    const nextCats = [...skillCategories];
                                    const srcIdx = nextCats.indexOf(sourceCat);
                                    const tgtIdx = nextCats.indexOf(catName);
                                    if (srcIdx !== -1 && tgtIdx !== -1) {
                                      const [moved] = nextCats.splice(srcIdx, 1);
                                      nextCats.splice(tgtIdx, 0, moved);
                                      const newMap: Record<string, string[]> = {};
                                      nextCats.forEach(c => { newMap[c] = categorizedSkills[c]; });
                                      updateCategorizedSkillsMap(newMap);
                                    }
                                  }
                                  setDraggedSkillCategory(null);
                                }}
                                className={`p-3 rounded-xl border transition-all ${
                                  isCatOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-white/[0.02]'
                                } space-y-2`}
                              >
                                {/* Category Header */}
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <div
                                      draggable={true}
                                      onDragStart={(e) => {
                                        e.dataTransfer.setData('text/skill-category', catName);
                                        setDraggedSkillCategory(catName);
                                      }}
                                      onDragEnd={() => setDraggedSkillCategory(null)}
                                      className="cursor-grab p-0.5 text-zinc-500 hover:text-white"
                                      title="Drag category up/down"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-bold text-amber-300 text-xs">{catName}</span>
                                    <span className="text-[10px] text-zinc-500">({skillsInCat.length})</span>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={catIdx === 0}
                                      onClick={() => handleMoveSkillCategory(catName, 'up')}
                                      className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                                      title="Move category up"
                                    >
                                      <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={catIdx === skillCategories.length - 1}
                                      onClick={() => handleMoveSkillCategory(catName, 'down')}
                                      className="p-1 text-zinc-500 hover:text-white disabled:opacity-20 rounded"
                                      title="Move category down"
                                    >
                                      <ChevronDown className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newMap = { ...categorizedSkills };
                                        delete newMap[catName];
                                        updateCategorizedSkillsMap(newMap);
                                      }}
                                      className="p-1 text-zinc-600 hover:text-rose-400 rounded"
                                      title="Delete category"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Skills Chips (Reorderable) */}
                                <div className="flex flex-wrap gap-1.5 items-center pt-1">
                                  {skillsInCat.map((skillText, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-[11px] group/chip"
                                    >
                                      <button
                                        type="button"
                                        disabled={sIdx === 0}
                                        onClick={() => handleMoveSkillInsideCategory(catName, sIdx, 'left')}
                                        className="text-zinc-500 hover:text-white disabled:opacity-20"
                                        title="Move skill first"
                                      >
                                        <ArrowLeft className="w-2.5 h-2.5" />
                                      </button>

                                      <span>{skillText}</span>

                                      <button
                                        type="button"
                                        disabled={sIdx === skillsInCat.length - 1}
                                        onClick={() => handleMoveSkillInsideCategory(catName, sIdx, 'right')}
                                        className="text-zinc-500 hover:text-white disabled:opacity-20"
                                        title="Move skill later"
                                      >
                                        <ArrowRight className="w-2.5 h-2.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSkillFromCategory(catName, skillText)}
                                        className="text-zinc-500 hover:text-rose-400 ml-0.5"
                                        title="Remove skill"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  ))}

                                  {/* Add Skill to this Category */}
                                  {addingSkillToCategory === catName ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="text"
                                        value={newSkillInCategoryInput}
                                        onChange={e => setNewSkillInCategoryInput(e.target.value)}
                                        placeholder="Skill name..."
                                        autoFocus
                                        onBlur={() => handleAddSkillToCategory(catName)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSkillToCategory(catName)}
                                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 border border-indigo-500 text-white w-24 focus:outline-none"
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAddingSkillToCategory(catName);
                                        setNewSkillInCategoryInput('');
                                      }}
                                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/5 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                      Add
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* LEVEL MODE LIST */
                        <div className="space-y-3">
                          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                            <span className="text-[11px] font-bold text-emerald-300">Expert / Advanced Skills</span>
                            <div className="flex flex-wrap gap-1.5">
                              {(result?.tailoredCv?.skills || []).map((s: any, idx: number) => {
                                const name = typeof s === 'string' ? s : s.name;
                                return (
                                  <span key={idx} className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[11px] text-zinc-200">
                                    {name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CUSTOM SECTIONS (CERTIFICATIONS, SUBGROUPS, BULLETS, PARAGRAPH) */}
                  {isCustom && customSec && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
                          Format: {customSec.type === 'subgroup-items' ? 'Categorized Credentials / Items' : customSec.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomSection(customSec.id)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete Section
                        </button>
                      </div>

                      {/* Subgroup Items Template (Certifications Style) */}
                      {customSec.type === 'subgroup-items' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] text-zinc-400">Categories & Credentials:</span>
                            <button
                              type="button"
                              onClick={() => handleAddSubgroupToCustomSec(customSec.id, 'New Category')}
                              className="px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              Add Category
                            </button>
                          </div>

                          {(customSec.subgroups || []).map((sub, subIdx) => (
                            <div key={sub.id || subIdx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                              <div className="flex justify-between items-center">
                                <input
                                  type="text"
                                  value={sub.name}
                                  onChange={(e) => {
                                    const updated = customSec.subgroups?.map(s => s.id === sub.id ? { ...s, name: e.target.value } : s);
                                    setCustomSections(prev => prev.map(c => c.id === customSec.id ? { ...c, subgroups: updated } : c));
                                  }}
                                  className="font-bold text-cyan-300 text-xs bg-transparent border-b border-white/10 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = customSec.subgroups?.filter(s => s.id !== sub.id);
                                    setCustomSections(prev => prev.map(c => c.id === customSec.id ? { ...c, subgroups: updated } : c));
                                  }}
                                  className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Items list */}
                              <div className="space-y-1.5 pl-2">
                                {(sub.items || []).map((itemStr, itmIdx) => (
                                  <div key={itmIdx} className="flex items-center gap-1.5">
                                    <span className="text-zinc-500 text-[10px]">•</span>
                                    <input
                                      type="text"
                                      value={itemStr}
                                      onChange={(e) => {
                                        const updatedItems = [...sub.items];
                                        updatedItems[itmIdx] = e.target.value;
                                        const updatedSubgroups = customSec.subgroups?.map(s => s.id === sub.id ? { ...s, items: updatedItems } : s);
                                        setCustomSections(prev => prev.map(c => c.id === customSec.id ? { ...c, subgroups: updatedSubgroups } : c));
                                      }}
                                      className="glass-input px-2 py-1 text-[11px] flex-1"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveItemFromSubgroup(customSec.id, sub.id, itmIdx)}
                                      className="p-1 text-zinc-600 hover:text-rose-400"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => handleAddItemToSubgroup(customSec.id, sub.id, 'New Credential / Item')}
                                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                  Add Item
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bullet List Template */}
                      {customSec.type === 'bullet-list' && (
                        <div className="space-y-1.5">
                          {(customSec.bullets || []).map((b, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-1.5">
                              <span className="text-zinc-500 text-[10px] mt-1">•</span>
                              <input
                                type="text"
                                value={b}
                                onChange={(e) => {
                                  const updated = [...(customSec.bullets || [])];
                                  updated[bIdx] = e.target.value;
                                  setCustomSections(prev => prev.map(c => c.id === customSec.id ? { ...c, bullets: updated } : c));
                                }}
                                className="glass-input px-2 py-1 text-[11px] flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = customSec.bullets?.filter((_, i) => i !== bIdx);
                                  setCustomSections(prev => prev.map(c => c.id === customSec.id ? { ...c, bullets: updated } : c));
                                }}
                                className="p-1 text-zinc-600 hover:text-rose-400"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(customSec.bullets || []), 'New bullet description.'];
                              setCustomSections(prev => prev.map(c => c.id === customSec.id ? { ...c, bullets: updated } : c));
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 pt-1 cursor-pointer"
                          >
                            <Plus className="w-2.5 h-2.5" />
                            Add Bullet
                          </button>
                        </div>
                      )}

                      {/* Paragraph Template */}
                      {customSec.type === 'paragraph' && (
                        <textarea
                          value={customSec.content || ''}
                          onChange={(e) => {
                            setCustomSections(prev => prev.map(c => c.id === customSec.id ? { ...c, content: e.target.value } : c));
                          }}
                          rows={4}
                          className="glass-input w-full p-2.5 text-xs resize-none"
                        />
                      )}
                    </div>
                  )}

                  {/* SIGNATURE SECTION */}
                  {secKey === 'signature' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-300">Enable Signature Section</span>
                        <input
                          type="checkbox"
                          checked={showSignatureSection}
                          onChange={e => setShowSignatureSection(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded bg-zinc-950 border-zinc-800 focus:ring-0 cursor-pointer"
                        />
                      </div>

                      {showSignatureSection && (
                        <div className="space-y-3 pt-2 border-t border-white/5 animate-in fade-in">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-zinc-400 font-semibold uppercase">Signing Location</label>
                            <input
                              type="text"
                              value={signingLocation}
                              onChange={e => setSigningLocation(e.target.value)}
                              placeholder="e.g. Munich"
                              className="glass-input px-2.5 py-1.5 text-xs"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showSignatureImage}
                              onChange={e => setShowSignatureImage(e.target.checked)}
                              className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                            />
                            <span>Include Drawn / Uploaded Signature Image</span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      {/* 1. Add Custom Section Modal */}
      {isAddCustomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel p-5 rounded-2xl w-full max-w-md space-y-4 border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="font-bold text-white text-sm">Add Custom Section</span>
              <button onClick={() => setIsAddCustomModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Section Title</label>
                <input
                  type="text"
                  value={newCustomTitle}
                  onChange={e => setNewCustomTitle(e.target.value)}
                  placeholder="e.g. Certifications & Credentials, Key Highlights"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Section Layout Template</label>
                <select
                  value={newCustomType}
                  onChange={e => setNewCustomType(e.target.value as CustomSectionType)}
                  className="glass-input px-3 py-2 text-xs bg-zinc-900 border border-white/10"
                >
                  <option value="subgroup-items">Categorized Subgroups (Certifications style: DevOps -&gt; CKA, etc.)</option>
                  <option value="bullet-list">Bullet Points List (Publications, Key Highlights)</option>
                  <option value="paragraph">Rich Paragraph (Executive Statement, Research)</option>
                  <option value="structured-items">Structured Items (Awards with Organization &amp; Date)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToVaultOnAdd}
                  onChange={e => setSaveToVaultOnAdd(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Save this section to Master Profile Vault</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsAddCustomModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newCustomTitle.trim()}
                onClick={handleAddCustomSection}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Work Experience Modal */}
      {isAddWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel p-5 rounded-2xl w-full max-w-md space-y-4 border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="font-bold text-white text-sm">Add Work Experience</span>
              <button onClick={() => setIsAddWorkModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Job Title / Role</label>
                  <input
                    type="text"
                    value={newWorkRole}
                    onChange={e => setNewWorkRole(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Company</label>
                  <input
                    type="text"
                    value={newWorkCompany}
                    onChange={e => setNewWorkCompany(e.target.value)}
                    placeholder="e.g. BMW Group"
                    className="glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Location</label>
                  <input
                    type="text"
                    value={newWorkLocation}
                    onChange={e => setNewWorkLocation(e.target.value)}
                    placeholder="e.g. Munich, Germany"
                    className="glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Period</label>
                  <input
                    type="text"
                    value={newWorkPeriod}
                    onChange={e => setNewWorkPeriod(e.target.value)}
                    placeholder="e.g. 2022 - Present"
                    className="glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Key Bullets (One per line)</label>
                <textarea
                  value={newWorkBullets}
                  onChange={e => setNewWorkBullets(e.target.value)}
                  rows={3}
                  placeholder="Architected cloud services..."
                  className="glass-input px-3 py-2 text-xs resize-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToVaultOnAdd}
                  onChange={e => setSaveToVaultOnAdd(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Save this role to Profile Vault</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsAddWorkModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newWorkRole.trim() || !newWorkCompany.trim()}
                onClick={handleAddWorkExp}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Add Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Education Modal */}
      {isAddEduModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel p-5 rounded-2xl w-full max-w-md space-y-4 border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="font-bold text-white text-sm">Add Education</span>
              <button onClick={() => setIsAddEduModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Degree / Qualification</label>
                <input
                  type="text"
                  value={newEduDegree}
                  onChange={e => setNewEduDegree(e.target.value)}
                  placeholder="e.g. M.Sc. in Computer Science"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Institution / University</label>
                <input
                  type="text"
                  value={newEduInstitution}
                  onChange={e => setNewEduInstitution(e.target.value)}
                  placeholder="e.g. Technical University of Munich"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Location</label>
                  <input
                    type="text"
                    value={newEduLocation}
                    onChange={e => setNewEduLocation(e.target.value)}
                    placeholder="e.g. Munich, Germany"
                    className="glass-input px-3 py-2 text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Period</label>
                  <input
                    type="text"
                    value={newEduPeriod}
                    onChange={e => setNewEduPeriod(e.target.value)}
                    placeholder="e.g. 2020 - 2024"
                    className="glass-input px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToVaultOnAdd}
                  onChange={e => setSaveToVaultOnAdd(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Save this degree to Profile Vault</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsAddEduModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newEduDegree.trim() || !newEduInstitution.trim()}
                onClick={handleAddEducation}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Add Degree
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Project Modal */}
      {isAddProjModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="glass-panel p-5 rounded-2xl w-full max-w-md space-y-4 border border-white/10 bg-zinc-900 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="font-bold text-white text-sm">Add Project</span>
              <button onClick={() => setIsAddProjModalOpen(false)} className="text-zinc-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Project Name</label>
                <input
                  type="text"
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="e.g. Distributed Cloud Engine"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Technologies (comma separated)</label>
                <input
                  type="text"
                  value={newProjTech}
                  onChange={e => setNewProjTech(e.target.value)}
                  placeholder="e.g. Next.js, Go, Kubernetes, Redis"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Project URL (Optional)</label>
                <input
                  type="url"
                  value={newProjUrl}
                  onChange={e => setNewProjUrl(e.target.value)}
                  placeholder="e.g. https://github.com/user/project"
                  className="glass-input px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Description / Scope</label>
                <textarea
                  value={newProjDesc}
                  onChange={e => setNewProjDesc(e.target.value)}
                  rows={3}
                  placeholder="Engineered high-concurrency microservices..."
                  className="glass-input px-3 py-2 text-xs resize-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToVaultOnAdd}
                  onChange={e => setSaveToVaultOnAdd(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <span>Save this project to Profile Vault</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsAddProjModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newProjName.trim()}
                onClick={handleAddProject}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
