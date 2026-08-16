import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { getUserTokens, deductTokens, TOKEN_PRICING } from '@/lib/tokens';
import { aiResponseCache, generateCacheKey } from '@/lib/cache';
import { getAiConfig } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

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

    // Cache check
    const cacheKey = generateCacheKey({
      route: 'outreach',
      userId,
      companyName,
      roleName,
      targetLanguage,
      recruiterName,
      customInstruction,
      cvSummary: tailoredCv?.summary || '',
      cvSkills: (tailoredCv?.skills || []).map((s: any) => s.name || s).join(',')
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

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
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
2. Custom instruction from candidate: "${customInstruction || 'Tailor specifically for high conversion and genuine interest.'}"
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
  summary: tailoredCv?.summary,
  skills: tailoredCv?.skills,
  recentExperience: (tailoredCv?.workExperience || []).slice(0, 2),
  projects: (tailoredCv?.projects || []).slice(0, 2)
}, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    };

    const apiRes = await fetch(aiConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Outreach API Error:', errText);
      let errMsg = 'Failed to communicate with AI model';
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errJson.message || errMsg;
      } catch { }
      return NextResponse.json({ error: errMsg }, { status: apiRes.status });
    }

    const resJson = await apiRes.json();
    let contentStr = resJson.choices[0].message.content.trim();
    contentStr = contentStr.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    try {
      const parsedData = JSON.parse(contentStr);
      aiResponseCache.set(cacheKey, parsedData);
      return NextResponse.json({ success: true, data: parsedData, remainingTokens: deduction.tokens });
    } catch (parseErr) {
      console.error('Failed to parse outreach AI output:', contentStr);
      return NextResponse.json({ error: 'AI produced invalid JSON output' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in outreach route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
