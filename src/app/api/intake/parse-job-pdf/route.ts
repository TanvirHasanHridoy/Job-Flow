import { NextResponse } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { deductTokens, TOKEN_PRICING } from '@/lib/tokens';
import { getAiConfig } from '@/lib/ai';
import 'pdf-parse/worker';
import { PDFParse } from 'pdf-parse';

// === DeepSeek API Configuration (Preserved / Commented as requested) ===
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    // Deduct tokens
    const deduction = await deductTokens(userId, TOKEN_PRICING.INTAKE);
    if (!deduction.success) {
      return NextResponse.json(
        { error: 'Insufficient tokens. Please top up your account.' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file was uploaded.' }, { status: 400 });
    }

    const aiConfig = getAiConfig();
    if (!aiConfig.apiKey) {
      return NextResponse.json(
        { error: `${aiConfig.provider} API Key is not configured in environment variables.` },
        { status: 500 }
      );
    }

    // === DEEPSEEK API KEY (Preserved / Commented as requested) ===
    // const apiKey = process.env.DEEPSEEK_API_KEY;
    // if (!apiKey) {
    //   return NextResponse.json(
    //     { error: 'DeepSeek API Key is not configured in environment variables.' },
    //     { status: 500 }
    //   );
    // }

    // 1. Extract text from the PDF buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let pdfText = '';
    try {
      const parser = new PDFParse({ data: buffer });
      const pdfData = await parser.getText();
      pdfText = pdfData.text || '';
    } catch (parseErr: any) {
      console.error('pdf-parse failure on job description:', parseErr);
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

    // 2. Query DeepSeek to clean and parse the extracted raw text into structured JD details
    const systemPrompt = `You are a professional recruiting intake analyzer. Your task is to process raw text extracted from a job description PDF and extract:
1. Job Title / Role Name (e.g. "Senior React Developer")
2. Company Name (e.g. "Acme Corp")
3. Clean Job Description (Keep requirements, responsibilities, technical skills, benefits. Strip headers, footers, page numbers, formatting relics, or unrelated company meta).

Return a strict JSON object conforming to this template:
{
  "roleName": "<string>",
  "companyName": "<string>",
  "jobDescription": "<string, markdown formatted requirements & job details>"
}`;

    const promptContent = `Here is the raw text extracted from the job description PDF:
--- PDF TEXT ---
${pdfText}

Please parse and return the JSON object.`;

    // === DEEPSEEK PDF Parse Fetch (Commented) ===
    // const response = await fetch(DEEPSEEK_API_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    //   body: JSON.stringify({
    //     model: process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro',
    //     messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: promptContent }],
    //     response_format: { type: 'json_object' },
    //     temperature: 0.1
    //   })
    // });

    const response = await fetch(aiConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: aiConfig.model,
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
      console.error(`${aiConfig.provider} API Error during job description PDF parsing:`, errorText);
      return NextResponse.json(
        { error: `${aiConfig.provider} API returned status ${response.status}: ${errorText}` },
        { status: 502 }
      );
    }

    const resJson = await response.json();
    const parsedData = JSON.parse(resJson.choices[0].message.content);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('Parse job PDF API error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred during job PDF parsing' }, { status: 500 });
  }
}
