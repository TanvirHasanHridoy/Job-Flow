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

export const groupSkillsByCategory = (skills: any[]) => {
  const groups: Record<SkillCategory, string[]> = {
    Frontend: [],
    Backend: [],
    Database: [],
    Tools: []
  };

  if (!Array.isArray(skills)) return groups;

  skills.forEach(s => {
    let name = '';
    let category = '';
    if (typeof s === 'string') {
      name = s;
    } else if (s && typeof s === 'object') {
      name = s.name || '';
      category = s.category || '';
    }

    if (name) {
      // Normalize or classify category
      let matchedCat: SkillCategory = 'Tools';
      
      const c = category.toLowerCase().trim();
      if (c === 'frontend') matchedCat = 'Frontend';
      else if (c === 'backend') matchedCat = 'Backend';
      else if (c === 'database' || c === 'db') matchedCat = 'Database';
      else if (c === 'tools' || c === 'tool') matchedCat = 'Tools';
      else {
        // Fallback to local name-based classifier
        matchedCat = classifySkillCategory(name);
      }

      if (groups[matchedCat]) {
        groups[matchedCat].push(name);
      } else {
        groups['Tools'].push(name);
      }
    }
  });

  return groups;
};
