import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { CvDocument, ClDocument } from '@/app/components/cv-templates/StandardTemplate';
import { AtsCvDocument, AtsClDocument } from '@/app/components/cv-templates/ATSOptimizedTemplate';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, data, options, atsMode } = body;

    if (!data) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    let pdfElement: any;

    if (type === 'cv') {
      if (atsMode) {
        pdfElement = <AtsCvDocument cv={data} options={options || {}} />;
      } else {
        pdfElement = <CvDocument cv={data} options={options || {}} />;
      }
    } else if (type === 'cl') {
      if (atsMode) {
        pdfElement = <AtsClDocument cl={data} options={options || {}} />;
      } else {
        pdfElement = <ClDocument cl={data} options={options || {}} />;
      }
    } else {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    const buffer = await renderToBuffer(pdfElement);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${type}_export.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to export PDF' },
      { status: 500 }
    );
  }
}
