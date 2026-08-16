import { NextResponse } from 'next/server';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle
} from 'docx';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tailoredCv, targetLanguage = 'EN', accentColor = '2563EB', font = 'Calibri' } = body;

    if (!tailoredCv) {
      return NextResponse.json({ error: 'Missing tailored CV payload' }, { status: 400 });
    }

    const {
      personalDetails = {},
      summary = '',
      workExperience = [],
      education = [],
      skills = [],
      languages = [],
      projects = [],
      customSections = []
    } = tailoredCv;

    const isDe = targetLanguage === 'DE';
    const primaryColor = accentColor.replace('#', '');
    const darkTextColor = '1F2937'; // Slate 800
    const lightTextColor = '4B5563'; // Slate 600
    const fontName = font;

    const children: any[] = [];

    // 1. Header: Name & Title
    if (personalDetails.fullName) {
      children.push(
        new Paragraph({
          text: personalDetails.fullName.toUpperCase(),
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: personalDetails.fullName.toUpperCase(),
              bold: true,
              size: 32, // 16pt
              font: fontName,
              color: '111827'
            })
          ]
        })
      );
    }

    if (personalDetails.occupation) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: personalDetails.occupation,
              bold: true,
              size: 24, // 12pt
              font: fontName,
              color: primaryColor
            })
          ]
        })
      );
    }

    // 2. Contact Details Bar
    const contactParts: any[] = [];
    if (personalDetails.email) contactParts.push(personalDetails.email);
    if (personalDetails.phone) contactParts.push(personalDetails.phone);
    if (personalDetails.address) contactParts.push(personalDetails.address);
    if (personalDetails.linkedin) contactParts.push(personalDetails.linkedin);
    if (personalDetails.github) contactParts.push(personalDetails.github);
    if (personalDetails.website) contactParts.push(personalDetails.website);

    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: contactParts.join('  •  '),
              size: 19, // 9.5pt
              font: fontName,
              color: lightTextColor
            })
          ]
        })
      );
    }

    // Helper for Section Headings
    const createSectionHeader = (title: string) => {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        border: {
          bottom: {
            color: primaryColor,
            space: 4,
            style: BorderStyle.SINGLE,
            size: 12
          }
        },
        children: [
          new TextRun({
            text: title.toUpperCase(),
            bold: true,
            size: 22, // 11pt
            font: fontName,
            color: primaryColor
          })
        ]
      });
    };

    // 3. Professional Summary
    if (summary) {
      children.push(createSectionHeader(isDe ? 'Beruflicher Werdegang' : 'Professional Summary'));
      children.push(
        new Paragraph({
          spacing: { after: 200, line: 276 },
          children: [
            new TextRun({
              text: summary,
              size: 21, // 10.5pt
              font: fontName,
              color: darkTextColor
            })
          ]
        })
      );
    }

    // 4. Work Experience
    if (workExperience && workExperience.length > 0) {
      children.push(createSectionHeader(isDe ? 'Berufserfahrung' : 'Work Experience'));

      workExperience.forEach((exp: any) => {
        // Role & Period line
        children.push(
          new Paragraph({
            spacing: { before: 140, after: 40 },
            children: [
              new TextRun({
                text: exp.role || '',
                bold: true,
                size: 22, // 11pt
                font: fontName,
                color: '111827'
              }),
              new TextRun({
                text: `  |  ${exp.company || ''}`,
                bold: true,
                size: 21,
                font: fontName,
                color: primaryColor
              }),
              new TextRun({
                text: `  (${exp.period || ''}${exp.location ? ` - ${exp.location}` : ''})`,
                italics: true,
                size: 19,
                font: fontName,
                color: lightTextColor
              })
            ]
          })
        );

        // Bullets
        let bulletsList: string[] = [];
        if (Array.isArray(exp.bullets)) {
          bulletsList = exp.bullets;
        } else if (exp.bullets && typeof exp.bullets === 'object') {
          bulletsList = exp.bullets.standard || exp.bullets.punchy || exp.bullets.star || [];
        }

        bulletsList.forEach((bullet: string) => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 60, line: 260 },
              children: [
                new TextRun({
                  text: bullet,
                  size: 20, // 10pt
                  font: fontName,
                  color: darkTextColor
                })
              ]
            })
          );
        });
      });
    }

    // 5. Projects
    if (projects && projects.length > 0) {
      children.push(createSectionHeader(isDe ? 'Projekte' : 'Projects'));

      projects.forEach((proj: any) => {
        const techs = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies || '';
        children.push(
          new Paragraph({
            spacing: { before: 140, after: 40 },
            children: [
              new TextRun({
                text: proj.name || '',
                bold: true,
                size: 21,
                font: fontName,
                color: '111827'
              }),
              techs ? new TextRun({
                text: `  [${techs}]`,
                italics: true,
                size: 19,
                font: fontName,
                color: primaryColor
              }) : new TextRun(''),
              proj.url ? new TextRun({
                text: `  (${proj.url})`,
                size: 18,
                font: fontName,
                color: lightTextColor
              }) : new TextRun('')
            ]
          })
        );

        if (proj.description) {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 80, line: 260 },
              children: [
                new TextRun({
                  text: proj.description,
                  size: 20,
                  font: fontName,
                  color: darkTextColor
                })
              ]
            })
          );
        }
      });
    }

    // 6. Skills
    if (skills && skills.length > 0) {
      children.push(createSectionHeader(isDe ? 'Fähigkeiten & Kenntnisse' : 'Technical Skills'));

      // Group skills by category if available
      const categories: Record<string, string[]> = {};
      skills.forEach((s: any) => {
        const cat = s.category || (isDe ? 'Technologien' : 'Core Skills');
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(s.name || s);
      });

      Object.entries(categories).forEach(([category, skillItems]) => {
        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `${category}: `,
                bold: true,
                size: 20,
                font: fontName,
                color: '111827'
              }),
              new TextRun({
                text: skillItems.join(', '),
                size: 20,
                font: fontName,
                color: darkTextColor
              })
            ]
          })
        );
      });
    }

    // 7. Education
    if (education && education.length > 0) {
      children.push(createSectionHeader(isDe ? 'Ausbildung' : 'Education'));

      education.forEach((edu: any) => {
        children.push(
          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: edu.degree || '',
                bold: true,
                size: 21,
                font: fontName,
                color: '111827'
              }),
              new TextRun({
                text: `  |  ${edu.institution || ''}`,
                size: 20,
                font: fontName,
                color: primaryColor
              }),
              new TextRun({
                text: `  (${edu.period || ''}${edu.location ? ` - ${edu.location}` : ''})`,
                italics: true,
                size: 19,
                font: fontName,
                color: lightTextColor
              })
            ]
          })
        );
      });
    }

    // 8. Languages
    if (languages && languages.length > 0) {
      children.push(createSectionHeader(isDe ? 'Sprachen' : 'Languages'));

      const langList = languages.map((l: any) => `${l.language} (${l.level})`).join('  •  ');
      children.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: langList,
              size: 20,
              font: fontName,
              color: darkTextColor
            })
          ]
        })
      );
    }

    // 9. Custom Sections
    if (customSections && customSections.length > 0) {
      customSections.forEach((sec: any) => {
        children.push(createSectionHeader(sec.title || 'Custom Section'));

        if (sec.type === 'paragraph' && sec.content) {
          children.push(
            new Paragraph({
              spacing: { after: 140, line: 260 },
              children: [
                new TextRun({
                  text: sec.content,
                  size: 20,
                  font: fontName,
                  color: darkTextColor
                })
              ]
            })
          );
        } else if (sec.type === 'bullet-list' && Array.isArray(sec.bullets)) {
          sec.bullets.forEach((b: string) => {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: b,
                    size: 20,
                    font: fontName,
                    color: darkTextColor
                  })
                ]
              })
            );
          });
        } else if ((sec.type === 'subgroup-chips' || sec.type === 'subgroup-items') && Array.isArray(sec.subgroups)) {
          sec.subgroups.forEach((sub: any) => {
            children.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: `${sub.name}: `,
                    bold: true,
                    size: 20,
                    font: fontName,
                    color: '111827'
                  }),
                  new TextRun({
                    text: (sub.items || []).join(', '),
                    size: 20,
                    font: fontName,
                    color: darkTextColor
                  })
                ]
              })
            );
          });
        }
      });
    }

    // Build the Docx Document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1000,
                right: 1000,
                bottom: 1000,
                left: 1000
              }
            }
          },
          children
        }
      ]
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          (personalDetails.fullName || 'Resume').replace(/\s+/g, '_') + '_Tailored_CV.docx'
        )}"`
      }
    });
  } catch (error: any) {
    console.error('Error generating DOCX:', error);
    return NextResponse.json({ error: 'Failed to generate DOCX export: ' + error.message }, { status: 500 });
  }
}
