export interface SessionInfo {
  authenticated: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
  personas?: Array<{ id: string; name: string; isDefault?: boolean }>;
  tokens?: number;
  error?: string;
}

export interface TailorRequestPayload {
  jobDescription: string;
  cvLanguage: 'EN' | 'DE';
  clLanguage: 'EN' | 'DE';
  cvFormat: 'bullet-matrix' | 'visual' | 'ats';
  tone: string;
  lengthTarget: string;
  bulletStyle: string;
  clLength: string;
  skillsFocus: string;
  salaryExpectation?: string;
  noticePeriod?: string;
  signingLocation?: string;
  customNotes?: string;
  themeDirective?: string;
  profile?: any;
  matchStrategy: 'TACTICAL_PIVOT' | 'AGGRESIVE_BRIDGING';
  applicationId?: string | null;
  roleName: string;
  companyName: string;
  selectedProjects?: string[];
  isNudgeEnabled?: boolean;
}

export interface TailorResponseData {
  matchScore: number;
  gapAnalysis: {
    missingSkills: string[];
    matchingKeywords: string[];
    recommendations: string;
    exactMatches?: string[];
    adjacentMatches?: string[];
  };
  tailoredCv: any;
  tailoredCoverLetter: any;
  applicationId?: string;
  jobMetadata?: any;
}

export async function checkSession(baseUrl: string): Promise<SessionInfo> {
  try {
    const res = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      return { authenticated: false };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('[JobFlow API] checkSession failed:', err);
    return { authenticated: false, error: err.message };
  }
}

export async function fetchProfile(baseUrl: string): Promise<any> {
  try {
    const res = await fetch(`${baseUrl}/api/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[JobFlow API] fetchProfile error:', err);
    return null;
  }
}

export async function fetchTokens(baseUrl: string): Promise<number> {
  try {
    const res = await fetch(`${baseUrl}/api/tokens`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) return 0;
    const data = await res.json();
    return data.tokens ?? 0;
  } catch {
    return 0;
  }
}

export async function submitTailor(baseUrl: string, payload: TailorRequestPayload): Promise<TailorResponseData> {
  const res = await fetch(`${baseUrl}/api/tailor`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (res.status === 403) {
    throw new Error('Insufficient tokens to tailor this application. Please top up your JobFlow account.');
  }

  if (res.status === 401) {
    throw new Error('Your session has expired. Please log in to JobFlow AI again.');
  }

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `Tailoring failed with status ${res.status}`);
  }

  return await res.json();
}

export async function createApplication(baseUrl: string, appData: any): Promise<any> {
  const res = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(appData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save tailored application');
  }

  return await res.json();
}
