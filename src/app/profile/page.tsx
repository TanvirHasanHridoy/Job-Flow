'use client';

import { useState, useEffect } from 'react';
import { 
  User, Briefcase, GraduationCap, Code2, Globe2, Plus, Trash2, Save, Sparkles, CheckCircle2, RefreshCw, FileText, FolderGit, Pencil,
  Layers, AlignLeft, List, Tag, ChevronUp, ChevronDown, Check, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { classifySkillCategory, SKILL_CATEGORIES } from '@/lib/skills';
import { CustomSection, CustomSectionType, CustomSectionItem, CustomSectionSubgroup, createDefaultCustomSection } from '@/lib/customSections';
import { useTokens } from '@/context/TokenContext';
import { useAlertModal } from '@/context/AlertModalContext';

interface WorkExperience {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

interface Education {
  institution: string;
  degree: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

interface Skill {
  name: string;
  level: string;
  category?: string;
}

interface Language {
  language: string;
  level: string;
}

interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface ProfilePersona {
  id: string;
  name: string;
  headline?: string;
  summary?: string;
  isDefault?: boolean;
  skills?: Skill[];
  workExperience?: WorkExperience[];
  projects?: Project[];
  education?: Education[];
  customSections?: CustomSection[];
}

interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  address: string;
  dateOfBirth: string;
  birthplace: string;
  nationality: string;
  photo?: string;
  signature?: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  projects?: Project[];
  customSections?: CustomSection[];
  personas?: ProfilePersona[];
}

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native', 'Muttersprache'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function ProfileVault() {
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    email: '',
    phone: '',
    website: '',
    github: '',
    linkedin: '',
    address: '',
    dateOfBirth: '',
    birthplace: '',
    nationality: '',
    photo: '',
    signature: '',
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
    customSections: [],
    personas: []
  });

  const [activePersonaId, setActivePersonaId] = useState<string>('default');
  const [showNewPersonaModal, setShowNewPersonaModal] = useState(false);
  const [newPersonaTitle, setNewPersonaTitle] = useState('');
  const [newPersonaCloneFrom, setNewPersonaCloneFrom] = useState<'current' | 'blank'>('current');
  const [isRenamingPersona, setIsRenamingPersona] = useState(false);
  const [renamePersonaId, setRenamePersonaId] = useState<string | null>(null);
  const [renamePersonaName, setRenamePersonaName] = useState('');

  const [activeTab, setActiveTab] = useState<'personal' | 'experience' | 'education' | 'skills' | 'projects' | 'custom'>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCustomSecTitle, setNewCustomSecTitle] = useState('');
  const [newCustomSecType, setNewCustomSecType] = useState<CustomSectionType>('bullet-list');
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { setIsTokenModalOpen, fetchTokens } = useTokens();
  const { showAlert } = useAlertModal();

  // Importer states
  const [importOpen, setImportOpen] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinText, setLinkedinText] = useState('');
  const [importing, setImporting] = useState(false);

  // Signature Background Removal Modal States
  const [showSigProcessor, setShowSigProcessor] = useState(false);
  const [sigProcessorOriginal, setSigProcessorOriginal] = useState<string>('');
  const [sigProcessorProcessed, setSigProcessorProcessed] = useState<string>('');
  const [sigProcessorThreshold, setSigProcessorThreshold] = useState<number>(200);
  const [sigProcessing, setSigProcessing] = useState(false);

  const processImage = (imageUrl: string, thresholdValue: number) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D context'));
          return;
        }

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get pixel data
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate luminance: standard NTSC formula
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

          if (luminance >= thresholdValue) {
            // High luminance = background paper. Make it transparent.
            data[i + 3] = 0; // Alpha = 0
          } else {
            // Low luminance = stroke (ink). Enhance contrast to clean shadows.
            const factor = luminance / thresholdValue; // range [0, 1]
            data[i] = Math.max(0, Math.min(255, r * factor * 0.7));     // R
            data[i + 1] = Math.max(0, Math.min(255, g * factor * 0.7)); // G
            data[i + 2] = Math.max(0, Math.min(255, b * factor * 0.7)); // B
          }
        }

        // Put modified pixels back
        ctx.putImageData(imgData, 0, 0);

        // Export as base64 transparent PNG
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => reject(err);
      img.src = imageUrl;
    });
  };

  useEffect(() => {
    if (sigProcessorOriginal) {
      setSigProcessing(true);
      processImage(sigProcessorOriginal, sigProcessorThreshold)
        .then(resultUrl => {
          setSigProcessorProcessed(resultUrl);
        })
        .catch(err => {
          console.error('Error processing signature background:', err);
        })
        .finally(() => {
          setSigProcessing(false);
        });
    }
  }, [sigProcessorOriginal, sigProcessorThreshold]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setProfile(prev => ({
            ...prev,
            ...data,
            workExperience: data.workExperience || [],
            education: data.education || [],
            skills: data.skills || [],
            languages: data.languages || [],
            projects: data.projects || [],
            customSections: data.customSections || [],
            personas: data.personas || []
          }));
          const defaultPersona = (data.personas || []).find((p: any) => p.isDefault);
          if (defaultPersona) {
            setActivePersonaId(defaultPersona.id);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleImport = async () => {
    if (!githubUsername.trim() && !linkedinText.trim()) {
      showAlert({
        title: 'Input Required',
        message: 'Please enter a GitHub username or paste LinkedIn profile text.',
        type: 'warning'
      });
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/import-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubUsername: githubUsername.trim(),
          linkedinText: linkedinText.trim()
        })
      });

      if (res.status === 403) {
        setIsTokenModalOpen(true);
        return;
      }

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to parse inputs');
      }

      const parsedProfile = await res.json();
      setProfile(parsedProfile);
      
      // Update tokens count
      fetchTokens();
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.3 }
      });

      showAlert({
        title: 'Import Completed',
        message: 'AI Import Completed! The parsed details have been pre-populated in the tabs below. Review them and click "Save Vault" to commit changes.',
        type: 'success'
      });
      setImportOpen(false);
      setGithubUsername('');
      setLinkedinText('');
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: 'Import Failed',
        message: err.message || 'An error occurred while importing your profile.',
        type: 'error'
      });
    } finally {
      setImporting(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showAlert({
        title: 'Invalid File Format',
        message: 'Please select a valid PDF file.',
        type: 'warning'
      });
      return;
    }
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/profile/import-pdf', {
        method: 'POST',
        body: formData,
      });

      if (res.status === 403) {
        setIsTokenModalOpen(true);
        return;
      }

      if (!res.ok) {
        let errMsg = 'Failed to parse PDF CV';
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

      const parsedProfile = await res.json();
      
      // Update tokens count
      fetchTokens();
      
      setProfile(prev => ({
        ...prev,
        ...parsedProfile,
        workExperience: parsedProfile.workExperience || [],
        education: parsedProfile.education || [],
        skills: parsedProfile.skills || [],
        languages: parsedProfile.languages || []
      }));

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.3 }
      });

      showAlert({
        title: 'Import Completed',
        message: 'AI PDF Import Completed! The parsed details have been pre-populated in the tabs below. Review them and click "Save Vault" to commit changes.',
        type: 'success'
      });
      setImportOpen(false);
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: 'PDF Import Failed',
        message: err.message || 'An error occurred while parsing the PDF.',
        type: 'error'
      });
    } finally {
      setImporting(false);
    }
  };

  // Experience form temp states
  const [newExp, setNewExp] = useState<WorkExperience>({
    company: '',
    role: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
    bullets: []
  });
  const [newBullet, setNewBullet] = useState('');

  // Education form temp states
  const [newEdu, setNewEdu] = useState<Education>({
    institution: '',
    degree: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false
  });

  // Skills temp states
  const [newSkill, setNewSkill] = useState<Skill>({ name: '', level: 'Intermediate', category: 'Tools' });

  // Languages temp states
  const [newLang, setNewLang] = useState<Language>({ language: '', level: 'B2' });

  // Projects temp states
  const [newProject, setNewProject] = useState<Project>({
    name: '',
    description: '',
    technologies: [],
    url: ''
  });
  const [newProjTechs, setNewProjTechs] = useState('');

  // Editing state hooks
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);
  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null);
  const [editingProjIndex, setEditingProjIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        let personas = data.personas;
        if (!Array.isArray(personas) || personas.length === 0) {
          personas = [{
            id: 'default',
            name: 'Master Profile',
            isDefault: true,
            skills: data.skills || [],
            workExperience: data.workExperience || [],
            projects: data.projects || [],
            education: data.education || [],
            customSections: data.customSections || []
          }];
        }
        setProfile({ ...data, personas });
        const defaultP = personas.find((p: ProfilePersona) => p.isDefault) || personas[0];
        if (defaultP) {
          setActivePersonaId(defaultP.id);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchPersona = (targetId: string) => {
    if (targetId === activePersonaId) return;
    setProfile(prev => {
      const personas = [...(prev.personas || [])];
      const currentIdx = personas.findIndex(p => p.id === activePersonaId);
      if (currentIdx !== -1) {
        personas[currentIdx] = {
          ...personas[currentIdx],
          skills: prev.skills,
          workExperience: prev.workExperience,
          projects: prev.projects,
          education: prev.education,
          customSections: prev.customSections
        };
      }
      const target = personas.find(p => p.id === targetId);
      if (!target) return { ...prev, personas };

      setActivePersonaId(targetId);
      return {
        ...prev,
        personas,
        skills: target.skills || prev.skills || [],
        workExperience: target.workExperience || prev.workExperience || [],
        projects: target.projects || prev.projects || [],
        education: target.education || prev.education || [],
        customSections: target.customSections || prev.customSections || []
      };
    });
  };

  const handleCreatePersona = (name: string, cloneFrom: 'current' | 'blank') => {
    if (!name.trim()) return;
    const newId = `persona-${Date.now()}`;
    const newPersona: ProfilePersona = {
      id: newId,
      name: name.trim(),
      isDefault: false,
      skills: cloneFrom === 'current' ? [...(profile.skills || [])] : [],
      workExperience: cloneFrom === 'current' ? [...(profile.workExperience || [])] : [],
      projects: cloneFrom === 'current' ? [...(profile.projects || [])] : [],
      education: cloneFrom === 'current' ? [...(profile.education || [])] : [],
      customSections: cloneFrom === 'current' ? [...(profile.customSections || [])] : []
    };

    setProfile(prev => {
      const personas = [...(prev.personas || []), newPersona];
      return {
        ...prev,
        personas,
        skills: newPersona.skills || [],
        workExperience: newPersona.workExperience || [],
        projects: newPersona.projects || [],
        education: newPersona.education || [],
        customSections: newPersona.customSections || []
      };
    });
    setActivePersonaId(newId);
    setShowNewPersonaModal(false);
    setNewPersonaTitle('');
    showAlert({
      title: 'Persona Created',
      message: `Created new persona "${name.trim()}". Click "Save Vault" to commit changes.`,
      type: 'success'
    });
  };

  const handleDuplicatePersona = (sourceId: string) => {
    const source = profile.personas?.find(p => p.id === sourceId);
    if (!source) return;
    const newId = `persona-${Date.now()}`;
    const duplicated: ProfilePersona = {
      ...source,
      id: newId,
      name: `Copy of ${source.name}`,
      isDefault: false
    };
    setProfile(prev => ({
      ...prev,
      personas: [...(prev.personas || []), duplicated]
    }));
    setActivePersonaId(newId);
    showAlert({
      title: 'Persona Duplicated',
      message: `Created duplicate "${duplicated.name}". Click "Save Vault" to save.`,
      type: 'success'
    });
  };

  const handleStartRenamePersona = (persona: ProfilePersona) => {
    setRenamePersonaId(persona.id);
    setRenamePersonaName(persona.name);
    setIsRenamingPersona(true);
  };

  const handleSaveRenamePersona = () => {
    if (!renamePersonaId || !renamePersonaName.trim()) {
      setIsRenamingPersona(false);
      return;
    }
    setProfile(prev => ({
      ...prev,
      personas: (prev.personas || []).map(p =>
        p.id === renamePersonaId ? { ...p, name: renamePersonaName.trim() } : p
      )
    }));
    setIsRenamingPersona(false);
    setRenamePersonaId(null);
  };

  const handleSetDefaultPersona = (targetId: string) => {
    setProfile(prev => ({
      ...prev,
      personas: (prev.personas || []).map(p => ({
        ...p,
        isDefault: p.id === targetId
      }))
    }));
    showAlert({
      title: 'Default Persona Updated',
      message: 'This persona will now be loaded as the default in the tailoring engine.',
      type: 'success'
    });
  };

  const handleDeletePersona = (targetId: string) => {
    const currentPersonas = profile.personas || [];
    if (currentPersonas.length <= 1) {
      showAlert({
        title: 'Cannot Delete',
        message: 'You must maintain at least one persona in your vault.',
        type: 'warning'
      });
      return;
    }
    const remaining = currentPersonas.filter(p => p.id !== targetId);
    const nextActive = remaining[0].id;
    setProfile(prev => ({
      ...prev,
      personas: remaining
    }));
    if (activePersonaId === targetId) {
      handleSwitchPersona(nextActive);
    }
    showAlert({
      title: 'Persona Deleted',
      message: 'Persona removed from vault. Click "Save Vault" to commit.',
      type: 'info'
    });
  };

  const saveProfile = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      // Ensure active persona snapshot is updated before saving
      const personas = [...(profile.personas || [])];
      const currentIdx = personas.findIndex(p => p.id === activePersonaId);
      if (currentIdx !== -1) {
        personas[currentIdx] = {
          ...personas[currentIdx],
          skills: profile.skills,
          workExperience: profile.workExperience,
          projects: profile.projects,
          education: profile.education,
          customSections: profile.customSections
        };
      }

      const payload = {
        ...profile,
        personas
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert({
        title: 'Invalid File',
        message: 'Please select an image file.',
        type: 'warning'
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showAlert({
        title: 'Invalid File',
        message: 'Please select an image file.',
        type: 'warning'
      });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setSigProcessorOriginal(reader.result as string);
      setSigProcessorThreshold(200);
      setShowSigProcessor(true);
    };
    reader.readAsDataURL(file);
  };

  // Work Experience Operations
  const addExperience = () => {
    if (!newExp.company || !newExp.role) return;
    setProfile(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, { ...newExp }]
    }));
    cancelEditExperience();
  };

  const startEditExperience = (index: number) => {
    const exp = profile.workExperience[index];
    setNewExp({ ...exp });
    setEditingExpIndex(index);
  };

  const saveExperienceEdit = () => {
    if (editingExpIndex === null || !newExp.company || !newExp.role) return;
    setProfile(prev => {
      const list = [...prev.workExperience];
      list[editingExpIndex] = { ...newExp };
      return { ...prev, workExperience: list };
    });
    cancelEditExperience();
  };

  const cancelEditExperience = () => {
    setEditingExpIndex(null);
    setNewExp({
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      bullets: []
    });
    setNewBullet('');
  };

  const removeExperience = (index: number) => {
    if (editingExpIndex === index) {
      cancelEditExperience();
    }
    setProfile(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter((_, i) => i !== index)
    }));
  };

  const addExpBullet = () => {
    if (!newBullet.trim()) return;
    setNewExp(prev => ({
      ...prev,
      bullets: [...prev.bullets, newBullet.trim()]
    }));
    setNewBullet('');
  };

  const removeExpBullet = (index: number) => {
    setNewExp(prev => ({
      ...prev,
      bullets: prev.bullets.filter((_, i) => i !== index)
    }));
  };

  // Education Operations
  const addEducation = () => {
    if (!newEdu.institution || !newEdu.degree) return;
    setProfile(prev => ({
      ...prev,
      education: [...prev.education, { ...newEdu }]
    }));
    cancelEditEducation();
  };

  const startEditEducation = (index: number) => {
    const edu = profile.education[index];
    setNewEdu({ ...edu });
    setEditingEduIndex(index);
  };

  const saveEducationEdit = () => {
    if (editingEduIndex === null || !newEdu.institution || !newEdu.degree) return;
    setProfile(prev => {
      const list = [...prev.education];
      list[editingEduIndex] = { ...newEdu };
      return { ...prev, education: list };
    });
    cancelEditEducation();
  };

  const cancelEditEducation = () => {
    setEditingEduIndex(null);
    setNewEdu({
      institution: '',
      degree: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false
    });
  };

  const removeEducation = (index: number) => {
    if (editingEduIndex === index) {
      cancelEditEducation();
    }
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  // Skill Operations
  const addSkill = () => {
    if (!newSkill.name.trim()) return;
    const category = newSkill.category || classifySkillCategory(newSkill.name);
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, { ...newSkill, category }]
    }));
    setNewSkill({ name: '', level: 'Intermediate', category: 'Tools' });
  };

  const removeSkill = (index: number) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  // Language Operations
  const addLanguage = () => {
    if (!newLang.language.trim()) return;
    setProfile(prev => ({
      ...prev,
      languages: [...prev.languages, { ...newLang }]
    }));
    setNewLang({ language: '', level: 'B2' });
  };

  const removeLanguage = (index: number) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  // Project Operations
  const addProject = () => {
    if (!newProject.name.trim()) return;
    const technologies = newProjTechs.split(',').map(t => t.trim()).filter(Boolean);
    setProfile(prev => ({
      ...prev,
      projects: [...(prev.projects || []), { ...newProject, technologies }]
    }));
    cancelEditProject();
  };

  const startEditProject = (index: number) => {
    const proj = (profile.projects || [])[index];
    if (!proj) return;
    setNewProject({ ...proj });
    setNewProjTechs(proj.technologies.join(', '));
    setEditingProjIndex(index);
  };

  const saveProjectEdit = () => {
    if (editingProjIndex === null || !newProject.name.trim()) return;
    const technologies = newProjTechs.split(',').map(t => t.trim()).filter(Boolean);
    setProfile(prev => {
      const list = [...(prev.projects || [])];
      list[editingProjIndex] = { ...newProject, technologies };
      return { ...prev, projects: list };
    });
    cancelEditProject();
  };

  const cancelEditProject = () => {
    setEditingProjIndex(null);
    setNewProject({
      name: '',
      description: '',
      technologies: [],
      url: ''
    });
    setNewProjTechs('');
  };

  const removeProject = (index: number) => {
    if (editingProjIndex === index) {
      cancelEditProject();
    }
    setProfile(prev => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mb-4"></div>
        <p className="text-zinc-400 animate-pulse text-sm">Loading professional vault...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-indigo-200 bg-clip-text text-transparent">
              Master Professional Vault
            </h1>
          </div>
          <p className="text-zinc-400 text-sm">
            Enter your core skills, education, and career facts. This vault acts as the single source of truth for all AI-tailored applications.
          </p>
        </div>
        
        <button
          onClick={saveProfile}
          disabled={saving}
          className="w-full md:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Saved Successfully!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Vault
            </>
          )}
        </button>
      </div>

      {/* Importer Section */}
      <div className="mb-8">
        {!importOpen ? (
          <button
            onClick={() => setImportOpen(true)}
            className="w-full py-4 px-6 rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-300 hover:text-indigo-200 flex items-center justify-between transition-all duration-300 cursor-pointer shadow-md"
          >
            <div className="flex items-center gap-3 text-left">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <div>
                <h4 className="font-bold text-sm text-white">Bootstrap with AI Profile Auto-Importer</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Quickly pre-populate your vault using public GitHub (30 tokens) or LinkedIn details (30 tokens) or PDF Resume (30 tokens).</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-white">Open Importer</span>
          </button>
        ) : (
          <div className="glass-panel p-6 rounded-2xl space-y-4 border border-indigo-500/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 w-48 h-48 bg-indigo-500/5 rounded-full filter blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-md">AI Profile Auto-Importer</h3>
              </div>
              <button
                onClick={() => setImportOpen(false)}
                className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-white/5 cursor-pointer"
              >
                Cancel / Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-4 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                    </svg>
                    GitHub Username (30 tokens)
                  </label>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    placeholder="e.g. torvalds"
                    className="glass-input px-3.5 py-2.5 text-xs w-full text-white"
                    disabled={importing}
                  />
                  <p className="text-[10px] text-zinc-500">Fetches bio and top public repositories to extract skills.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-400" />
                    Import from CV (PDF) (30 tokens)
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handlePdfUpload(file);
                      }}
                      className="hidden"
                      id="cv-pdf-upload"
                      disabled={importing}
                    />
                    <label
                      htmlFor="cv-pdf-upload"
                      className="flex flex-col items-center justify-center border border-dashed border-zinc-700/50 bg-white/[0.02] hover:bg-white/[0.04] transition-all rounded-xl p-4 text-center cursor-pointer"
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handlePdfUpload(file);
                      }}
                    >
                      <FileText className="w-6 h-6 text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-[11px] text-white font-medium">Select PDF Resume (30 tokens)</span>
                      <span className="text-[9px] text-zinc-500 mt-0.5">Drag and drop here</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-8 flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn Profile / Resume Copy-Paste Text (30 tokens)
                </label>
                <textarea
                  value={linkedinText}
                  onChange={e => setLinkedinText(e.target.value)}
                  placeholder="Paste copy-pasted text from your LinkedIn profile page (About, Experience, Education sections) or resume text here..."
                  rows={4}
                  className="glass-input p-3 text-xs w-full resize-none font-sans text-white"
                  disabled={importing}
                />
                <p className="text-[10px] text-zinc-500">Paste raw text. The AI extracts dates, metrics, and experience bullet details factually.</p>
              </div>
            </div>

            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  AI is Fetching and Structuring Professional Profile...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse Inputs & Pre-populate Editor Tabs (30 tokens)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Career Persona Management Bar */}
      <div className="mb-6 p-4 rounded-2xl glass-panel border border-indigo-500/20 shadow-lg space-y-3 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Career Persona Vault</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
              {(profile.personas || []).length} Persona{(profile.personas || []).length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowNewPersonaModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Persona</span>
            </button>
          </div>
        </div>

        {/* Persona Pills Tab Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {(profile.personas || []).map((persona) => {
            const isActive = persona.id === activePersonaId;
            return (
              <div
                key={persona.id}
                onClick={() => handleSwitchPersona(persona.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-500/20'
                    : 'bg-zinc-900/60 text-zinc-400 border-white/10 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{persona.name}</span>
                {persona.isDefault && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    Default
                  </span>
                )}
                {isActive && (
                  <div className="flex items-center gap-1 ml-1 border-l border-white/20 pl-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicatePersona(persona.id);
                      }}
                      className="hover:text-indigo-200 transition-colors p-0.5"
                      title="Duplicate persona"
                    >
                      <Layers className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartRenamePersona(persona);
                      }}
                      className="hover:text-indigo-200 transition-colors p-0.5"
                      title="Rename persona"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    {!persona.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefaultPersona(persona.id);
                        }}
                        className="hover:text-amber-200 transition-colors p-0.5"
                        title="Set as Default for AI tailoring"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                    {(profile.personas || []).length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePersona(persona.id);
                        }}
                        className="hover:text-rose-200 transition-colors p-0.5"
                        title="Delete persona"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: New Persona */}
      {showNewPersonaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="font-bold text-white text-md flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Create Career Persona
              </h3>
              <button
                type="button"
                onClick={() => setShowNewPersonaModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Persona Title / Role Specialization</label>
                <input
                  type="text"
                  value={newPersonaTitle}
                  onChange={e => setNewPersonaTitle(e.target.value)}
                  placeholder="e.g. Cloud & DevOps Architect, Frontend Lead..."
                  className="glass-input px-3.5 py-2.5 text-xs text-white"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase">Initial Content</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewPersonaCloneFrom('current')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      newPersonaCloneFrom === 'current'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="block font-bold">Clone Active Profile</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Copies current skills & projects</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPersonaCloneFrom('blank')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      newPersonaCloneFrom === 'blank'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="block font-bold">Start Fresh</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Blank skills & projects list</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewPersonaModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleCreatePersona(newPersonaTitle, newPersonaCloneFrom)}
                disabled={!newPersonaTitle.trim()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md disabled:opacity-50"
              >
                Create Persona
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Rename Persona */}
      {isRenamingPersona && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-left">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Pencil className="w-4 h-4 text-indigo-400" />
              Rename Persona
            </h3>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-zinc-400 uppercase">Persona Name</label>
              <input
                type="text"
                value={renamePersonaName}
                onChange={e => setRenamePersonaName(e.target.value)}
                className="glass-input px-3.5 py-2 text-xs text-white"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveRenamePersona();
                  else if (e.key === 'Escape') setIsRenamingPersona(false);
                }}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRenamingPersona(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRenamePersona}
                disabled={!renamePersonaName.trim()}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-all shadow-md disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('personal')}
            className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 border ${
              activeTab === 'personal'
                ? 'bg-indigo-600/15 border-indigo-500/30 text-white font-semibold shadow-inner'
                : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal & DACH Details</span>
          </button>
          
          <button
            onClick={() => setActiveTab('experience')}
            className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 border ${
              activeTab === 'experience'
                ? 'bg-indigo-600/15 border-indigo-500/30 text-white font-semibold shadow-inner'
                : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Work Experience</span>
          </button>
          
          <button
            onClick={() => setActiveTab('education')}
            className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 border ${
              activeTab === 'education'
                ? 'bg-indigo-600/15 border-indigo-500/30 text-white font-semibold shadow-inner'
                : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Education</span>
          </button>
          
          <button
            onClick={() => setActiveTab('skills')}
            className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 border ${
              activeTab === 'skills'
                ? 'bg-indigo-600/15 border-indigo-500/30 text-white font-semibold shadow-inner'
                : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Skills & Languages</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 border ${
              activeTab === 'projects'
                ? 'bg-indigo-600/15 border-indigo-500/30 text-white font-semibold shadow-inner'
                : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FolderGit className="w-4 h-4" />
            <span>Project Works</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-300 border ${
              activeTab === 'custom'
                ? 'bg-indigo-600/15 border-indigo-500/30 text-white font-semibold shadow-inner'
                : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span className="flex-1">Custom Sections</span>
            {profile.customSections && profile.customSections.length > 0 && (
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                {profile.customSections.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="lg:col-span-3 glass-panel rounded-2xl p-6 md:p-8">
          
          {/* TAB 1: Personal Details */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handlePersonalChange}
                    className="glass-input px-4 py-2.5 w-full text-sm"
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handlePersonalChange}
                    className="glass-input px-4 py-2.5 w-full text-sm"
                    placeholder="e.g. john.doe@example.com"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handlePersonalChange}
                    className="glass-input px-4 py-2.5 w-full text-sm"
                    placeholder="e.g. +49 176 12345678"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Personal Website</label>
                  <input
                    type="url"
                    name="website"
                    value={profile.website}
                    onChange={handlePersonalChange}
                    className="glass-input px-4 py-2.5 w-full text-sm"
                    placeholder="e.g. https://johndoe.dev"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">LinkedIn URL</label>
                  <input
                    type="text"
                    name="linkedin"
                    value={profile.linkedin}
                    onChange={handlePersonalChange}
                    className="glass-input px-4 py-2.5 w-full text-sm"
                    placeholder="e.g. linkedin.com/in/johndoe"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">GitHub Profile URL</label>
                  <input
                    type="text"
                    name="github"
                    value={profile.github}
                    onChange={handlePersonalChange}
                    className="glass-input px-4 py-2.5 w-full text-sm"
                    placeholder="e.g. github.com/johndoe"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Address / Location</label>
                <input
                  type="text"
                  name="address"
                  value={profile.address}
                  onChange={handlePersonalChange}
                  className="glass-input px-4 py-2.5 w-full text-sm"
                  placeholder="e.g. Musterstraße 12, 10115 Berlin"
                />
              </div>

              {/* Photo & Signature Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                {/* Profile Photo */}
                <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-[85px] h-[105px] bg-zinc-900 border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0">
                      {profile.photo ? (
                        <img src={profile.photo} alt="Photo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-zinc-600 text-xs text-center font-sans">No Photo</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                        id="photo-file-input"
                      />
                      <label 
                        htmlFor="photo-file-input" 
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold text-center cursor-pointer transition-colors"
                      >
                        Choose Photo
                      </label>
                      {profile.photo && (
                        <button 
                          onClick={() => setProfile(prev => ({ ...prev, photo: '' }))}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold text-left cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                      <p className="text-[10px] text-zinc-500">Supported formats: JPG, PNG. Recommended passport size ratio.</p>
                    </div>
                  </div>
                </div>

                {/* Signature */}
                <div className="flex flex-col gap-2 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Handwritten Signature</label>
                  <div className="flex items-center gap-4">
                    <div className="w-[120px] h-[60px] bg-zinc-900 border border-white/10 rounded-sm overflow-hidden flex items-center justify-center flex-shrink-0 p-1">
                      {profile.signature ? (
                        <img src={profile.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="text-zinc-600 text-xs text-center font-sans">No Signature</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col gap-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleSignatureUpload} 
                        className="hidden" 
                        id="signature-file-input"
                      />
                      <label 
                        htmlFor="signature-file-input" 
                        className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold text-center cursor-pointer transition-colors"
                      >
                        Choose Signature
                      </label>
                      {profile.signature && (
                        <button 
                          onClick={() => setProfile(prev => ({ ...prev, signature: '' }))}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold text-left cursor-pointer"
                        >
                          Remove Signature
                        </button>
                      )}
                      <p className="text-[10px] text-zinc-500">Supported formats: PNG (transparent background recommended), JPG.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DACH Specifics */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div>
                  <h3 className="text-md font-bold text-white mb-1">DACH Region Optional Details</h3>
                  <p className="text-xs text-zinc-400">
                    These cultural standards (age, birth city, and nationality) are expected in German *Lebensläufe* but are automatically omitted in English applications.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Date of Birth</label>
                    <input
                      type="text"
                      name="dateOfBirth"
                      value={profile.dateOfBirth}
                      onChange={handlePersonalChange}
                      className="glass-input px-4 py-2.5 w-full text-sm"
                      placeholder="e.g. 15. Mai 1992"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Place of Birth</label>
                    <input
                      type="text"
                      name="birthplace"
                      value={profile.birthplace}
                      onChange={handlePersonalChange}
                      className="glass-input px-4 py-2.5 w-full text-sm"
                      placeholder="e.g. Hamburg, Deutschland"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Nationality</label>
                    <input
                      type="text"
                      name="nationality"
                      value={profile.nationality}
                      onChange={handlePersonalChange}
                      className="glass-input px-4 py-2.5 w-full text-sm"
                      placeholder="e.g. Deutsch / German"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Work Experience */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                Work Experience
              </h2>

              {/* Added Experiences List */}
              {profile.workExperience.length > 0 && (
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Saved Positions</label>
                  <div className="space-y-3">
                    {profile.workExperience.map((exp, idx) => (
                      <div key={idx} className="flex justify-between items-start p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300">
                        <div className="flex-1">
                          <h4 className="font-bold text-white text-md">{exp.role} <span className="text-indigo-400 text-sm">@ {exp.company}</span></h4>
                          <p className="text-xs text-zinc-400 mt-0.5">{exp.location} | {exp.startDate} - {exp.current ? 'Present' : exp.endDate}</p>
                          {exp.bullets.length > 0 && (
                            <ul className="list-disc list-inside text-xs text-zinc-300 mt-2 space-y-1">
                              {exp.bullets.map((b, bIdx) => (
                                <li key={bIdx} className="line-clamp-2">{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEditExperience(idx)}
                            className="p-1.5 text-zinc-500 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="Edit position"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeExperience(idx)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="Delete position"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Experience Form Box */}
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
                <h3 className="font-semibold text-white text-sm">
                  {editingExpIndex !== null ? 'Edit Position' : 'Add New Position'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400">Company Name *</label>
                    <input
                      type="text"
                      value={newExp.company}
                      onChange={e => setNewExp(prev => ({ ...prev, company: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs"
                      placeholder="e.g. Siemens AG"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400">Role / Designation *</label>
                    <input
                      type="text"
                      value={newExp.role}
                      onChange={e => setNewExp(prev => ({ ...prev, role: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400">Location</label>
                    <input
                      type="text"
                      value={newExp.location}
                      onChange={e => setNewExp(prev => ({ ...prev, location: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs"
                      placeholder="e.g. Munich, Germany"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400">Start Date</label>
                      <input
                        type="text"
                        value={newExp.startDate}
                        onChange={e => setNewExp(prev => ({ ...prev, startDate: e.target.value }))}
                        className="glass-input px-3 py-2 text-xs"
                        placeholder="e.g. Jan 2021"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400">End Date</label>
                      <input
                        type="text"
                        value={newExp.endDate}
                        disabled={newExp.current}
                        onChange={e => setNewExp(prev => ({ ...prev, endDate: e.target.value }))}
                        className="glass-input px-3 py-2 text-xs disabled:opacity-40"
                        placeholder={newExp.current ? 'Current Position' : 'e.g. Dec 2023'}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="current"
                    checked={newExp.current}
                    onChange={e => setNewExp(prev => ({ ...prev, current: e.target.checked, endDate: e.target.checked ? 'Present' : '' }))}
                    className="accent-indigo-500 rounded"
                  />
                  <label htmlFor="current" className="text-xs text-zinc-300 select-none">I currently work here</label>
                </div>

                {/* Achievements list builder */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs text-zinc-400 block font-medium">Factual Achievement Bullet Points (100% Truthful)</label>
                  
                  {newExp.bullets.length > 0 && (
                    <ul className="space-y-1.5">
                      {newExp.bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex justify-between items-center px-3 py-1.5 rounded bg-white/5 border border-white/5 text-xs text-zinc-300">
                          <span className="flex-1">{b}</span>
                          <button
                            onClick={() => removeExpBullet(bIdx)}
                            className="p-1 hover:text-rose-400 ml-2 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={newBullet}
                      onChange={e => setNewBullet(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addExpBullet();
                        }
                      }}
                      className="glass-input px-3 py-2 text-xs flex-1"
                      placeholder="e.g. Developed core backend services using Node.js, reducing query response times by 30%."
                    />
                    <button
                      type="button"
                      onClick={addExpBullet}
                      className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Add Bullet
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    Use factual, metrics-driven bullets. The AI tailors them without hallucinating any non-existent stats.
                  </p>
                </div>

                {editingExpIndex !== null ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={saveExperienceEdit}
                      disabled={!newExp.company || !newExp.role}
                      className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditExperience}
                      className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-350 text-xs font-bold transition-all duration-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={addExperience}
                    disabled={!newExp.company || !newExp.role}
                    className="w-full py-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-white text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:hover:bg-indigo-600/10 disabled:hover:border-indigo-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    Save and Add Position to Experience List
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Education */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                Education Details
              </h2>

              {/* Added Education List */}
              {profile.education.length > 0 && (
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Saved Qualifications</label>
                  <div className="space-y-3">
                    {profile.education.map((edu, idx) => (
                      <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300">
                        <div>
                          <h4 className="font-bold text-white text-md">{edu.degree}</h4>
                          <p className="text-xs text-indigo-400 mt-0.5">{edu.institution} | {edu.location}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">{edu.startDate} - {edu.current ? 'Present' : edu.endDate}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startEditEducation(idx)}
                            className="p-1.5 text-zinc-500 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="Edit qualification"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeEducation(idx)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="Delete qualification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Education Box */}
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] space-y-4">
                <h3 className="font-semibold text-white text-sm">
                  {editingEduIndex !== null ? 'Edit Qualification' : 'Add New Qualification'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400">Institution *</label>
                    <input
                      type="text"
                      value={newEdu.institution}
                      onChange={e => setNewEdu(prev => ({ ...prev, institution: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs"
                      placeholder="e.g. Technical University Munich"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400">Degree / Qualification *</label>
                    <input
                      type="text"
                      value={newEdu.degree}
                      onChange={e => setNewEdu(prev => ({ ...prev, degree: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs"
                      placeholder="e.g. B.Sc. Computer Science"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-zinc-400">Location</label>
                    <input
                      type="text"
                      value={newEdu.location}
                      onChange={e => setNewEdu(prev => ({ ...prev, location: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs"
                      placeholder="e.g. Munich, Germany"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400">Start Date</label>
                      <input
                        type="text"
                        value={newEdu.startDate}
                        onChange={e => setNewEdu(prev => ({ ...prev, startDate: e.target.value }))}
                        className="glass-input px-3 py-2 text-xs"
                        placeholder="e.g. 2017"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-zinc-400">End Date (or graduation)</label>
                      <input
                        type="text"
                        value={newEdu.endDate}
                        disabled={newEdu.current}
                        onChange={e => setNewEdu(prev => ({ ...prev, endDate: e.target.value }))}
                        className="glass-input px-3 py-2 text-xs disabled:opacity-40"
                        placeholder={newEdu.current ? 'Ongoing' : 'e.g. 2020'}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="eduCurrent"
                    checked={newEdu.current}
                    onChange={e => setNewEdu(prev => ({ ...prev, current: e.target.checked, endDate: e.target.checked ? 'Present' : '' }))}
                    className="accent-indigo-500 rounded"
                  />
                  <label htmlFor="eduCurrent" className="text-xs text-zinc-300 select-none">Currently studying here</label>
                </div>

                {editingEduIndex !== null ? (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={saveEducationEdit}
                      disabled={!newEdu.institution || !newEdu.degree}
                      className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditEducation}
                      className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-350 text-xs font-bold transition-all duration-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={addEducation}
                    disabled={!newEdu.institution || !newEdu.degree}
                    className="w-full py-2.5 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/30 hover:border-indigo-500 text-white text-xs font-bold transition-all duration-300 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:hover:bg-indigo-600/10 disabled:hover:border-indigo-500/30"
                  >
                    <Plus className="w-4 h-4" />
                    Save and Add Qualification to Education List
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Skills & Languages */}
          {activeTab === 'skills' && (
            <div className="space-y-8">
              
              {/* Skills Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400" />
                  Skills Directory
                </h2>

                {/* Displaying Saved Skills */}
                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-xs text-indigo-300">
                        <span className="font-semibold text-white">{skill.name}</span>
                        <span className="opacity-50 text-[10px]">({skill.level})</span>
                        {skill.category && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-indigo-500/10 text-indigo-200">
                            {skill.category}
                          </span>
                        )}
                        <button
                          onClick={() => removeSkill(idx)}
                          className="hover:text-rose-400 p-0.5 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Skill Form */}
                <div className="flex flex-col md:flex-row items-end gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <div className="flex-1 flex flex-col gap-1 w-full">
                    <label className="text-xs text-zinc-400">Skill Name</label>
                    <input
                      type="text"
                      value={newSkill.name}
                      onChange={e => {
                        const val = e.target.value;
                        setNewSkill(prev => ({
                          ...prev,
                          name: val,
                          category: classifySkillCategory(val)
                        }));
                      }}
                      className="glass-input px-3 py-2 text-xs w-full"
                      placeholder="e.g. React.js, Kubernetes, Rust"
                    />
                  </div>

                  <div className="flex flex-col gap-1 w-full md:w-48">
                    <label className="text-xs text-zinc-400">Category</label>
                    <select
                      value={newSkill.category || 'Tools'}
                      onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs w-full"
                    >
                      {SKILL_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1 w-full md:w-48">
                    <label className="text-xs text-zinc-400">Proficiency Level</label>
                    <select
                      value={newSkill.level}
                      onChange={e => setNewSkill(prev => ({ ...prev, level: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs w-full"
                    >
                      {SKILL_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={addSkill}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 w-full md:w-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Languages Section */}
              <div className="space-y-4 pt-6 border-t border-white/5">
                <h2 className="text-xl font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-indigo-400" />
                  Languages & Proficiencies
                </h2>

                {/* Displaying Saved Languages */}
                {profile.languages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.languages.map((lang, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-xs text-purple-300">
                        <span className="font-semibold text-white">{lang.language}</span>
                        <span className="opacity-50 text-[10px]">({lang.level})</span>
                        <button
                          onClick={() => removeLanguage(idx)}
                          className="hover:text-rose-400 p-0.5 rounded cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Add Language Form */}
                <div className="flex flex-col md:flex-row items-end gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.01]">
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="text-xs text-zinc-400">Language</label>
                    <input
                      type="text"
                      value={newLang.language}
                      onChange={e => setNewLang(prev => ({ ...prev, language: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs w-full"
                      placeholder="e.g. English, German, French"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1 w-full md:w-48">
                    <label className="text-xs text-zinc-400">CEFR level / Fluency</label>
                    <select
                      value={newLang.level}
                      onChange={e => setNewLang(prev => ({ ...prev, level: e.target.value }))}
                      className="glass-input px-3 py-2 text-xs w-full"
                    >
                      {CEFR_LEVELS.map(level => (
                        <option key={level} value={level} className="bg-zinc-950 text-white">{level}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={addLanguage}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 w-full md:w-auto cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Projects */}
          {activeTab === 'projects' && (
            <div className="space-y-8">
              <h2 className="text-xl font-bold text-white pb-3 border-b border-white/5 flex items-center gap-2 font-sans">
                <FolderGit className="w-5 h-5 text-indigo-400" />
                Project Works
              </h2>

              {/* List of Existing Projects */}
              {profile.projects && profile.projects.length > 0 && (
                <div className="space-y-4">
                  {profile.projects.map((proj, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex items-start justify-between gap-4 font-sans">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-sm">{proj.name}</h4>
                          {proj.url && (
                            <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline">
                              Link
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">{proj.description}</p>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {proj.technologies.map((t, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-400 border border-zinc-700/50">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                       <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => startEditProject(idx)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-indigo-400 transition-all border border-zinc-800 cursor-pointer"
                          title="Edit project"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeProject(idx)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-all border border-zinc-800 cursor-pointer"
                          title="Remove project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Project Form */}
              <div className="p-5 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4 font-sans">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {editingProjIndex !== null ? (
                    <>
                      <Pencil className="w-4 h-4 text-indigo-400" />
                      Edit Project Work
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-indigo-400" />
                      Add Project Work
                    </>
                  )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Project Name</label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={e => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. JobFlow AI"
                      className="glass-input px-3.5 py-2 w-full text-xs text-white"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Project URL / Github Link (Optional)</label>
                    <input
                      type="url"
                      value={newProject.url || ''}
                      onChange={e => setNewProject(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="e.g. https://github.com/username/project"
                      className="glass-input px-3.5 py-2 w-full text-xs text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Technologies (Comma separated)</label>
                  <input
                    type="text"
                    value={newProjTechs}
                    onChange={e => setNewProjTechs(e.target.value)}
                    placeholder="e.g. Next.js, TypeScript, Tailwind CSS, PostgreSQL"
                    className="glass-input px-3.5 py-2 w-full text-xs text-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Project Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the project achievements, outcomes, responsibilities, or technical accomplishments..."
                    rows={3}
                    className="glass-input p-3 w-full text-xs text-white font-sans resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {editingProjIndex !== null ? (
                    <>
                      <button
                        type="button"
                        onClick={saveProjectEdit}
                        disabled={!newProject.name.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 w-full md:w-auto cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditProject}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={addProject}
                      disabled={!newProject.name.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 w-full md:w-auto cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Project
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Custom Sections */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" />
                    Custom Profile Sections
                  </h2>
                  <p className="text-zinc-400 text-xs mt-0.5 font-sans">
                    Create custom sections (e.g. Certifications, Publications, Volunteering, Custom Badges) to include in tailored CVs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewCustomSecTitle('');
                    setNewCustomSecType('bullet-list');
                    setShowAddCustomModal(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-500/20 cursor-pointer transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Section</span>
                </button>
              </div>

              {/* Sections List */}
              {(!profile.customSections || profile.customSections.length === 0) ? (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                  <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-zinc-300">No Custom Sections Created Yet</h4>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 font-sans">
                    Add custom sections to highlight specialized domains like Certifications, Patents, Volunteering, or Custom Skill Matrices.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCustomSecTitle('');
                      setNewCustomSecType('bullet-list');
                      setShowAddCustomModal(true);
                    }}
                    className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-indigo-400 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create First Section
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {profile.customSections.map((sec, secIdx) => (
                    <div
                      key={sec.id}
                      className="p-5 rounded-2xl bg-zinc-950/60 border border-white/10 space-y-4 hover:border-zinc-700/80 transition-colors font-sans"
                    >
                      {/* Section Header Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const updated = [...(profile.customSections || [])];
                              updated[secIdx] = { ...updated[secIdx], title: e.target.value };
                              setProfile(prev => ({ ...prev, customSections: updated }));
                            }}
                            placeholder="Section Title..."
                            className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-indigo-500 min-w-[200px]"
                          />
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                            {sec.type === 'bullet-list' ? 'Bullet List' : sec.type === 'paragraph' ? 'Paragraph Text' : sec.type === 'subgroup-chips' ? 'Subgroup Badges' : 'Structured Items'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            type="button"
                            disabled={secIdx === 0}
                            onClick={() => {
                              const updated = [...(profile.customSections || [])];
                              const temp = updated[secIdx];
                              updated[secIdx] = updated[secIdx - 1];
                              updated[secIdx - 1] = temp;
                              setProfile(prev => ({ ...prev, customSections: updated }));
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                            title="Move Section Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={secIdx === (profile.customSections || []).length - 1}
                            onClick={() => {
                              const updated = [...(profile.customSections || [])];
                              const temp = updated[secIdx];
                              updated[secIdx] = updated[secIdx + 1];
                              updated[secIdx + 1] = temp;
                              setProfile(prev => ({ ...prev, customSections: updated }));
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
                            title="Move Section Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (profile.customSections || []).filter((_, i) => i !== secIdx);
                              setProfile(prev => ({ ...prev, customSections: updated }));
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer transition-colors"
                            title="Delete Section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Layout Type 1: Bullet List */}
                      {sec.type === 'bullet-list' && (
                        <div className="space-y-2.5">
                          {(sec.bullets || []).map((b, bIdx) => (
                            <div key={bIdx} className="flex items-start gap-2 group">
                              <span className="text-zinc-500 text-xs mt-2 select-none">•</span>
                              <input
                                type="text"
                                value={b}
                                onChange={(e) => {
                                  const updated = [...(profile.customSections || [])];
                                  const bullets = [...(updated[secIdx].bullets || [])];
                                  bullets[bIdx] = e.target.value;
                                  updated[secIdx] = { ...updated[secIdx], bullets };
                                  setProfile(prev => ({ ...prev, customSections: updated }));
                                }}
                                placeholder="Achievement, certification, or detail..."
                                className="glass-input px-3 py-1.5 w-full text-xs text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(profile.customSections || [])];
                                  const bullets = (updated[secIdx].bullets || []).filter((_, i) => i !== bIdx);
                                  updated[secIdx] = { ...updated[secIdx], bullets };
                                  setProfile(prev => ({ ...prev, customSections: updated }));
                                }}
                                className="p-1 text-zinc-600 hover:text-rose-400 mt-1 cursor-pointer transition-colors"
                                title="Remove Bullet"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(profile.customSections || [])];
                              const bullets = [...(updated[secIdx].bullets || []), ''];
                              updated[secIdx] = { ...updated[secIdx], bullets };
                              setProfile(prev => ({ ...prev, customSections: updated }));
                            }}
                            className="px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg flex items-center gap-1 font-semibold transition-colors cursor-pointer mt-2"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Bullet</span>
                          </button>
                        </div>
                      )}

                      {/* Layout Type 2: Paragraph */}
                      {sec.type === 'paragraph' && (
                        <div className="space-y-2">
                          <textarea
                            value={sec.content || ''}
                            onChange={(e) => {
                              const updated = [...(profile.customSections || [])];
                              updated[secIdx] = { ...updated[secIdx], content: e.target.value };
                              setProfile(prev => ({ ...prev, customSections: updated }));
                            }}
                            rows={4}
                            placeholder="Write section narrative, executive overview, or research details..."
                            className="glass-input p-3 w-full text-xs text-white font-sans resize-none"
                          />
                        </div>
                      )}

                      {/* Layout Type 3: Subgroup Chips */}
                      {sec.type === 'subgroup-chips' && (
                        <div className="space-y-4">
                          {(sec.subgroups || []).map((sub, subIdx) => (
                            <div key={sub.id || subIdx} className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <input
                                  type="text"
                                  value={sub.name}
                                  onChange={(e) => {
                                    const updated = [...(profile.customSections || [])];
                                    const subgroups = [...(updated[secIdx].subgroups || [])];
                                    subgroups[subIdx] = { ...subgroups[subIdx], name: e.target.value };
                                    updated[secIdx] = { ...updated[secIdx], subgroups };
                                    setProfile(prev => ({ ...prev, customSections: updated }));
                                  }}
                                  placeholder="Subgroup Name (e.g. Frameworks, Cloud)..."
                                  className="bg-zinc-950 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(profile.customSections || [])];
                                    const subgroups = (updated[secIdx].subgroups || []).filter((_, i) => i !== subIdx);
                                    updated[secIdx] = { ...updated[secIdx], subgroups };
                                    setProfile(prev => ({ ...prev, customSections: updated }));
                                  }}
                                  className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                                  title="Delete Subgroup"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-1.5 items-center">
                                {sub.items.map((item, itemIdx) => (
                                  <span
                                    key={itemIdx}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] bg-zinc-800 text-zinc-200 border border-zinc-700"
                                  >
                                    <span>{item}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(profile.customSections || [])];
                                        const subgroups = [...(updated[secIdx].subgroups || [])];
                                        subgroups[subIdx].items = subgroups[subIdx].items.filter((_, i) => i !== itemIdx);
                                        updated[secIdx] = { ...updated[secIdx], subgroups };
                                        setProfile(prev => ({ ...prev, customSections: updated }));
                                      }}
                                      className="text-zinc-500 hover:text-rose-400 cursor-pointer ml-1"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                                <input
                                  type="text"
                                  placeholder="+ Add chip (Press Enter)"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                      e.preventDefault();
                                      const val = e.currentTarget.value.trim();
                                      const updated = [...(profile.customSections || [])];
                                      const subgroups = [...(updated[secIdx].subgroups || [])];
                                      subgroups[subIdx] = { ...subgroups[subIdx], items: [...subgroups[subIdx].items, val] };
                                      updated[secIdx] = { ...updated[secIdx], subgroups };
                                      setProfile(prev => ({ ...prev, customSections: updated }));
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                  className="bg-transparent border border-dashed border-zinc-700 hover:border-zinc-500 rounded-md px-2.5 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-indigo-500 w-36"
                                />
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(profile.customSections || [])];
                              const subgroups = [
                                ...(updated[secIdx].subgroups || []),
                                { id: 'sub-' + Date.now(), name: 'New Subgroup', items: ['Item 1'] }
                              ];
                              updated[secIdx] = { ...updated[secIdx], subgroups };
                              setProfile(prev => ({ ...prev, customSections: updated }));
                            }}
                            className="px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Subgroup</span>
                          </button>
                        </div>
                      )}

                      {/* Layout Type 4: Structured Items */}
                      {sec.type === 'structured-items' && (
                        <div className="space-y-4">
                          {(sec.items || []).map((item, itemIdx) => (
                            <div key={item.id || itemIdx} className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-zinc-400">Entry #{itemIdx + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(profile.customSections || [])];
                                    const items = (updated[secIdx].items || []).filter((_, i) => i !== itemIdx);
                                    updated[secIdx] = { ...updated[secIdx], items };
                                    setProfile(prev => ({ ...prev, customSections: updated }));
                                  }}
                                  className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                                  title="Delete Entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Title / Role / Award</label>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => {
                                      const updated = [...(profile.customSections || [])];
                                      const items = [...(updated[secIdx].items || [])];
                                      items[itemIdx] = { ...items[itemIdx], title: e.target.value };
                                      updated[secIdx] = { ...updated[secIdx], items };
                                      setProfile(prev => ({ ...prev, customSections: updated }));
                                    }}
                                    placeholder="e.g. AWS Certified Solutions Architect"
                                    className="glass-input px-3 py-1.5 w-full text-xs text-white mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Issuer / Organization</label>
                                  <input
                                    type="text"
                                    value={item.subtitle || ''}
                                    onChange={(e) => {
                                      const updated = [...(profile.customSections || [])];
                                      const items = [...(updated[secIdx].items || [])];
                                      items[itemIdx] = { ...items[itemIdx], subtitle: e.target.value };
                                      updated[secIdx] = { ...updated[secIdx], items };
                                      setProfile(prev => ({ ...prev, customSections: updated }));
                                    }}
                                    placeholder="e.g. Amazon Web Services"
                                    className="glass-input px-3 py-1.5 w-full text-xs text-white mt-1"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] text-zinc-400 font-semibold uppercase">Date / Location</label>
                                  <input
                                    type="text"
                                    value={item.dateOrLocation || ''}
                                    onChange={(e) => {
                                      const updated = [...(profile.customSections || [])];
                                      const items = [...(updated[secIdx].items || [])];
                                      items[itemIdx] = { ...items[itemIdx], dateOrLocation: e.target.value };
                                      updated[secIdx] = { ...updated[secIdx], items };
                                      setProfile(prev => ({ ...prev, customSections: updated }));
                                    }}
                                    placeholder="e.g. 2024"
                                    className="glass-input px-3 py-1.5 w-full text-xs text-white mt-1"
                                  />
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] text-zinc-400 font-semibold uppercase">Bullet Points</label>
                                {(item.bullets || []).map((b, bIdx) => (
                                  <div key={bIdx} className="flex items-center gap-2">
                                    <span className="text-zinc-500 text-xs select-none">•</span>
                                    <input
                                      type="text"
                                      value={b}
                                      onChange={(e) => {
                                        const updated = [...(profile.customSections || [])];
                                        const items = [...(updated[secIdx].items || [])];
                                        const bullets = [...(items[itemIdx].bullets || [])];
                                        bullets[bIdx] = e.target.value;
                                        items[itemIdx] = { ...items[itemIdx], bullets };
                                        updated[secIdx] = { ...updated[secIdx], items };
                                        setProfile(prev => ({ ...prev, customSections: updated }));
                                      }}
                                      className="glass-input px-3 py-1 w-full text-xs text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = [...(profile.customSections || [])];
                                        const items = [...(updated[secIdx].items || [])];
                                        items[itemIdx].bullets = (items[itemIdx].bullets || []).filter((_, i) => i !== bIdx);
                                        updated[secIdx] = { ...updated[secIdx], items };
                                        setProfile(prev => ({ ...prev, customSections: updated }));
                                      }}
                                      className="text-zinc-600 hover:text-rose-400 cursor-pointer"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...(profile.customSections || [])];
                                    const items = [...(updated[secIdx].items || [])];
                                    items[itemIdx].bullets = [...(items[itemIdx].bullets || []), ''];
                                    updated[secIdx] = { ...updated[secIdx], items };
                                    setProfile(prev => ({ ...prev, customSections: updated }));
                                  }}
                                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 cursor-pointer pt-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Bullet Point</span>
                                </button>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(profile.customSections || [])];
                              const items = [
                                ...(updated[secIdx].items || []),
                                { id: 'item-' + Date.now(), title: 'New Entry', subtitle: '', dateOrLocation: '', bullets: ['Key detail...'] }
                              ];
                              updated[secIdx] = { ...updated[secIdx], items };
                              setProfile(prev => ({ ...prev, customSections: updated }));
                            }}
                            className="px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Structured Entry</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Add Custom Section Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[var(--layout-surface-panel-bg)] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 font-sans">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Create Custom Section</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Section Title</label>
                <input
                  type="text"
                  value={newCustomSecTitle}
                  onChange={(e) => setNewCustomSecTitle(e.target.value)}
                  placeholder="e.g. Certifications, Publications, Volunteering, Key Awards"
                  className="glass-input px-3.5 py-2.5 w-full text-xs text-white focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-zinc-300">Choose Section Layout Style</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewCustomSecType('bullet-list')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                      newCustomSecType === 'bullet-list'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <List className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold">Bullet Points</span>
                    <span className="text-[10px] text-zinc-400 leading-tight">Key takeaways, achievements, and lists</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCustomSecType('paragraph')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                      newCustomSecType === 'paragraph'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <AlignLeft className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold">Paragraph / Narrative</span>
                    <span className="text-[10px] text-zinc-400 leading-tight">Longer text blocks, executive bio, research</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCustomSecType('subgroup-chips')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                      newCustomSecType === 'subgroup-chips'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <Tag className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold">Subgroups & Badges</span>
                    <span className="text-[10px] text-zinc-400 leading-tight">Categories with pill chips / tags</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCustomSecType('structured-items')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer ${
                      newCustomSecType === 'structured-items'
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold">Structured Entries</span>
                    <span className="text-[10px] text-zinc-400 leading-tight">Title, organization, date, and bullets</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newCustomSecTitle.trim()}
                onClick={() => {
                  const newSec = createDefaultCustomSection(newCustomSecType, newCustomSecTitle.trim());
                  setProfile(prev => ({
                    ...prev,
                    customSections: [...(prev.customSections || []), newSec]
                  }));
                  setShowAddCustomModal(false);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/20 cursor-pointer transition-all"
              >
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Processing Modal */}
      {showSigProcessor && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <style>{`
            .checkerboard-bg {
              background-image: linear-gradient(45deg, var(--effect-checkerboard-square) 25%, transparent 25%), 
                                linear-gradient(-45deg, var(--effect-checkerboard-square) 25%, transparent 25%), 
                                linear-gradient(45deg, transparent 75%, var(--effect-checkerboard-square) 75%), 
                                linear-gradient(-45deg, transparent 75%, var(--effect-checkerboard-square) 75%);
              background-size: 16px 16px;
              background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
              background-color: var(--effect-checkerboard-base);
            }
          `}</style>
          <div className="relative w-full max-w-3xl bg-[var(--layout-surface-panel-bg)] border border-zinc-800/80 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Signature Background Removal</h3>
              </div>
              <button 
                onClick={() => {
                  setShowSigProcessor(false);
                  setSigProcessorOriginal('');
                  setSigProcessorProcessed('');
                }}
                className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded bg-zinc-900 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Original */}
              <div className="flex flex-col gap-2 p-3 bg-zinc-950/60 rounded-xl border border-zinc-900">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center">Original Upload</span>
                <div className="w-full h-40 bg-zinc-900 rounded-lg flex items-center justify-center overflow-hidden p-2">
                  <img src={sigProcessorOriginal} alt="Original Signature" className="max-h-full max-w-full object-contain" />
                </div>
              </div>

              {/* Right Column: Processed */}
              <div className="flex flex-col gap-2 p-3 bg-zinc-950/60 rounded-xl border border-zinc-900 relative">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
                  Processed Output
                  {sigProcessing && <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />}
                </span>
                <div className="w-full h-40 bg-zinc-900 rounded-lg flex items-center justify-center overflow-hidden p-2 checkerboard-bg">
                  {sigProcessorProcessed ? (
                    <img src={sigProcessorProcessed} alt="Processed Signature" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-zinc-600 text-xs text-center">Processing...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sensitivity Controls */}
            <div className="flex flex-col gap-2 p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl">
              <div className="flex justify-between items-center text-xs text-zinc-400">
                <span className="font-semibold text-zinc-300">Background Tolerance Sensitivity</span>
                <span className="font-mono text-indigo-400 font-semibold">{sigProcessorThreshold}</span>
              </div>
              <input 
                type="range"
                min="50"
                max="250"
                step="1"
                value={sigProcessorThreshold}
                onChange={e => setSigProcessorThreshold(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Drag the slider to the left if lines are missing (lower threshold keeps more ink details). Drag to the right if there is still grey paper background visible (higher threshold removes lighter colors).
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/60">
              <button
                onClick={() => {
                  setShowSigProcessor(false);
                  setSigProcessorOriginal('');
                  setSigProcessorProcessed('');
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs cursor-pointer transition-colors"
              >
                Cancel & Discard
              </button>
              <button
                onClick={() => {
                  if (sigProcessorProcessed) {
                    setProfile(prev => ({ ...prev, signature: sigProcessorProcessed }));
                  }
                  setShowSigProcessor(false);
                  setSigProcessorOriginal('');
                  setSigProcessorProcessed('');
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-indigo-500/20 transition-all"
              >
                Accept Processed Signature
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
