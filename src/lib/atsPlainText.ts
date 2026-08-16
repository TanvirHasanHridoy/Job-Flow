export function generateAtsPlainText(tailoredCv: any, targetLanguage: 'EN' | 'DE' = 'EN'): string {
  if (!tailoredCv) return '';

  const {
    personalDetails = {},
    summary = '',
    workExperience = [],
    education = [],
    skills = [],
    languages = [],
    projects = [],
    customSections = []
  } = tailoredCv;

  const isDe = targetLanguage === 'DE';
  const lines: string[] = [];

  // Name & Occupation
  if (personalDetails.fullName) {
    lines.push(personalDetails.fullName.toUpperCase());
  }
  if (personalDetails.occupation) {
    lines.push(personalDetails.occupation);
  }

  // Contact Info
  const contacts: string[] = [];
  if (personalDetails.email) contacts.push(personalDetails.email);
  if (personalDetails.phone) contacts.push(personalDetails.phone);
  if (personalDetails.address) contacts.push(personalDetails.address);
  if (personalDetails.linkedin) contacts.push(personalDetails.linkedin);
  if (personalDetails.github) contacts.push(personalDetails.github);
  if (personalDetails.website) contacts.push(personalDetails.website);
  if (contacts.length > 0) {
    lines.push(contacts.join(' | '));
  }

  lines.push('\n' + '='.repeat(40) + '\n');

  // Professional Summary
  if (summary) {
    lines.push(isDe ? 'BERUFLICHER WERDEGANG / ZUSAMMENFASSUNG' : 'PROFESSIONAL SUMMARY');
    lines.push('-'.repeat(30));
    lines.push(summary.trim());
    lines.push('');
  }

  // Work Experience
  if (workExperience && workExperience.length > 0) {
    lines.push(isDe ? 'BERUFSERFAHRUNG' : 'WORK EXPERIENCE');
    lines.push('-'.repeat(30));
    workExperience.forEach((exp: any) => {
      lines.push(`${exp.role || ''} | ${exp.company || ''} (${exp.period || ''}${exp.location ? ` - ${exp.location}` : ''})`);

      let bulletsList: string[] = [];
      if (Array.isArray(exp.bullets)) {
        bulletsList = exp.bullets;
      } else if (exp.bullets && typeof exp.bullets === 'object') {
        bulletsList = exp.bullets.standard || exp.bullets.punchy || exp.bullets.star || [];
      }

      bulletsList.forEach((b: string) => {
        lines.push(`  * ${b}`);
      });
      lines.push('');
    });
  }

  // Projects
  if (projects && projects.length > 0) {
    lines.push(isDe ? 'PROJEKTE' : 'PROJECTS');
    lines.push('-'.repeat(30));
    projects.forEach((proj: any) => {
      const techs = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies || '';
      lines.push(`${proj.name || ''}${techs ? ` [${techs}]` : ''}${proj.url ? ` (${proj.url})` : ''}`);
      if (proj.description) {
        lines.push(`  * ${proj.description}`);
      }
      lines.push('');
    });
  }

  // Skills
  if (skills && skills.length > 0) {
    lines.push(isDe ? 'FÄHIGKEITEN & KENNTNISSE' : 'TECHNICAL SKILLS');
    lines.push('-'.repeat(30));
    const categories: Record<string, string[]> = {};
    skills.forEach((s: any) => {
      const cat = s.category || (isDe ? 'Technologien' : 'Core Skills');
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(s.name || s);
    });

    Object.entries(categories).forEach(([cat, list]) => {
      lines.push(`${cat}: ${list.join(', ')}`);
    });
    lines.push('');
  }

  // Education
  if (education && education.length > 0) {
    lines.push(isDe ? 'AUSBILDUNG' : 'EDUCATION');
    lines.push('-'.repeat(30));
    education.forEach((edu: any) => {
      lines.push(`${edu.degree || ''} | ${edu.institution || ''} (${edu.period || ''}${edu.location ? ` - ${edu.location}` : ''})`);
    });
    lines.push('');
  }

  // Languages
  if (languages && languages.length > 0) {
    lines.push(isDe ? 'SPRACHEN' : 'LANGUAGES');
    lines.push('-'.repeat(30));
    lines.push(languages.map((l: any) => `${l.language} (${l.level})`).join(', '));
    lines.push('');
  }

  // Custom Sections
  if (customSections && customSections.length > 0) {
    customSections.forEach((sec: any) => {
      lines.push((sec.title || 'ADDITIONAL SECTION').toUpperCase());
      lines.push('-'.repeat(30));
      if (sec.type === 'paragraph' && sec.content) {
        lines.push(sec.content);
      } else if (sec.type === 'bullet-list' && Array.isArray(sec.bullets)) {
        sec.bullets.forEach((b: string) => lines.push(`  * ${b}`));
      } else if ((sec.type === 'subgroup-chips' || sec.type === 'subgroup-items') && Array.isArray(sec.subgroups)) {
        sec.subgroups.forEach((sub: any) => {
          lines.push(`${sub.name}: ${(sub.items || []).join(', ')}`);
        });
      }
      lines.push('');
    });
  }

  return lines.join('\n');
}
