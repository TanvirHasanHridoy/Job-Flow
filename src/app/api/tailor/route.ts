import { NextResponse } from 'next/server';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  try {
    const {
      jobDescription,
      targetLanguage,
      salaryExpectation,
      noticePeriod,
      signingLocation,
      customNotes,
      profile
    } = await req.json();

    if (!jobDescription || !targetLanguage || !profile) {
      return NextResponse.json({ error: 'Missing required inputs: jobDescription, targetLanguage, or profile' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'DeepSeek API Key is not configured in environment variables' }, { status: 500 });
    }

    // Parse profile details
    const parsedWorkExp = typeof profile.workExperience === 'string' ? JSON.parse(profile.workExperience) : profile.workExperience;
    const parsedEdu = typeof profile.education === 'string' ? JSON.parse(profile.education) : profile.education;
    const parsedSkills = typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills;
    const parsedLanguages = typeof profile.languages === 'string' ? JSON.parse(profile.languages) : profile.languages;

    const formattedProfile = {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      website: profile.website || '',
      github: profile.github || '',
      linkedin: profile.linkedin || '',
      address: profile.address || '',
      dateOfBirth: profile.dateOfBirth || '',
      birthplace: profile.birthplace || '',
      nationality: profile.nationality || '',
      workExperience: parsedWorkExp,
      education: parsedEdu,
      skills: parsedSkills,
      languages: parsedLanguages
    };

    // Construct custom prompt context
    const contextAdditions = [];
    if (salaryExpectation) contextAdditions.push(`Salary Expectations: ${salaryExpectation}`);
    if (noticePeriod) contextAdditions.push(`Notice Period / Availability: ${noticePeriod}`);
    if (signingLocation) contextAdditions.push(`Signing Location / City: ${signingLocation}`);
    if (customNotes) contextAdditions.push(`Custom Focus Notes: ${customNotes}`);
    const contextStr = contextAdditions.length > 0 ? contextAdditions.join('\n') : 'None provided';

    // System prompt selection
    let systemPrompt = '';
    
    if (targetLanguage === 'DE') {
      systemPrompt = `You are an elite DACH-region recruitment expert and ATS optimization engine. Your goal is to write a flawless, professional German Lebenslauf (Resume) and Anschreiben (Cover Letter) based on the user's profile and the target job description.

CRITICAL CONSTRAINTS:
1. ABSOLUTE TRUTHFULNESS: Rely ONLY on facts, dates, positions, and skills present in the User Profile or current Custom Notes. Do NOT invent work history, company names, credentials, or certifications.
2. TONE & STYLE: Write in flawless, formal German business tone ("Sie" form).
3. GERMAN LEBENSLAUF RULES:
   - Must support a clean tabular format.
   - Include date of birth, birthplace, and nationality if provided in the profile.
   - Conclude with a signing line showing the city and current date (e.g. "Berlin, [Datum]").
4. GERMAN ANSCHREIBEN (COVER LETTER) RULES:
   - Must strictly align with DIN 5008 business letter formatting.
   - Sender address should be the user's address.
   - Recipient address must be extracted or logically placeholder-indicated from the job description (e.g., Company name, address if available, or "Hiring Team / Personalabteilung").
   - Include a right-aligned date line: "[Signing Location], [Current Date]".
   - A bold subject line starting with "Bewerbung als [Role Name]".
   - Formal salutation ("Sehr geehrte Damen und Herren," or "Sehr geehrte(r) Frau/Herr [Name],").
   - High-quality, tailored paragraphs discussing matching accomplishments factually, concluding with availability/notice period and salary expectations if provided.
   - Formal closing ("Mit freundlichen Grüßen") followed by signature name.

You must respond with a raw JSON object containing these exact keys:
{
  "matchScore": <number between 0 and 100>,
  "gapAnalysis": {
    "missingSkills": [<array of strings of skills mentioned in JD but missing in profile>],
    "matchingKeywords": [<array of strings of key skills/keywords that align between profile and JD>],
    "recommendations": "<short text giving advice on how to improve fit or what to highlight>"
  },
  "tailoredCv": {
    "personalDetails": {
      "fullName": "<string>",
      "email": "<string>",
      "phone": "<string>",
      "website": "<string>",
      "linkedin": "<string>",
      "github": "<string>",
      "address": "<string>",
      "dateOfBirth": "<string, or empty if not provided>",
      "birthplace": "<string, or empty if not provided>",
      "nationality": "<string, or empty if not provided>"
    },
    "summary": "<short professional summary tailored to the job, in German>",
    "workExperience": [
      {
        "company": "<string>",
        "role": "<string>",
        "location": "<string>",
        "period": "<string, e.g. 01/2022 - Heute>",
        "bullets": [<array of tailored achievement strings in German, active and impact-focused, but 100% factual>]
      }
    ],
    "education": [
      {
        "institution": "<string>",
        "degree": "<string>",
        "location": "<string>",
        "period": "<string>"
      }
    ],
    "skills": [<array of matching tech/methodology skills present in the profile, in German/English terminology>],
    "languages": [
      { "language": "<string>", "level": "<string, e.g. Muttersprache, C1>" }
    ],
    "signingLine": "<string, e.g. 'Berlin, 17. Juni 2026'>"
  },
  "tailoredCoverLetter": {
    "senderAddress": "<string, formatted with newlines>",
    "recipientAddress": "<string, formatted with newlines>",
    "dateLine": "<string, right-aligned date block content>",
    "subjectLine": "<string, e.g., 'Bewerbung als Senior Fullstack Entwickler'>",
    "salutation": "<string, e.g., 'Sehr geehrte Damen und Herren,'>",
    "paragraphs": [<array of paragraphs in German, detailing fit, notice period, salary expectations if provided, etc.>],
    "closing": "<string, e.g., 'Mit freundlichen Grüßen,'>",
    "signatureName": "<string>"
  }
}`;
    } else {
      systemPrompt = `You are an elite international recruitment expert and ATS optimization engine. Your goal is to write a flawless, high-impact English Resume (CV) and Cover Letter optimized for US/UK/International standards.

CRITICAL CONSTRAINTS:
1. ABSOLUTE TRUTHFULNESS: Rely ONLY on facts, dates, positions, and skills present in the User Profile or current Custom Notes. Do NOT invent work history, company names, credentials, or certifications.
2. DEMOGRAPHIC PRIVACY (ANTI-DISCRIMINATION COMPLIANCE):
   - Strictly OMIT date of birth, birthplace, age, gender, nationality, or marital status from the resume and cover letter. They must be empty or null.
3. TONE & STYLE: Use active, result-oriented, professional English. Focus on quantitative achievements, strong action verbs, and clear structural headings.
4. ENGLISH RESUME RULES:
   - Clean top-down structure (standard single- or double-column layouts).
   - Dynamic summary and action-driven bullet points for work experience.
5. ENGLISH COVER LETTER RULES:
   - Professional English business letter format.
   - Sender contact info at the top.
   - Recipient block (Company, name if available, or "Hiring Manager / Recipient").
   - Formal, polite opening ("Dear Hiring Manager," or "Dear Mr./Ms. [Name],").
   - 3-4 structured body paragraphs highlighting matching achievements, availability/notice period, and salary expectations if provided.
   - Polite closing ("Sincerely," or "Best regards,") and signature name.

You must respond with a raw JSON object containing these exact keys:
{
  "matchScore": <number between 0 and 100>,
  "gapAnalysis": {
    "missingSkills": [<array of strings of skills mentioned in JD but missing in profile>],
    "matchingKeywords": [<array of strings of key skills/keywords that align between profile and JD>],
    "recommendations": "<short text giving advice on how to improve fit or what to highlight>"
  },
  "tailoredCv": {
    "personalDetails": {
      "fullName": "<string>",
      "email": "<string>",
      "phone": "<string>",
      "website": "<string>",
      "linkedin": "<string>",
      "github": "<string>",
      "address": "<string>",
      "dateOfBirth": "",
      "birthplace": "",
      "nationality": ""
    },
    "summary": "<short professional summary tailored to the job, in English>",
    "workExperience": [
      {
        "company": "<string>",
        "role": "<string>",
        "location": "<string>",
        "period": "<string, e.g. Jan 2022 - Present>",
        "bullets": [<array of tailored achievement strings in English, starting with active verbs, 100% factual>]
      }
    ],
    "education": [
      {
        "institution": "<string>",
        "degree": "<string>",
        "location": "<string>",
        "period": "<string>"
      }
    ],
    "skills": [<array of matching tech/methodology skills present in the profile>],
    "languages": [
      { "language": "<string>", "level": "<string, e.g. Native, Fluent, C1>" }
    ],
    "signingLine": ""
  },
  "tailoredCoverLetter": {
    "senderAddress": "<string, formatted with newlines>",
    "recipientAddress": "<string, formatted with newlines>",
    "dateLine": "<string, date block content>",
    "subjectLine": "<string, e.g., 'Application for Senior Full-Stack Engineer'>",
    "salutation": "<string, e.g., 'Dear Hiring Manager,'>",
    "paragraphs": [<array of paragraphs in English, detailing fit, notice period, salary expectations if provided, etc.>],
    "closing": "<string, e.g., 'Sincerely,'>",
    "signatureName": "<string>"
  }
}`;
    }

    const payload = {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Here is the user profile:
${JSON.stringify(formattedProfile, null, 2)}

Here is the Target Job Description:
${jobDescription}

Here is the additional context / overrides:
${contextStr}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    };

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error response:', errorText);
      return NextResponse.json({ error: `DeepSeek API returned status ${response.status}: ${errorText}` }, { status: 502 });
    }

    const resJson = await response.json();
    const generatedText = resJson.choices[0].message.content;
    const tailoredResult = JSON.parse(generatedText);

    return NextResponse.json(tailoredResult);
  } catch (error: any) {
    console.error('Tailoring API Error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during tailoring' }, { status: 500 });
  }
}
