import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { deductTokens, TOKEN_PRICING } from '@/lib/tokens';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    // Deduct tokens
    const deduction = await deductTokens(userId, TOKEN_PRICING.IMPORT_PROFILE);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }

    const { githubUsername, linkedinText } = await req.json();

    if (!githubUsername && !linkedinText) {
      return NextResponse.json(
        { error: 'Please provide either a GitHub username or pasted LinkedIn text.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API Key is not configured in environment variables.' },
        { status: 500 }
      );
    }

    let githubData: any = null;

    // 1. Fetch GitHub data if username provided
    if (githubUsername) {
      try {
        const userRes = await fetch(`https://api.github.com/users/${githubUsername}`, {
          headers: { 'User-Agent': 'JobFlowAI-ProfileImporter' }
        });
        
        if (userRes.ok) {
          const userJson = await userRes.json();
          
          const reposRes = await fetch(`https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=20`, {
            headers: { 'User-Agent': 'JobFlowAI-ProfileImporter' }
          });
          
          let reposJson = [];
          if (reposRes.ok) {
            reposJson = await reposRes.json();
          }

          githubData = {
            login: userJson.login,
            name: userJson.name || '',
            bio: userJson.bio || '',
            blog: userJson.blog || '',
            company: userJson.company || '',
            location: userJson.location || '',
            email: userJson.email || '',
            repos: reposJson.map((repo: any) => ({
              name: repo.name,
              description: repo.description || '',
              language: repo.language || '',
              stars: repo.stargazers_count || 0,
              url: repo.html_url
            }))
          };
        } else {
          console.warn(`GitHub API returned status ${userRes.status} for username: ${githubUsername}`);
        }
      } catch (ghErr) {
        console.error('Error fetching GitHub data:', ghErr);
        // We do not fail the whole request; we'll parse whatever is available
      }
    }

    // 2. Query DeepSeek to structure the LinkedIn text and GitHub data
    const systemPrompt = `You are an expert recruitment parser. Your task is to analyze raw copy-pasted text from a LinkedIn profile or resume, combined with structured public GitHub profile/repository details, and synthesize a clean, structured professional resume profile.

CRITICAL RULES:
1. TRUTHFULNESS: Rely ONLY on the facts, dates, coordinates, and skills contained in the inputs. Do not invent company names or credentials.
2. SYNTHESIZE PROJECTS & SKILLS: Extract programming languages, framework keywords, and project names from the GitHub repository list and list them as technical skills or achievements.
3. SKILL LEVEL MAPPING: For each skill, search the raw text and GitHub repositories for self-reported seniority or experience indicators (e.g., "Senior TypeScript Architect" or "6 years experience in Java" -> Expert; "Mid-level React Developer" -> Advanced or Intermediate; "Junior Python coder" -> Beginner; "experience with AWS" -> Intermediate; "basic understanding of Docker" -> Beginner). Map all detected skill proficiencies strictly to one of these four levels: 'Expert', 'Advanced', 'Intermediate', 'Beginner'. If no seniority/experience is indicated for a skill, default to 'Intermediate'.
4. SKILL CATEGORY MAPPING: Map each skill to one of these four categories based on its nature: 'Frontend', 'Backend', 'Database', or 'Tools'. Default to 'Tools' if it doesn't clearly fit others.
5. OUTPUT FORMAT: You must return a raw JSON object matching the exact keys below. Experience and Education dates should be parsed cleanly (e.g. "Jan 2021" or "2018").

Return a JSON object conforming to this template:
{
  "fullName": "<string>",
  "email": "<string>",
  "phone": "<string>",
  "website": "<string>",
  "github": "<string, e.g. github.com/username>",
  "linkedin": "<string, e.g. linkedin.com/in/username>",
  "address": "<string>",
  "dateOfBirth": "<string or empty>",
  "birthplace": "<string or empty>",
  "nationality": "<string or empty>",
  "workExperience": [
    {
      "company": "<string>",
      "role": "<string>",
      "location": "<string>",
      "startDate": "<string, e.g. Jan 2021>",
      "endDate": "<string, e.g. Dec 2023 or Present>",
      "current": <boolean>,
      "bullets": [<array of strings of factual metrics/achievements from profile>]
    }
  ],
  "education": [
    {
      "institution": "<string>",
      "degree": "<string>",
      "location": "<string>",
      "startDate": "<string>",
      "endDate": "<string>",
      "current": <boolean>
    }
  ],
  "skills": [
    { "name": "<string>", "level": "<string, strictly one of: Expert, Advanced, Intermediate, Beginner>", "category": "<string, strictly one of: Frontend, Backend, Database, Tools>" }
  ],
  "languages": [
    { "language": "<string>", "level": "<string, e.g. Native, C1, B2>" }
  ]
}`;

    const promptContent = `Here is the raw input data:
${githubData ? `--- GITHUB PROFILE & REPOSITORIES DATA ---\n${JSON.stringify(githubData, null, 2)}\n` : ''}
${linkedinText ? `--- LINKEDIN / RESUME RAW TEXT ---\n${linkedinText}\n` : ''}

Please parse and structure this data into the specified JSON format.`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: promptContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error during import parsing:', errorText);
      return NextResponse.json(
        { error: `DeepSeek API returned status ${response.status}: ${errorText}` },
        { status: 502 }
      );
    }

    const resJson = await response.json();
    const parsedData = JSON.parse(resJson.choices[0].message.content);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Import profile API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during profile import' }, { status: 500 });
  }
}
