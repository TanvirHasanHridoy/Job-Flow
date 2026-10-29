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

async function getAuthHeaders(baseUrl: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Accept': 'application/json'
  };

  if (typeof chrome !== 'undefined' && chrome.cookies?.getAll) {
    try {
      const cookies = await chrome.cookies.getAll({ url: baseUrl });
      if (cookies && cookies.length > 0) {
        // Forward cookies explicitly to bypass browser SameSite=Lax cross-origin blocking
        headers['x-session-cookie'] = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        
        const devCookie = cookies.find(c => c.name === 'jobmaster_dev_auth');
        if (devCookie) {
          headers['x-dev-auth'] = devCookie.value;
        }

        const sbCookie = cookies.find(c => c.name.includes('-auth-token'));
        if (sbCookie) {
          headers['x-supabase-auth'] = sbCookie.value;
        }
      }
    } catch (e) {
      console.warn('[JobFlow API] Could not read cookies:', e);
    }
  }

  return headers;
}

export async function checkSession(baseUrl: string): Promise<SessionInfo> {
  try {
    const authHeaders = await getAuthHeaders(baseUrl);
    const res = await fetch(`${baseUrl}/api/auth/session`, {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders
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
    const authHeaders = await getAuthHeaders(baseUrl);
    const res = await fetch(`${baseUrl}/api/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders
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
    const authHeaders = await getAuthHeaders(baseUrl);
    const res = await fetch(`${baseUrl}/api/tokens`, {
      method: 'GET',
      credentials: 'include',
      headers: authHeaders
    });

    if (!res.ok) return 0;
    const data = await res.json();
    return data.tokens ?? 0;
  } catch {
    return 0;
  }
}

export async function submitTailor(baseUrl: string, payload: TailorRequestPayload): Promise<TailorResponseData> {
  const authHeaders = await getAuthHeaders(baseUrl);
  const res = await fetch(`${baseUrl}/api/tailor`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
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
  const authHeaders = await getAuthHeaders(baseUrl);
  const res = await fetch(`${baseUrl}/api/applications`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(appData)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save tailored application');
  }

  return await res.json();
}
