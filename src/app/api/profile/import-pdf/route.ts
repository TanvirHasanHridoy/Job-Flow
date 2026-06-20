import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file was uploaded.' }, { status: 400 });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepSeek API Key is not configured in environment variables.' },
        { status: 500 }
      );
    }

    // 1. Extract text from the PDF buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let pdfText = '';
    try {
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      pdfText = pdfData.text || '';
    } catch (parseErr: any) {
      console.error('pdf-parse failure:', parseErr);
      return NextResponse.json(
        { error: `Failed to extract text from the PDF document: ${parseErr.message || parseErr}` },
        { status: 422 }
      );
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { error: 'The uploaded PDF appears to be empty or does not contain a machine-readable text layer.' },
        { status: 422 }
      );
    }

    // 2. Query DeepSeek to parse and structure the extracted raw text
    const systemPrompt = `You are an expert recruitment parser. Your task is to analyze raw copy-pasted text from a resume or CV and synthesize a clean, structured professional resume profile.

CRITICAL RULES:
1. TRUTHFULNESS: Rely ONLY on the facts, dates, coordinates, and skills contained in the inputs. Do not invent company names or credentials.
2. SYNTHESIZE PROJECTS & SKILLS: Extract programming languages, framework keywords, and technical systems and list them as technical skills or achievements.
3. SKILL LEVEL MAPPING: For each skill, search the raw text for self-reported seniority or experience indicators (e.g., "Senior TypeScript Architect" or "6 years experience in Java" -> Expert; "Mid-level React Developer" -> Advanced or Intermediate; "Junior Python coder" -> Beginner; "experience with AWS" -> Intermediate; "basic understanding of Docker" -> Beginner). Map all detected skill proficiencies strictly to one of these four levels: 'Expert', 'Advanced', 'Intermediate', 'Beginner'. If no seniority/experience is indicated for a skill, default to 'Intermediate'.
4. OUTPUT FORMAT: You must return a raw JSON object matching the exact keys below. Experience and Education dates should be parsed cleanly (e.g. "Jan 2021" or "2018").

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
    { "name": "<string>", "level": "<string, strictly one of: Expert, Advanced, Intermediate, Beginner>" }
  ],
  "languages": [
    { "language": "<string>", "level": "<string, e.g. Native, C1, B2>" }
  ]
}`;

    const promptContent = `Here is the raw text extracted from the CV PDF:
--- CV TEXT ---
${pdfText}

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
      console.error('DeepSeek API Error during PDF parsing:', errorText);
      return NextResponse.json(
        { error: `DeepSeek API returned status ${response.status}: ${errorText}` },
        { status: 502 }
      );
    }

    const resJson = await response.json();
    const parsedData = JSON.parse(resJson.choices[0].message.content);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Import PDF profile API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during PDF profile import' }, { status: 500 });
  }
}
