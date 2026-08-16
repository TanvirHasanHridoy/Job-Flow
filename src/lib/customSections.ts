export type CustomSectionType = 'bullet-list' | 'paragraph' | 'subgroup-chips' | 'subgroup-items' | 'structured-items';

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  dateOrLocation?: string;
  bullets?: string[];
  description?: string;
}

export interface CustomSectionSubgroup {
  id: string;
  name: string;
  items: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  type: CustomSectionType;
  // For 'bullet-list'
  bullets?: string[];
  // For 'paragraph'
  content?: string;
  // For 'subgroup-chips' and 'subgroup-items'
  subgroups?: CustomSectionSubgroup[];
  // For 'structured-items'
  items?: CustomSectionItem[];
  // Spacing overrides
  marginTop?: number;
  marginBottom?: number;
}

export const formatCityCountry = (address?: string): string => {
  if (!address) return '';
  const trimmed = address.trim();
  if (!trimmed) return '';
  
  const parts = trimmed.split(/[,\n]+/).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length <= 2) return parts.join(', ');
  
  // Extract last two parts (e.g., City, Country)
  const country = parts[parts.length - 1];
  let cityPart = parts[parts.length - 2];
  // Strip postal codes e.g. "10115 Berlin" -> "Berlin"
  cityPart = cityPart.replace(/^\d{3,8}\s+/, '').trim();
  
  return `${cityPart}, ${country}`;
};

export const createDefaultCustomSection = (type: CustomSectionType, title: string = 'New Custom Section'): CustomSection => {
  const id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
  switch (type) {
    case 'bullet-list':
      return {
        id,
        title: title === 'New Custom Section' ? 'Key Highlights' : title,
        type,
        bullets: ['Key achievement, publication, or bullet description']
      };
    case 'paragraph':
      return {
        id,
        title: title === 'New Custom Section' ? 'Executive Statement' : title,
        type,
        content: 'Add descriptive text, executive overview, or research background here...'
      };
    case 'subgroup-chips':
    case 'subgroup-items':
      return {
        id,
        title: title === 'New Custom Section' ? 'Certifications & Credentials' : title,
        type: 'subgroup-items',
        subgroups: [
          { id: 'sub-1', name: 'DevOps & Cloud', items: ['AWS Certified DevOps Engineer – Professional', 'Certified Kubernetes Administrator (CKA)'] },
          { id: 'sub-2', name: 'Frontend & Architecture', items: ['Meta Certified Front-End Developer', 'Full Stack Open Deep Dive'] }
        ]
      };
    case 'structured-items':
      return {
        id,
        title: title === 'New Custom Section' ? 'Honors & Awards' : title,
        type,
        items: [
          {
            id: 'item-1',
            title: 'Award / Honor Title',
            subtitle: 'Conferring Organization / University',
            dateOrLocation: '2024 - Present',
            bullets: ['Key contribution, outcome, or recognition criteria']
          }
        ]
      };
  }
};
