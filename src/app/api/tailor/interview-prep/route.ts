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
      customInstruction = ''
    } = await req.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Missing jobDescription parameter' }, { status: 400 });
    }

    // Cache check
    const cacheKey = generateCacheKey({
      route: 'interview-prep',
      userId,
      companyName,
      roleName,
      targetLanguage,
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
    const deduction = await deductTokens(userId, TOKEN_PRICING.INTERVIEW_PREP);
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

    const systemPrompt = `You are a Principal Engineering Leader and Executive Interview Coach.
Your goal is to build an elite Interview Cheat-Sheet & Strategy Guide for ${candidateName} interviewing for the ${roleName || 'target'} role at ${companyName || 'the target company'}.

TARGET LANGUAGE: Write entirely in ${isDe ? 'German' : 'English'}.

CRITICAL REQUIREMENTS & OUTPUT SECTIONS:
1. "elevatorPitch":
   - A high-impact 30-45 second answer to "Tell me about yourself / Stellen Sie sich kurz vor".
   - 3 punchy sentences: Current identity + Key career superpower/metric + Why this specific company & role.

2. "predictedQuestions":
   - Array of 5 highly likely technical and behavioral questions tailored specifically to this job description and the candidate's background.
   - For each question:
     - "question": The exact question the interviewer will ask.
     - "category": "Technical Deep Dive", "System Architecture", "Leadership & Impact", or "Behavioral / STAR".
     - "intent": What the interviewer is secretly testing.
     - "suggestedAnswerTalkingPoints": Array of 3-4 bullet points referencing the candidate's REAL background (Situation -> Task -> Action -> Result).

3. "reverseQuestions":
   - Array of 3 high-signal reverse questions for the candidate to ask the hiring manager/interviewer at the end of the interview.
   - Questions that demonstrate senior domain insight, product thinking, and cultural curiosity.

4. "redFlagTraps":
   - Array of 2-3 specific technical/behavioral traps for this role/tech stack and how the candidate should gracefully handle them.

STRICT CONSTRAINTS:
1. Rely strictly on real background facts from the provided CV.
2. Custom candidate instruction: "${customInstruction || 'Provide actionable, concrete talking points.'}"
3. Output strictly valid JSON matching this schema:
{
  "interviewPrep": {
    "elevatorPitch": "<string>",
    "predictedQuestions": [
      {
        "question": "<string>",
        "category": "<string>",
        "intent": "<string>",
        "suggestedAnswerTalkingPoints": ["<string>", "<string>", "<string>"]
      }
    ],
    "reverseQuestions": [
      {
        "question": "<string>",
        "context": "<string>"
      }
    ],
    "redFlagTraps": [
      {
        "trap": "<string>",
        "recommendation": "<string>"
      }
    ]
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

Target Job Description:
${jobDescription}

Candidate Tailored CV Facts:
${JSON.stringify({
  personalDetails: tailoredCv?.personalDetails,
  summary: tailoredCv?.summary,
  skills: tailoredCv?.skills,
  workExperience: (tailoredCv?.workExperience || []).slice(0, 3),
  projects: (tailoredCv?.projects || []).slice(0, 3)
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
      console.error('Interview Prep API Error:', errText);
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
      console.error('Failed to parse interview prep AI output:', contentStr);
      return NextResponse.json({ error: 'AI produced invalid JSON output' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in interview-prep route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
