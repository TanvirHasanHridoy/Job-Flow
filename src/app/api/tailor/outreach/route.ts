import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getUserTokens, deductTokens, topUpTokens, TOKEN_PRICING } from '@/lib/tokens';
import { aiResponseCache, generateCacheKey } from '@/lib/cache';
import { getAiConfig } from '@/lib/ai';

function safeParseArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeSkills(skills: any): string[] {
  if (!skills) return [];
  if (typeof skills === 'string') {
    try {
      const parsed = JSON.parse(skills);
      if (Array.isArray(parsed)) return normalizeSkills(parsed);
    } catch {
      return skills.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  if (Array.isArray(skills)) {
    return skills.map((s: any) => {
      if (typeof s === 'string') return s.trim();
      if (s && typeof s === 'object' && s.name) return String(s.name).trim();
      return String(s || '').trim();
    }).filter(Boolean);
  }
  return [];
}

function normalizeSummary(tailoredCv: any): string {
  if (typeof tailoredCv?.summary === 'string' && tailoredCv.summary.trim()) {
    return tailoredCv.summary.trim();
  }
  if (Array.isArray(tailoredCv?.summaryBullets) && tailoredCv.summaryBullets.length > 0) {
    return tailoredCv.summaryBullets.map((b: any) => String(b).trim()).filter(Boolean).join('\n');
  }
  return '';
}

function extractJson(rawText: string): any {
  let cleaned = rawText.trim();

  // 1. Try markdown code block extraction
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    // 2. Find outermost JSON braces
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // 3. Relax common JSON syntax errors
    const relaxed = cleaned
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
    return JSON.parse(relaxed);
  }
}

export async function POST(req: Request) {
  let userId: string | null = null;
  let tokensDeducted = false;

  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    userId = auth.userId;

    const {
      jobDescription,
      companyName = '',
      roleName = '',
      tailoredCv,
      targetLanguage = 'EN',
      recruiterName = '',
      customInstruction = ''
    } = await req.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Missing jobDescription parameter' }, { status: 400 });
    }

    const normalizedSkillList = normalizeSkills(tailoredCv?.skills);
    const normalizedSummaryText = normalizeSummary(tailoredCv);
    const parsedWorkExp = safeParseArray(tailoredCv?.workExperience);
    const parsedProjects = safeParseArray(tailoredCv?.projects);

    // Cache check
    const cacheKey = generateCacheKey({
      route: 'outreach',
      userId,
      companyName,
      roleName,
      targetLanguage,
      recruiterName,
      customInstruction,
      cvSummary: normalizedSummaryText,
      cvSkills: normalizedSkillList.join(',')
    });

    const cachedData = aiResponseCache.get(cacheKey);
    if (cachedData) {
      const userTokens = await getUserTokens(userId);
      return NextResponse.json({ success: true, data: cachedData, cached: true, remainingTokens: userTokens });
    }

    // Deduct tokens (5 tokens)
    const deduction = await deductTokens(userId, TOKEN_PRICING.OUTREACH);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }
    tokensDeducted = true;

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.OUTREACH);
        tokensDeducted = false;
      }
      return NextResponse.json({ error: `${aiConfig.provider} API Key is not configured` }, { status: 500 });
    }

    const isDe = targetLanguage === 'DE';
    const candidateName = tailoredCv?.personalDetails?.fullName || 'the candidate';

    const systemPrompt = `You are a world-class executive talent agent and headhunter coach.
Your job is to generate 3 highly targeted, persuasive, and authentic outreach message templates for ${candidateName} to contact recruiters and hiring managers at ${companyName || 'the target company'} for the ${roleName || 'target'} position.

TARGET LANGUAGE: Write entirely in ${isDe ? 'German' : 'English'}.
${isDe ? 'Ensure polite German business communication (Sie-Form, professional etiquette).' : 'Ensure confident, modern English business communication.'}

GENERATE 3 DISTINCT MESSAGE TYPES:
1. "linkedInInMail":
   - Target: Recruiters / Talent Acquisition Partners on LinkedIn.
   - Character count / Word count: Under 130 words. Extremely punchy, hook in first sentence, highlight 2 core matching skills/metrics from the CV, and end with a low-friction question (e.g., "Open to a brief 5-minute chat this week?").
   - Include a short tip explaining why this hook works.

2. "hiringManagerEmail":
   - Target: Engineering Director / Department Head / Hiring Manager.
   - Structure: Compelling subject line + 2 impactful paragraphs + value proposition tailored to what the company needs + call to action.
   - Include a short tip for maximum open rates.

3. "warmReferralCoffeeChat":
   - Target: Peer engineers, alumni, or potential teammates at the company.
   - Tone: Friendly, collegial, low-pressure request for an informational coffee chat / 10-minute insight into team culture.
   - Include a short tip.

STRICT CONSTRAINTS:
1. Ground all achievements strictly in the candidate's provided CV facts.
2. Custom instruction from candidate: "${(customInstruction || 'Tailor specifically for high conversion and genuine interest.').replace(/"/g, "'")}"
3. Output strictly valid JSON matching this schema:
{
  "outreach": {
    "linkedInInMail": {
      "subject": "<string>",
      "message": "<string>",
      "tips": "<string>"
    },
    "hiringManagerEmail": {
      "subject": "<string>",
      "message": "<string>",
      "tips": "<string>"
    },
    "warmReferralCoffeeChat": {
      "subject": "<string>",
      "message": "<string>",
      "tips": "<string>"
    }
  }
}`;

    const payload = {
      model: aiConfig.model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Target Company: ${companyName}
Target Role: ${roleName}
Recruiter / Contact Name: ${recruiterName || 'Hiring Team'}

Target Job Description:
${jobDescription}

Candidate Tailored CV Facts:
${JSON.stringify({
            personalDetails: tailoredCv?.personalDetails,
            summary: normalizedSummaryText,
            skills: normalizedSkillList,
            recentExperience: parsedWorkExp.slice(0, 2),
            projects: parsedProjects.slice(0, 2)
          }, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 3072,
      temperature: 0.3
    };

    // Resilient fetch with exponential retry backoff for rate limits / transient server errors
    let lastError: Error | null = null;
    let apiRes: Response | null = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = attempt === 1 ? 1200 : 2500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        apiRes = await fetch(aiConfig.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiKey}`
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(60000)
        });

        if (apiRes.ok) {
          lastError = null;
          break;
        }

        const isRetryable = apiRes.status === 429 || apiRes.status === 500 || apiRes.status === 502 || apiRes.status === 503 || apiRes.status === 504;
        if (!isRetryable) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        if (attempt === maxRetries) break;
      }
    }

    if (!apiRes || !apiRes.ok) {
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.OUTREACH);
        tokensDeducted = false;
      }

      let errMsg = lastError?.message || 'Failed to communicate with AI model';
      let errStatus = apiRes ? apiRes.status : 502;

      if (apiRes) {
        try {
          const errText = await apiRes.text();
          console.error('Outreach API Error:', errText);
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errJson.message || errMsg;
        } catch { }
      }

      return NextResponse.json({ error: errMsg }, { status: errStatus });
    }

    const resJson = await apiRes.json();
    const rawContent = resJson.choices?.[0]?.message?.content;
    if (!rawContent) {
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.OUTREACH);
        tokensDeducted = false;
      }
      return NextResponse.json({ error: 'AI returned an empty response. Please try again.' }, { status: 502 });
    }

    let parsedData: any;
    try {
      parsedData = extractJson(rawContent);
    } catch (parseErr) {
      console.error('Failed to parse outreach AI output:', rawContent);
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.OUTREACH);
        tokensDeducted = false;
      }
      return NextResponse.json({ error: 'AI produced invalid JSON output. Please retry.' }, { status: 500 });
    }

    // Normalize response shape so frontend always gets data.outreach
    const rawOutreach = parsedData?.outreach || (parsedData?.linkedInInMail ? parsedData : parsedData?.data?.outreach);
    if (!rawOutreach || typeof rawOutreach !== 'object') {
      if (tokensDeducted && userId) {
        await topUpTokens(userId, TOKEN_PRICING.OUTREACH);
        tokensDeducted = false;
      }
      return NextResponse.json({ error: 'AI response missing outreach sections. Please retry.' }, { status: 500 });
    }

    const normalizedOutreach = {
      linkedInInMail: rawOutreach.linkedInInMail || { subject: '', message: '', tips: '' },
      hiringManagerEmail: rawOutreach.hiringManagerEmail || { subject: '', message: '', tips: '' },
      warmReferralCoffeeChat: rawOutreach.warmReferralCoffeeChat || { subject: '', message: '', tips: '' }
    };

    const finalResponseData = { outreach: normalizedOutreach };
    aiResponseCache.set(cacheKey, finalResponseData);

    return NextResponse.json({
      success: true,
      data: finalResponseData,
      remainingTokens: deduction.tokens
    });
  } catch (error: any) {
    console.error('Error in outreach route:', error);
    if (tokensDeducted && userId) {
      try {
        await topUpTokens(userId, TOKEN_PRICING.OUTREACH);
      } catch { }
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
