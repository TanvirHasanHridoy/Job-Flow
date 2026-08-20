export const SKILL_CATEGORIES = ['Frontend', 'Backend', 'Database', 'Tools'] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

export const classifySkillCategory = (name: string): SkillCategory => {
  const n = name.toLowerCase();
  
  // Frontend keywords
  if (
    /react|html|css|javascript|js|ts|typescript|vue|angular|tailwind|bootstrap|next\.js|nextjs|nuxt|svelte|frontend|web|ui|ux|sass|less|webpack|vite|flutter|react native|css3|html5|jquery|redux|graphql|seo/i.test(n)
  ) {
    return 'Frontend';
  }
  
  // Backend keywords
  if (
    /node|express|dotnet|\.net|asp\.net|c#|java|spring|springboot|python|django|flask|fastapi|go|golang|php|laravel|ruby|rails|backend|rust|c\+\+|api|rest|microservices|server|aws|gcp|azure|docker|kubernetes|devops|serverless|lambda|cloud/i.test(n)
  ) {
    return 'Backend';
  }
  
  // Database keywords
  if (
    /sql|postgres|mysql|sqlite|mongodb|mongo|redis|database|db|cassandra|oracle|firebase|firestore|prisma|mongoose|dynamodb|mariadb|nosql/i.test(n)
  ) {
    return 'Database';
  }
  
  // Default to Tools
  return 'Tools';
};

export const groupSkillsByCategory = (skills: any[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {};

  if (!Array.isArray(skills)) return groups;

  const addSkill = (name: string, rawCategory?: string) => {
    if (!name || typeof name !== 'string') return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    let targetCategory = (rawCategory || '').trim();
    if (!targetCategory) {
      targetCategory = classifySkillCategory(trimmedName);
    } else {
      // Normalize common synonyms to standard Title Case if they match
      const c = targetCategory.toLowerCase();
      if (c === 'frontend' || c === 'front-end') targetCategory = 'Frontend';
      else if (c === 'backend' || c === 'back-end') targetCategory = 'Backend';
      else if (c === 'database' || c === 'databases' || c === 'db') targetCategory = 'Database';
      else if (c === 'tools' || c === 'tool' || c === 'tools & cloud' || c === 'tools and cloud') targetCategory = 'Tools & Cloud';
    }

    if (!groups[targetCategory]) {
      groups[targetCategory] = [];
    }
    if (!groups[targetCategory].includes(trimmedName)) {
      groups[targetCategory].push(trimmedName);
    }
  };

  skills.forEach(s => {
    if (typeof s === 'string') {
      addSkill(s);
    } else if (s && typeof s === 'object') {
      if (Array.isArray(s.skills)) {
        s.skills.forEach((sub: any) => {
          const subName = typeof sub === 'string' ? sub : sub?.name || '';
          addSkill(subName, s.category);
        });
      } else if (s.name) {
        addSkill(s.name, s.category);
      }
    }
  });

  return groups;
};
