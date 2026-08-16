'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, Calendar, MapPin, DollarSign, Clock, FileText, Trash2, Eye, ChevronRight, ChevronLeft, Award, Sparkles, LayoutGrid, CheckCircle2, TrendingUp, Building, User, Mail, Globe, Loader2
} from 'lucide-react';

interface GeneratedDocument {
  id: string;
  type: string;
  content: string;
}

interface ApplicationStatusHistory {
  id: string;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
}

interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: string; // TAILORED, APPLIED, INTERVIEWING, OFFER, REJECTED
  salaryExpectation?: string;
  noticePeriod?: string;
  signingLocation?: string;
  customNotes?: string;
  techStack?: string;
  mainRequirements?: string;
  recruiterName?: string;
  contactInfo?: string;
  jobType?: string;
  location?: string;
  remoteOrPhysical?: string;
  rawJobDescription: string;
  matchScore: number;
  gapAnalysis: {
    missingSkills: string[];
    matchingKeywords: string[];
    recommendations: string;
  };
  targetLanguage: string;
  createdAt: string;
  documents: GeneratedDocument[];
  statusHistory?: ApplicationStatusHistory[];
}

const COLUMNS = [
  { id: 'TAILORED', name: 'Saved / Tailored', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-300' },
  { id: 'APPLIED', name: 'Applied', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
  { id: 'INTERVIEWING', name: 'Interviewing', color: 'border-purple-500/30 bg-purple-500/5 text-purple-300' },
  { id: 'OFFER', name: 'Offer Received', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' },
  { id: 'REJECTED', name: 'Rejected', color: 'border-red-400 bg-zinc-900/40 text-red-900' }
];

export function getAgingStatus(app: JobApplication): {
  days: number;
  label: string;
  isStale: boolean;
  type: 'applied-stale' | 'interview-stale' | 'tailored-stale' | 'normal';
} {
  const created = new Date(app.createdAt).getTime();
  let lastStatusDate = created;
  if (app.statusHistory && app.statusHistory.length > 0) {
    const latest = app.statusHistory[app.statusHistory.length - 1];
    lastStatusDate = new Date(latest.createdAt).getTime();
  }
  const diffDays = Math.max(0, Math.floor((Date.now() - lastStatusDate) / (1000 * 60 * 60 * 24)));

  if (app.status === 'APPLIED' && diffDays >= 7) {
    return {
      days: diffDays,
      label: `Applied ${diffDays}d ago — Follow-up recommended`,
      isStale: true,
      type: 'applied-stale'
    };
  }
  if (app.status === 'INTERVIEWING' && diffDays >= 2) {
    return {
      days: diffDays,
      label: `Interviewed ${diffDays}d ago — Send thank-you note`,
      isStale: true,
      type: 'interview-stale'
    };
  }
  if (app.status === 'TAILORED' && diffDays >= 5) {
    return {
      days: diffDays,
      label: `Tailored ${diffDays}d ago — Ready to submit`,
      isStale: true,
      type: 'tailored-stale'
    };
  }
  return {
    days: diffDays,
    label: `${diffDays}d ago`,
    isStale: false,
    type: 'normal'
  };
}

export function generateFollowUpDraft(app: JobApplication, templateType: 'status-check' | 'thank-you' | 'offer-inquiry') {
  const isDe = app.targetLanguage === 'DE';
  const recruiter = app.recruiterName || (isDe ? 'Sehr geehrtes Hiring Team' : 'Hiring Team');
  const role = app.role;
  const company = app.company;

  if (templateType === 'status-check') {
    if (isDe) {
      return {
        subject: `Nachfrage zum Bewerbungsstatus – Position: ${role}`,
        body: `Sehr geehrte/r ${recruiter},\n\nich hoffe, es geht Ihnen gut.\n\nVor knapp einer Woche habe ich mich für die Stelle als ${role} bei ${company} beworben. Da ich nach wie vor großes Interesse an der Position und einer Zusammenarbeit mit Ihrem Team habe, möchte ich mich kurz nach dem aktuellen Stand des Auswahlprozesses erkundigen.\n\nSollten Sie weitere Unterlagen oder Informationen von mir benötigen, stehe ich Ihnen jederzeit gerne zur Verfügung.\n\nIch freue mich auf Ihre Rückmeldung und wünsche Ihnen eine erfolgreiche Woche.\n\nMit freundlichen Grüßen,\n[Ihr Name]`
      };
    } else {
      return {
        subject: `Following up on application – ${role} at ${company}`,
        body: `Dear ${recruiter},\n\nI hope you're having a great week.\n\nI am writing to briefly follow up on my application for the ${role} position at ${company}, submitted last week. I remain very enthusiastic about the opportunity to contribute to ${company}.\n\nPlease let me know if you need any additional information or work samples from my side. I look forward to hearing about the next steps in the process.\n\nBest regards,\n[Your Name]`
      };
    }
  }

  if (templateType === 'thank-you') {
    if (isDe) {
      return {
        subject: `Vielen Dank für das angenehme Gespräch – ${role}`,
        body: `Sehr geehrte/r ${recruiter},\n\nvielen Dank für das aufschlussreiche und angenehme Gespräch über die Position als ${role} bei ${company}.\n\nUnsere Diskussion über die anstehenden Projekte hat mein Interesse an der Rolle nochmals bestärkt. Ich bin überzeugt, dass ich mit meinen Kenntnissen einen wertvollen Beitrag zu Ihren Teamzielen leisten kann.\n\nIch freue mich auf die nächsten Schritte und stehe für Rückfragen jederzeit gerne bereit.\n\nBeste Grüße,\n[Ihr Name]`
      };
    } else {
      return {
        subject: `Thank you for the conversation – ${role} at ${company}`,
        body: `Dear ${recruiter},\n\nThank you so much for taking the time to speak with me about the ${role} position at ${company}.\n\nI really enjoyed learning more about the team's upcoming initiatives and challenges. Our conversation reinforced my excitement about the role and how my background aligns with your goals.\n\nPlease don't hesitate to reach out if you need any further details. I look forward to the next steps.\n\nBest regards,\n[Your Name]`
      };
    }
  }

  // offer-inquiry
  if (isDe) {
    return {
      subject: `Rückfrage zum Angebot – ${role} bei ${company}`,
      body: `Sehr geehrte/r ${recruiter},\n\nvielen Dank für das Angebot und das damit verbundene Vertrauen. Ich freue mich sehr über diese Chance.\n\nBevor ich meine endgültige Entscheidung treffe, hätte ich noch ein bis zwei kurze Rückfragen zu den Vertragsdetails. Wäre ein kurzes 10-minütiges Telefonat diese Woche möglich?\n\nVielen Dank im Voraus.\n\nMit freundlichen Grüßen,\n[Ihr Name]`
    };
  } else {
    return {
      subject: `Inquiry regarding offer – ${role} at ${company}`,
      body: `Dear ${recruiter},\n\nThank you very much for offering me the ${role} position at ${company}. I am thrilled about the opportunity to join your team.\n\nBefore making a final decision, I have a couple of quick questions regarding the details of the offer. Would you have 10 minutes for a brief call sometime this week?\n\nThank you again for your time and consideration.\n\nBest regards,\n[Your Name]`
    };
  }
}

export default function Dashboard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [currentView, setCurrentView] = useState<'kanban' | 'spreadsheet' | 'calendar'>('kanban');
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Drag and Drop & Processing States
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [updatingStatusAppId, setUpdatingStatusAppId] = useState<string | null>(null);

  // Follow-Up Assistant modal states
  const [followUpModalApp, setFollowUpModalApp] = useState<JobApplication | null>(null);
  const [followUpType, setFollowUpType] = useState<'status-check' | 'thank-you' | 'offer-inquiry'>('status-check');
  const [followUpSubject, setFollowUpSubject] = useState('');
  const [followUpBody, setFollowUpBody] = useState('');
  const [followUpCopied, setFollowUpCopied] = useState(false);

  const openFollowUpModal = (app: JobApplication, initialType?: 'status-check' | 'thank-you' | 'offer-inquiry') => {
    const defaultType = initialType || (app.status === 'INTERVIEWING' ? 'thank-you' : app.status === 'OFFER' ? 'offer-inquiry' : 'status-check');
    setFollowUpType(defaultType);
    const draft = generateFollowUpDraft(app, defaultType);
    setFollowUpSubject(draft.subject);
    setFollowUpBody(draft.body);
    setFollowUpModalApp(app);
    setFollowUpCopied(false);
  };

  const handleFollowUpTypeChange = (type: 'status-check' | 'thank-you' | 'offer-inquiry') => {
    setFollowUpType(type);
    if (followUpModalApp) {
      const draft = generateFollowUpDraft(followUpModalApp, type);
      setFollowUpSubject(draft.subject);
      setFollowUpBody(draft.body);
      setFollowUpCopied(false);
    }
  };

  // Scheduler state variables
  const [calendarModalApp, setCalendarModalApp] = useState<JobApplication | null>(null);
  const [eventType, setEventType] = useState<'apply' | 'applied' | 'interview' | 'offer' | 'custom'>('apply');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('10:00');
  const [eventDuration, setEventDuration] = useState('60'); // minutes
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  useEffect(() => {
    if (calendarModalApp) {
      let type: 'apply' | 'applied' | 'interview' | 'offer' | 'custom' = 'apply';
      if (calendarModalApp.status === 'APPLIED') type = 'applied';
      else if (calendarModalApp.status === 'INTERVIEWING') type = 'interview';
      else if (calendarModalApp.status === 'OFFER') type = 'offer';
      setEventType(type);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      setEventTime('10:00');
      setEventDuration('60');

      if (type === 'applied') {
        setEventDate(todayStr);
      } else if (type === 'offer') {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        setEventDate(nextWeek.toISOString().split('T')[0]);
      } else {
        setEventDate(tomorrowStr);
      }

      const titleLabel =
        type === 'apply' ? 'Apply Deadline' :
          type === 'applied' ? 'Applied Milestone' :
            type === 'interview' ? 'Interview' :
              type === 'offer' ? 'Offer decision due' : 'Task';
      setEventTitle(`${titleLabel}: ${calendarModalApp.role} @ ${calendarModalApp.company}`);

      const loc = calendarModalApp.location || '';
      const mode = calendarModalApp.remoteOrPhysical || '';
      setEventLocation([loc, mode].filter(Boolean).join(' - ') || 'Not specified');

      let desc = '';
      desc += `Company: ${calendarModalApp.company}\n`;
      desc += `Role: ${calendarModalApp.role}\n`;
      desc += `Match Score: ${calendarModalApp.matchScore}%\n`;
      if (calendarModalApp.techStack) desc += `Tech Stack: ${calendarModalApp.techStack}\n`;
      if (calendarModalApp.recruiterName) desc += `Recruiter: ${calendarModalApp.recruiterName} (${calendarModalApp.contactInfo || ''})\n`;
      if (calendarModalApp.mainRequirements) desc += `Requirements:\n${calendarModalApp.mainRequirements}\n`;
      if (calendarModalApp.customNotes) desc += `My Notes: ${calendarModalApp.customNotes}\n`;
      desc += `\nApplication tracked in JobFlow AI.`;
      setEventDescription(desc);
    }
  }, [calendarModalApp]);

  const handleEventTypeChange = (newType: typeof eventType) => {
    setEventType(newType);
    if (!calendarModalApp) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const titleLabel =
      newType === 'apply' ? 'Apply Deadline' :
        newType === 'applied' ? 'Applied Milestone' :
          newType === 'interview' ? 'Interview' :
            newType === 'offer' ? 'Offer decision due' : 'Task';
    setEventTitle(`${titleLabel}: ${calendarModalApp.role} @ ${calendarModalApp.company}`);

    if (newType === 'applied') {
      setEventDate(todayStr);
    } else if (newType === 'offer') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setEventDate(nextWeek.toISOString().split('T')[0]);
    } else {
      setEventDate(tomorrowStr);
    }
  };

  const generateGoogleCalendarUrl = () => {
    if (!calendarModalApp) return '';
    const base = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

    let datesParam = '';
    const dateParts = eventDate.split('-');
    if (dateParts.length !== 3) return '';

    const isAllDay = eventType === 'apply' || eventType === 'offer';

    if (isAllDay) {
      const startDateStr = dateParts.join('');
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 1);
      const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
      datesParam = `${startDateStr}/${endDateStr}`;
    } else {
      const localDateTime = new Date(`${eventDate}T${eventTime}:00`);
      if (isNaN(localDateTime.getTime())) return '';

      const startStr = localDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDateTime = new Date(localDateTime.getTime() + parseInt(eventDuration) * 60 * 1000);
      const endStr = endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      datesParam = `${startStr}/${endStr}`;
    }

    const url = `${base}&text=${encodeURIComponent(eventTitle)}&dates=${datesParam}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;
    return url;
  };

  const downloadIcsFile = () => {
    if (!calendarModalApp) return;
    const isAllDay = eventType === 'apply' || eventType === 'offer';

    let dtStart = '';
    let dtEnd = '';

    const dateParts = eventDate.split('-');
    if (dateParts.length !== 3) return;

    if (isAllDay) {
      const startDateStr = dateParts.join('');
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 1);
      const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');
      dtStart = `VALUE=DATE:${startDateStr}`;
      dtEnd = `VALUE=DATE:${endDateStr}`;
    } else {
      const localDateTime = new Date(`${eventDate}T${eventTime}:00`);
      if (isNaN(localDateTime.getTime())) return;

      const startStr = localDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDateTime = new Date(localDateTime.getTime() + parseInt(eventDuration) * 60 * 1000);
      const endStr = endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      dtStart = startStr;
      dtEnd = endStr;
    }

    const escapedDesc = eventDescription
      .replace(/\\/g, '\\\\')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;')
      .replace(/\n/g, '\\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JobFlow AI//Calendar Event//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:${eventTitle}`,
      isAllDay ? `DTSTART;${dtStart}` : `DTSTART:${dtStart}`,
      isAllDay ? `DTEND;${dtEnd}` : `DTEND:${dtEnd}`,
      `LOCATION:${eventLocation}`,
      `DESCRIPTION:${escapedDesc}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAppStatus = async (id: string, newStatus: string) => {
    const currentApp = applications.find(a => a.id === id);
    if (currentApp && currentApp.status === newStatus) return;

    setUpdatingStatusAppId(id);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setApplications(prev =>
          prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
        );
        // Sync open detail panel state
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatusAppId(null);
    }
  };

  const deleteApplication = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this job application from history?')) return;

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setApplications(prev => prev.filter(app => app.id !== id));
        if (selectedApp?.id === id) setSelectedApp(null);
      }
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  // Stats calculation
  const totalApps = applications.length;
  const interviewApps = applications.filter(a => a.status === 'INTERVIEWING').length;
  const offerApps = applications.filter(a => a.status === 'OFFER').length;
  const avgMatchScore = totalApps > 0
    ? Math.round(applications.reduce((acc, a) => acc + a.matchScore, 0) / totalApps)
    : 0;

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-w-0 flex-1 flex flex-col space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-64 bg-white/5 rounded-xl"></div>
          <div className="h-4 w-96 bg-white/5 rounded-lg"></div>
        </div>

        {/* 4 Scorecard Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-white/5 bg-zinc-950/40">
              <div className="w-12 h-12 rounded-xl bg-white/5"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-white/5 rounded"></div>
                <div className="h-6 w-12 bg-white/10 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 border-b border-white/5 pb-4">
          <div className="h-8 w-32 bg-white/5 rounded-xl"></div>
          <div className="h-8 w-36 bg-white/5 rounded-xl"></div>
          <div className="h-8 w-32 bg-white/5 rounded-xl"></div>
        </div>

        {/* Kanban Board Columns Skeleton */}
        <div className="flex gap-4 overflow-hidden h-[calc(100vh-380px)]">
          {[1, 2, 3, 4, 5].map(colIdx => (
            <div key={colIdx} className="flex-1 flex flex-col rounded-2xl border border-white/5 bg-zinc-950/20 p-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="h-4 w-20 bg-white/5 rounded"></div>
                <div className="h-4 w-6 bg-white/5 rounded"></div>
              </div>
              <div className="space-y-3 flex-1">
                {[1, 2].map(cardIdx => (
                  <div key={cardIdx} className="glass-panel p-4 rounded-xl space-y-3 border border-white/5 bg-zinc-900/30">
                    <div className="flex justify-between">
                      <div className="h-3 w-12 bg-white/5 rounded"></div>
                      <div className="h-3 w-16 bg-white/10 rounded"></div>
                    </div>
                    <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                    <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                    <div className="h-3 w-1/3 bg-white/5 rounded pt-2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-w-0 flex-1 flex flex-col">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-indigo-200 bg-clip-text text-transparent">
              JobFlow Command Center
            </h1>
          </div>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Track custom resume revisions, interviews, and offers in one centralized, multi-language hub.
          </p>
        </div>
      </div>

      {/* Analytics Summary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 w-full">
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Total Pipeline</span>
            <span className="text-2xl font-bold text-white">{totalApps}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Active Interviews</span>
            <span className="text-2xl font-bold text-white">{interviewApps}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Offers Secured</span>
            <span className="text-2xl font-bold text-white">{offerApps}</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Average Match %</span>
            <span className="text-2xl font-bold text-white">{avgMatchScore}%</span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4 no-print font-sans">
        <button
          onClick={() => setCurrentView('kanban')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentView === 'kanban'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
        >
          📋 Kanban Board
        </button>
        <button
          onClick={() => setCurrentView('spreadsheet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentView === 'spreadsheet'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
        >
          📊 Spreadsheet View
        </button>
        <button
          onClick={() => setCurrentView('calendar')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentView === 'calendar'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
              : 'bg-white/5 text-zinc-400 hover:text-white'
            }`}
        >
          📅 Calendar View
        </button>
      </div>

      {/* Main Kanban Board Layout */}
      {currentView === 'kanban' && (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1000px] h-[calc(100vh-340px)]">
            {COLUMNS.map(col => {
              const columnApps = applications.filter(app => app.status === col.id);
              const isOver = dragOverColumnId === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverColumnId !== col.id) {
                      setDragOverColumnId(col.id);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverColumnId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverColumnId(null);
                    const appId = e.dataTransfer.getData('text/plain') || draggingAppId;
                    if (appId) {
                      updateAppStatus(appId, col.id);
                    }
                  }}
                  className={`flex-1 flex flex-col rounded-2xl border transition-all duration-200 p-4 w-[280px] ${
                    isOver
                      ? 'border-indigo-500/80 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 scale-[1.01]'
                      : 'border-white/5 bg-zinc-950/20 backdrop-blur-sm'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${col.color}`}>
                      {col.name}
                    </span>
                    <span className="text-xs text-zinc-500 font-bold bg-white/5 px-2 py-0.5 rounded">
                      {columnApps.length}
                    </span>
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-grow overflow-y-auto space-y-3 pr-1">
                    {columnApps.length > 0 ? (
                      columnApps.map(app => {
                        const isDragging = draggingAppId === app.id;
                        const isUpdating = updatingStatusAppId === app.id;
                        return (
                          <div
                            key={app.id}
                            draggable={!isUpdating}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', app.id);
                              setDraggingAppId(app.id);
                            }}
                            onDragEnd={() => {
                              setDraggingAppId(null);
                            }}
                            onClick={() => setSelectedApp(app)}
                            className={`glass-panel glass-panel-hover p-4 rounded-xl cursor-grab active:cursor-grabbing select-none space-y-3 relative group transition-all duration-200 ${
                              isDragging ? 'opacity-40 scale-95 border-indigo-500/50' : ''
                            } ${isUpdating ? 'pointer-events-none ring-1 ring-indigo-500/40 bg-indigo-500/5' : ''}`}
                          >
                            {/* Processing Spinner Overlay */}
                            {isUpdating && (
                              <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-[1px] rounded-xl flex items-center justify-center gap-2 z-20 text-indigo-300 text-xs font-bold animate-in fade-in duration-150">
                                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                                <span>Updating...</span>
                              </div>
                            )}

                            {/* Match & Lang tags */}
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-zinc-500 font-sans">
                                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-zinc-300">
                                  {app.targetLanguage === 'DE' ? '🇩🇪 DE' : '🇬🇧 EN'}
                                </span>
                              </span>

                              <span className={`inline-flex items-center gap-1 text-xs font-bold ${app.matchScore >= 80 ? 'text-emerald-400' : app.matchScore >= 60 ? 'text-amber-400' : 'text-zinc-400'
                                }`}>
                                <Award className="w-3.5 h-3.5" />
                                {app.matchScore}% Match
                              </span>
                            </div>

                            {/* Title details */}
                            <div>
                              <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                {app.role}
                              </h3>
                              <p className="text-[11px] text-zinc-400 truncate">{app.company}</p>
                            </div>

                            {/* Aging Status & Follow-Up Reminder Alert */}
                            {(() => {
                              const aging = getAgingStatus(app);
                              if (!aging.isStale) return null;
                              return (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFollowUpModal(app);
                                  }}
                                  className={`p-2 rounded-lg border text-[10px] font-sans flex items-center justify-between gap-1.5 transition-all cursor-pointer shadow-sm ${
                                    aging.type === 'applied-stale'
                                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                                      : aging.type === 'interview-stale'
                                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-300 hover:bg-blue-500/25'
                                      : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25'
                                  }`}
                                  title="Click to generate customized follow-up email draft"
                                >
                                  <div className="flex items-center gap-1.5 truncate font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0 animate-ping"></span>
                                    <span className="truncate">{aging.label}</span>
                                  </div>
                                  <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] font-bold shrink-0 text-white flex items-center gap-1">
                                    <Mail className="w-2.5 h-2.5" />
                                    Draft
                                  </span>
                                </div>
                              );
                            })()}

                            {/* Card metadata indicators */}
                            <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-[10px] text-zinc-500">
                              <span className="flex items-center gap-1 font-sans">
                                <Calendar className="w-3 h-3" />
                                {new Date(app.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFollowUpModal(app);
                                  }}
                                  className="p-1 hover:text-indigo-300 rounded transition-colors text-zinc-500 hover:bg-white/5 cursor-pointer"
                                  title="Open Follow-Up Assistant"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => deleteApplication(app.id, e)}
                                  className="p-1 hover:text-rose-400 rounded transition-colors text-zinc-600 hover:bg-white/5 cursor-pointer"
                                  title="Delete application log"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Simple arrows to quick move status */}
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                              <button
                                disabled={app.status === 'TAILORED' || isUpdating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const idx = COLUMNS.findIndex(c => c.id === app.status);
                                  if (idx > 0) updateAppStatus(app.id, COLUMNS[idx - 1].id);
                                }}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 rounded cursor-pointer"
                                title="Move left"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>

                              <span className="text-[9px] uppercase tracking-wider text-zinc-600 font-semibold font-sans">Move Status</span>

                              <button
                                disabled={app.status === 'REJECTED' || isUpdating}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const idx = COLUMNS.findIndex(c => c.id === app.status);
                                  if (idx < COLUMNS.length - 1) updateAppStatus(app.id, COLUMNS[idx + 1].id);
                                }}
                                className="p-1 text-zinc-500 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-500 rounded cursor-pointer"
                                title="Move right"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className={`h-full min-h-[120px] border border-dashed rounded-xl flex items-center justify-center text-center text-xs p-4 transition-colors ${
                        isOver ? 'border-indigo-500/50 text-indigo-300 bg-indigo-500/5' : 'border-white/5 text-zinc-600'
                      }`}>
                        {isOver ? 'Drop to move here' : 'No jobs in this stage.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spreadsheet View */}
      {currentView === 'spreadsheet' && (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 w-full animate-in fade-in duration-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                  <th className="py-4 px-5">Role & Company</th>
                  <th className="py-4 px-5">Status Stage</th>
                  <th className="py-4 px-5">Tech Stack</th>
                  <th className="py-4 px-5">Job Details</th>
                  <th className="py-4 px-5">Recruiter</th>
                  <th className="py-4 px-5 text-center">Score</th>
                  <th className="py-4 px-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-4 px-5">
                      <div className="font-bold text-white text-sm">{app.role}</div>
                      <div className="text-zinc-400 font-sans">{app.company}</div>
                    </td>
                    <td className="py-4 px-5">
                      <select
                        value={app.status}
                        onChange={(e) => updateAppStatus(app.id, e.target.value)}
                        className="bg-zinc-950/80 border border-white/10 text-zinc-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer focus:outline-none focus:border-indigo-500/50"
                      >
                        {COLUMNS.map((col) => (
                          <option key={col.id} value={col.id} className="bg-zinc-950">
                            {col.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 px-5 max-w-[240px]">
                      <div className="flex flex-wrap gap-1">
                        {app.techStack ? (
                          app.techStack.split(',').slice(0, 3).map((t, i) => (
                            <span key={i} className="px-2 py-0.5 rounded bg-zinc-800 text-[9px] text-zinc-400 border border-zinc-700/30">
                              {t.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-600 italic">Not extracted</span>
                        )}
                        {app.techStack && app.techStack.split(',').length > 3 && (
                          <span className="text-[9px] text-zinc-500 pl-1 self-center">
                            +{app.techStack.split(',').length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-zinc-300 font-medium font-sans">
                        {app.jobType && app.jobType !== 'Not specified' ? app.jobType : 'N/A'} • {app.remoteOrPhysical && app.remoteOrPhysical !== 'Not specified' ? app.remoteOrPhysical : 'N/A'}
                      </div>
                      <div className="text-zinc-500 text-[10px]">{app.location && app.location !== 'Not specified' ? app.location : 'N/A'}</div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="text-zinc-300 font-medium font-sans">{app.recruiterName && app.recruiterName !== 'Not specified' ? app.recruiterName : 'N/A'}</div>
                      <div className="text-zinc-500 text-[10px]">{app.contactInfo && app.contactInfo !== 'Not specified' ? app.contactInfo : 'N/A'}</div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold ${app.matchScore >= 80 ? 'text-emerald-400' : app.matchScore >= 60 ? 'text-amber-400' : 'text-zinc-500'
                        }`}>
                        {app.matchScore}%
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          title="View application details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openFollowUpModal(app)}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-indigo-400 transition-colors cursor-pointer"
                          title="Follow-Up Assistant"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/tailor?appId=${app.id}`}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          title="Open in tailor workspace"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={(e) => deleteApplication(app.id, e)}
                          className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-600 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {currentView === 'calendar' && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 w-full animate-in fade-in duration-200">
          {(() => {
            const year = calendarDate.getFullYear();
            const month = calendarDate.getMonth();

            const firstDayIndex = new Date(year, month, 1).getDay();
            const totalDays = new Date(year, month + 1, 0).getDate();

            const daysArray: { dayNum: number; dateString: string; isCurrentMonth: boolean }[] = [];

            const prevMonthTotalDays = new Date(year, month, 0).getDate();
            for (let i = firstDayIndex - 1; i >= 0; i--) {
              const d = prevMonthTotalDays - i;
              const prevMonthDate = new Date(year, month - 1, d);
              daysArray.push({
                dayNum: d,
                dateString: prevMonthDate.toISOString().split('T')[0],
                isCurrentMonth: false
              });
            }

            for (let i = 1; i <= totalDays; i++) {
              const currentMonthDate = new Date(year, month, i);
              daysArray.push({
                dayNum: i,
                dateString: currentMonthDate.toISOString().split('T')[0],
                isCurrentMonth: true
              });
            }

            const remaining = 42 - daysArray.length;
            for (let i = 1; i <= remaining; i++) {
              const nextMonthDate = new Date(year, month + 1, i);
              daysArray.push({
                dayNum: i,
                dateString: nextMonthDate.toISOString().split('T')[0],
                isCurrentMonth: false
              });
            }

            const getCalendarEventsForDate = (dateString: string) => {
              const events: { app: JobApplication; type: string; color: string }[] = [];
              applications.forEach((app) => {
                const createdDate = new Date(app.createdAt).toISOString().split('T')[0];
                if (createdDate === dateString) {
                  events.push({ app, type: '🛠️ Tailored', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' });
                }

                if (app.statusHistory) {
                  app.statusHistory.forEach((hist) => {
                    const histDate = new Date(hist.createdAt).toISOString().split('T')[0];
                    if (histDate === dateString) {
                      let label = `Status: ${hist.toStatus}`;
                      let color = 'bg-zinc-800 text-zinc-300 border-zinc-700/50';
                      if (hist.toStatus === 'APPLIED') {
                        label = '📬 Applied';
                        color = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
                      } else if (hist.toStatus === 'INTERVIEWING') {
                        label = '📅 Interview';
                        color = 'bg-purple-500/15 text-purple-300 border-purple-500/30';
                      } else if (hist.toStatus === 'OFFER') {
                        label = '🎉 Offer';
                        color = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                      } else if (hist.toStatus === 'REJECTED') {
                        label = '❌ Rejected';
                        color = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                      }
                      events.push({ app, type: label, color });
                    }
                  });
                }
              });
              return events;
            };

            return (
              <>
                <div className="flex justify-between items-center mb-6 no-print">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    📅 Job Application Calendar Timeline
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider font-mono">
                      {new Date(year, month).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 bg-white/5 rounded-xl overflow-hidden text-center text-xs">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="py-2.5 bg-white/[0.02] text-zinc-400 font-bold uppercase tracking-wider text-[10px] font-sans">
                      {d}
                    </div>
                  ))}

                  {daysArray.map((day, idx) => {
                    const dayEvents = getCalendarEventsForDate(day.dateString);
                    const isToday = new Date().toISOString().split('T')[0] === day.dateString;
                    return (
                      <div
                        key={idx}
                        className={`min-h-[90px] p-2 bg-zinc-950/40 border border-white/5 text-left flex flex-col justify-between transition-all ${day.isCurrentMonth ? 'text-zinc-200' : 'text-zinc-600 opacity-40'
                          } ${isToday ? 'ring-1 ring-indigo-500 bg-indigo-500/[0.02]' : ''}`}
                      >
                        <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-400' : ''}`}>
                          {day.dayNum}
                        </span>
                        <div className="flex-1 mt-1 overflow-y-auto space-y-1 max-h-[70px] pr-0.5">
                          {dayEvents.map((evt, eIdx) => (
                            <div
                              key={eIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApp(evt.app);
                              }}
                              className={`p-1 rounded text-[9px] border leading-tight truncate font-sans hover:brightness-110 active:scale-95 transition-all cursor-pointer ${evt.color}`}
                              title={`${evt.app.role} @ ${evt.app.company} (${evt.type})`}
                            >
                              <strong>{evt.app.company}</strong>: {evt.type}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Slideout Application Detail Modal Overlay */}
      {selectedApp && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/70 backdrop-blur-sm transition-all duration-300">
          {/* Close trigger boundary */}
          <div className="hidden sm:block flex-1" onClick={() => setSelectedApp(null)}></div>

          <div className="w-full sm:max-w-xl bg-[var(--layout-surface-panel-bg)] border-l border-white/10 h-full max-h-screen overflow-y-auto p-4 sm:p-6 md:p-8 flex flex-col justify-between shadow-2xl relative">
            <div>
              {/* Header Title info */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 text-[10px] font-bold font-sans">
                      {selectedApp.targetLanguage === 'DE' ? '🇩🇪 GERMAN APPLICATION' : '🇬🇧 ENGLISH APPLICATION'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-wider">
                      {selectedApp.status}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{selectedApp.role}</h2>
                  <p className="text-sm text-zinc-400">{selectedApp.company}</p>
                </div>

                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>

              {/* Status Update Dropdown */}
              <div className="mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Update Status Stage</label>
                <div className="flex flex-wrap gap-2">
                  {COLUMNS.map(col => (
                    <button
                      key={col.id}
                      onClick={() => updateAppStatus(selectedApp.id, col.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${selectedApp.status === col.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                        }`}
                    >
                      {col.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target overrides details */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Salary Expectation
                  </span>
                  <p className="text-zinc-200 font-medium">{selectedApp.salaryExpectation || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Notice / Availability
                  </span>
                  <p className="text-zinc-200 font-medium">{selectedApp.noticePeriod || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Signing Location
                  </span>
                  <p className="text-zinc-200 font-medium">{selectedApp.signingLocation || 'Not specified'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> AI Match Score
                  </span>
                  <p className="text-emerald-400 font-bold">{selectedApp.matchScore}% Fit</p>
                </div>
              </div>

              {/* Job Metadata compact card details */}
              <div className="mb-6 bg-white/[0.02] border border-white/5 p-4 rounded-xl space-y-4 text-xs font-sans">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">Job Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                      <User className="w-3 h-3 text-indigo-400" /> Recruiter
                    </span>
                    <p className="text-zinc-200 font-medium">{selectedApp.recruiterName || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-indigo-400" /> Contact Info
                    </span>
                    <p className="text-zinc-200 font-medium">{selectedApp.contactInfo || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" /> Job Type
                    </span>
                    <p className="text-zinc-200 font-medium">{selectedApp.jobType || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                      <Building className="w-3 h-3 text-indigo-400" /> Location
                    </span>
                    <p className="text-zinc-200 font-medium">{selectedApp.location || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-indigo-400" /> Workplace Mode
                    </span>
                    <p className="text-zinc-200 font-medium">{selectedApp.remoteOrPhysical || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-400" /> Signing Location
                    </span>
                    <p className="text-zinc-200 font-medium">{selectedApp.signingLocation || 'Not specified'}</p>
                  </div>
                </div>

                {selectedApp.techStack && (
                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Required Tech Stack</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.techStack.split(',').map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-zinc-850 text-[10px] text-zinc-300 border border-zinc-700/50">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.mainRequirements && (
                  <div className="space-y-1 pt-2 border-t border-white/5">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Core Requirements</span>
                    <p className="text-zinc-300 leading-relaxed text-[11px] whitespace-pre-wrap">{selectedApp.mainRequirements}</p>
                  </div>
                )}
              </div>

              {/* Gap Analysis */}
              <div className="space-y-4 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Keyword/Skill Gap Analysis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                      <span className="text-[10px] text-emerald-400 font-bold block mb-1">Keywords Met</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedApp.gapAnalysis.matchingKeywords.map((k, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">{k}</span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                      <span className="text-[10px] text-amber-400 font-bold block mb-1">Target Skill Gaps</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedApp.gapAnalysis.missingSkills.length > 0 ? (
                          selectedApp.gapAnalysis.missingSkills.map((s, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300">{s}</span>
                          ))
                        ) : (
                          <span className="text-[9px] text-zinc-500">Perfect matching!</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedApp.gapAnalysis.recommendations && (
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs leading-relaxed">
                    <h5 className="font-bold text-indigo-300 mb-0.5">Recommendations</h5>
                    <p className="text-zinc-300">{selectedApp.gapAnalysis.recommendations}</p>
                  </div>
                )}
              </div>

              {/* Custom Focus Notes */}
              {selectedApp.customNotes && (
                <div className="mb-6 text-xs">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">Custom Notes for this Build</h4>
                  <p className="text-zinc-400 bg-white/[0.02] border border-white/5 p-3 rounded-xl italic">
                    "{selectedApp.customNotes}"
                  </p>
                </div>
              )}

              {/* Status History Timeline */}
              <div className="mb-6 text-xs">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Status Timeline Audit Trail</h4>
                <div className="relative border-l border-zinc-700/60 ml-2.5 pl-5 space-y-4 font-sans">
                  {/* Current Status Node */}
                  <div className="relative">
                    <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-400 ring-4 ring-[var(--layout-surface-panel-bg)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-950 animate-ping"></span>
                    </span>
                    <div className="flex justify-between items-baseline pl-1">
                      <span className="font-bold text-zinc-100">Current Stage: {selectedApp.status}</span>
                      <span className="text-[10px] text-zinc-500">Active</span>
                    </div>
                  </div>

                  {/* History List */}
                  {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 ? (
                    selectedApp.statusHistory.map((hist: any) => (
                      <div key={hist.id} className="relative">
                        <span className="absolute -left-[24px] top-1.5 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-zinc-600 ring-4 ring-[var(--layout-surface-panel-bg)]"></span>
                        <div className="flex justify-between items-baseline pl-1">
                          <span className="text-zinc-300">
                            Moved from <span className="font-semibold text-zinc-400">{hist.fromStatus}</span> to <span className="font-semibold text-white">{hist.toStatus}</span>
                          </span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(hist.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : null}

                  {/* Creation Node */}
                  <div className="relative">
                    <span className="absolute -left-[24px] top-1.5 flex h-1.5 w-1.5 items-center justify-center rounded-full bg-indigo-500 ring-4 ring-[var(--layout-surface-panel-bg)]"></span>
                    <div className="flex justify-between items-baseline pl-1">
                      <span className="text-zinc-300 font-semibold">Application Tracked</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(selectedApp.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Action triggers */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              <Link
                href={`/tailor?appId=${selectedApp.id}`}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-center text-xs font-bold border border-white/5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                Open in Tailoring Workspace
              </Link>
              <button
                onClick={() => openFollowUpModal(selectedApp)}
                className="py-3 px-4 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                Follow-Up Draft
              </button>
              <button
                onClick={() => setCalendarModalApp(selectedApp)}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Follow-Up Automation Modal Overlay */}
      {followUpModalApp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-left">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Automated Follow-Up Assistant
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    {followUpModalApp.role} @ {followUpModalApp.company}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFollowUpModalApp(null)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Template Type Selector */}
            <div className="space-y-1.5">
              <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">
                Select Follow-Up Objective
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleFollowUpTypeChange('status-check')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    followUpType === 'status-check'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                      : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="block text-xs font-bold">1. Status Check</span>
                  <span className="text-[10px] text-zinc-500 font-normal">7+ days post-apply</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFollowUpTypeChange('thank-you')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    followUpType === 'thank-you'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                      : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="block text-xs font-bold">2. Thank-You</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Post-interview note</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFollowUpTypeChange('offer-inquiry')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    followUpType === 'offer-inquiry'
                      ? 'border-indigo-500 bg-indigo-500/10 text-white shadow-sm'
                      : 'border-white/5 bg-white/[0.02] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="block text-xs font-bold">3. Offer Clarify</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Questions on terms</span>
                </button>
              </div>
            </div>

            {/* Recruiter Email Target & Subject */}
            <div className="space-y-3 pt-1 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Subject Line</label>
                <input
                  type="text"
                  value={followUpSubject}
                  onChange={(e) => setFollowUpSubject(e.target.value)}
                  className="bg-zinc-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Email Body (Editable Draft)</label>
                <textarea
                  value={followUpBody}
                  onChange={(e) => setFollowUpBody(e.target.value)}
                  rows={8}
                  className="bg-zinc-900 border border-white/10 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500 font-sans leading-relaxed resize-y"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`Subject: ${followUpSubject}\n\n${followUpBody}`);
                  setFollowUpCopied(true);
                  setTimeout(() => setFollowUpCopied(false), 3000);
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {followUpCopied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Copy Subject &amp; Draft</span>
                  </>
                )}
              </button>

              <a
                href={`mailto:${followUpModalApp.contactInfo && followUpModalApp.contactInfo.includes('@') ? followUpModalApp.contactInfo : ''}?subject=${encodeURIComponent(followUpSubject)}&body=${encodeURIComponent(followUpBody)}`}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center shadow-md shadow-indigo-500/20"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open in Email Client (mailto:)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Event Scheduler Modal Overlay */}
      {calendarModalApp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4 font-sans text-left">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                📅 Add application Event to Calendar
              </h3>
              <button
                onClick={() => setCalendarModalApp(null)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => handleEventTypeChange(e.target.value as any)}
                  className="bg-zinc-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="apply" className="bg-zinc-950">Apply Deadline (All Day)</option>
                  <option value="applied" className="bg-zinc-950">Applied Date & Time</option>
                  <option value="interview" className="bg-zinc-950">Interview Schedule</option>
                  <option value="offer" className="bg-zinc-950">Offer Decision Deadline (All Day)</option>
                  <option value="custom" className="bg-zinc-950">Custom Reminder</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Event Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="bg-zinc-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="bg-zinc-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  />
                </div>

                {eventType !== 'apply' && eventType !== 'offer' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Start Time</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="bg-zinc-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {eventType !== 'apply' && eventType !== 'offer' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Duration (Minutes)</label>
                  <select
                    value={eventDuration}
                    onChange={(e) => setEventDuration(e.target.value)}
                    className="bg-zinc-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="15" className="bg-zinc-950">15 minutes</option>
                    <option value="30" className="bg-zinc-950">30 minutes</option>
                    <option value="45" className="bg-zinc-950">45 minutes</option>
                    <option value="60" className="bg-zinc-950">1 hour</option>
                    <option value="90" className="bg-zinc-950">1.5 hours</option>
                    <option value="120" className="bg-zinc-950">2 hours</option>
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Location / Venue</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="bg-zinc-900 border border-white/10 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-zinc-400 font-semibold uppercase text-[9px] tracking-wider">Event Description</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={4}
                  className="bg-zinc-900 border border-white/10 text-white rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500 resize-none font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
              <a
                href={generateGoogleCalendarUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Add to Google Calendar
              </a>
              <button
                onClick={downloadIcsFile}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-center text-xs font-bold border border-white/5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Download (.ics) file
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

