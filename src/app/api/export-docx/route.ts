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
    const { tailoredCv, targetLanguage = 'EN', cvFormat = 'visual', accentColor = '2563EB', font = 'Calibri' } = body;

    if (!tailoredCv) {
      return NextResponse.json({ error: 'Missing tailored CV payload' }, { status: 400 });
    }

    const {
      personalDetails = {},
      summary = '',
      summaryBullets = [],
      workExperience = [],
      education = [],
      skills = [],
      languages = [],
      projects = [],
      certifications = [],
      customSections = []
    } = tailoredCv;

    const isDe = targetLanguage === 'DE';
    const isBulletMatrix = cvFormat === 'bullet-matrix';
    const primaryColor = isBulletMatrix ? '000000' : accentColor.replace('#', '');
    const darkTextColor = isBulletMatrix ? '000000' : '1F2937'; // Slate 800
    const lightTextColor = isBulletMatrix ? '000000' : '4B5563'; // Slate 600
    const fontName = isBulletMatrix ? 'Arial' : font;

    const children: any[] = [];

    // 1. Header: Name & Contact Info
    if (isBulletMatrix) {
      const rightContactParas: Paragraph[] = [];
      if (personalDetails.phone) {
        rightContactParas.push(new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'Mobile: ', bold: true, size: 19, font: fontName, color: '000000' }),
            new TextRun({ text: personalDetails.phone, size: 19, font: fontName, color: '000000' })
          ]
        }));
      }
      if (personalDetails.email) {
        rightContactParas.push(new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'Email: ', bold: true, size: 19, font: fontName, color: '000000' }),
            new TextRun({ text: personalDetails.email, size: 19, font: fontName, color: '0066CC', underline: {} })
          ]
        }));
      }
      if (personalDetails.address) {
        rightContactParas.push(new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'Address: ', bold: true, size: 19, font: fontName, color: '000000' }),
            new TextRun({ text: personalDetails.address, size: 19, font: fontName, color: '000000' })
          ]
        }));
      }
      if (personalDetails.linkedin) {
        rightContactParas.push(new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 20 },
          children: [
            new TextRun({ text: 'LinkedIn: ', bold: true, size: 19, font: fontName, color: '000000' }),
            new TextRun({ text: personalDetails.linkedin, size: 19, font: fontName, color: '0066CC', underline: {} })
          ]
        }));
      }

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.SINGLE, size: 16, color: '000000' },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 40 },
                      children: [
                        new TextRun({
                          text: (personalDetails.fullName || '').toUpperCase(),
                          bold: true,
                          size: 30, // 15pt
                          font: fontName,
                          color: '000000'
                        })
                      ]
                    }),
                    personalDetails.occupation ? new Paragraph({
                      spacing: { after: 80 },
                      children: [
                        new TextRun({
                          text: personalDetails.occupation,
                          bold: true,
                          size: 20,
                          font: fontName,
                          color: '333333'
                        })
                      ]
                    }) : new Paragraph({ spacing: { after: 80 } })
                  ]
                }),
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  children: rightContactParas.length > 0 ? rightContactParas : [new Paragraph({})]
                })
              ]
            })
          ]
        })
      );
    } else {
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
    }

    // Helper for Section Headings
    const createSectionHeader = (title: string) => {
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: isBulletMatrix ? 200 : 240, after: isBulletMatrix ? 80 : 120 },
        border: isBulletMatrix ? undefined : {
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
            size: isBulletMatrix ? 24 : 22, // 12pt in bullet matrix, 11pt otherwise
            font: fontName,
            color: isBulletMatrix ? '000000' : primaryColor
          })
        ]
      });
    };

    // 3. Professional Summary
    if (summary || (summaryBullets && summaryBullets.length > 0)) {
      children.push(createSectionHeader(isDe ? (isBulletMatrix ? 'BERUFLICHE ZUSAMMENFASSUNG' : 'Beruflicher Werdegang') : 'PROFESSIONAL SUMMARY'));
      
      if (isBulletMatrix) {
        const bulletsToRender: string[] = summaryBullets && summaryBullets.length > 0
          ? summaryBullets
          : (typeof summary === 'string' ? summary.split('\n').map(l => l.replace(/^[•\-\*]\s*/, '').trim()).filter(Boolean) : []);

        bulletsToRender.forEach((b: string) => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 50, line: 260 },
              children: [
                new TextRun({
                  text: b,
                  size: 20, // 10pt
                  font: fontName,
                  color: darkTextColor
                })
              ]
            })
          );
        });
      } else {
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
    }

    // 4. Skills (Render before Work in Bullet Matrix format if desired or standard order)
    if (skills && skills.length > 0 && isBulletMatrix) {
      children.push(createSectionHeader(isDe ? 'TECHNISCHE FÄHIGKEITEN' : 'TECHNICAL SKILLS'));

      const categories: Record<string, string[]> = {};
      skills.forEach((s: any) => {
        const cat = s.category || 'Tools & Cloud';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(s.name || s);
      });

      Object.entries(categories).forEach(([_, skillItems]) => {
        if (skillItems.length === 0) return;
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 50, line: 260 },
            children: [
              new TextRun({
                text: `${skillItems.join(' | ')}.`,
                size: 20,
                font: fontName,
                color: '000000'
              })
            ]
          })
        );
      });
    }

    // 5. Projects
    if (projects && projects.length > 0) {
      children.push(createSectionHeader(isDe ? (isBulletMatrix ? 'PROJEKTE' : 'Projekte') : 'PROJECTS'));

      projects.forEach((proj: any) => {
        if (isBulletMatrix) {
          const desc = proj.description || '';
          const techs = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : (proj.technologies || '');
          const details = desc ? `${desc}${techs ? ` | ${techs}` : ''}` : techs;
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 50, line: 260 },
              children: [
                new TextRun({
                  text: proj.name || '',
                  bold: true,
                  size: 20,
                  font: fontName,
                  color: '000000'
                }),
                details ? new TextRun({
                  text: ` (${details}).`,
                  size: 20,
                  font: fontName,
                  color: '000000'
                }) : new TextRun('.')
              ]
            })
          );
        } else {
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
        }
      });
    }

    // 6. Work Experience
    if (workExperience && workExperience.length > 0) {
      children.push(createSectionHeader(isDe ? (isBulletMatrix ? 'BERUFSERFAHRUNG' : 'Berufserfahrung') : (isBulletMatrix ? 'PROFESSIONAL EXPERIENCES' : 'Work Experience')));

      workExperience.forEach((exp: any) => {
        if (isBulletMatrix) {
          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          spacing: { before: 120, after: 40 },
                          children: [
                            new TextRun({
                              text: `${(exp.company || '').toUpperCase()} – ${(exp.role || '').toUpperCase()}`,
                              bold: true,
                              size: 21,
                              font: fontName,
                              color: '000000'
                            })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { before: 120, after: 40 },
                          children: [
                            new TextRun({
                              text: (exp.period || '').toUpperCase(),
                              bold: true,
                              size: 20,
                              font: fontName,
                              color: '000000'
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          );
        } else {
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
        }

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
              spacing: { after: 50, line: 260 },
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

    // Standard skills rendering for visual/ats format
    if (skills && skills.length > 0 && !isBulletMatrix) {
      children.push(createSectionHeader(isDe ? 'Fähigkeiten & Kenntnisse' : 'Technical Skills'));

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
      children.push(createSectionHeader(isDe ? (isBulletMatrix ? 'AUSBILDUNG' : 'Ausbildung') : 'EDUCATION'));

      education.forEach((edu: any) => {
        if (isBulletMatrix) {
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 20 },
              children: [
                new TextRun({
                  text: (edu.degree || '').toUpperCase(),
                  bold: true,
                  size: 22, // 11pt
                  font: fontName,
                  color: '000000'
                })
              ]
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE },
                insideHorizontal: { style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          spacing: { after: 60 },
                          children: [
                            new TextRun({
                              text: `${edu.institution || ''}${edu.location ? ` – ${edu.location}` : ''}`,
                              bold: false,
                              size: 21,
                              font: fontName,
                              color: '000000'
                            })
                          ]
                        })
                      ]
                    }),
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          spacing: { after: 60 },
                          children: [
                            new TextRun({
                              text: (edu.period || '').toUpperCase(),
                              bold: true,
                              size: 20,
                              font: fontName,
                              color: '000000'
                            })
                          ]
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          );
        } else {
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
        }
      });
    }

    // 8. Certifications
    if (certifications && certifications.length > 0 && isBulletMatrix) {
      children.push(createSectionHeader(isDe ? 'ZERTIFIZIERUNGEN' : 'CERTIFICATIONS'));
      certifications.forEach((c: string) => {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 50, line: 260 },
            children: [
              new TextRun({
                text: c.endsWith('.') ? c : `${c}.`,
                size: 20,
                font: fontName,
                color: '000000'
              })
            ]
          })
        );
      });
    }

    // 9. Languages
    if (languages && languages.length > 0) {
      children.push(createSectionHeader(isDe ? (isBulletMatrix ? 'SPRACHEN' : 'Sprachen') : (isBulletMatrix ? 'LANGUAGES' : 'Languages')));

      if (isBulletMatrix) {
        const langStr = languages.map((l: any) => `${l.language} – ${l.level || 'Fluent'}`).join(' | ') + '.';
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 80, line: 260 },
            children: [
              new TextRun({
                text: langStr,
                size: 20,
                font: fontName,
                color: '000000'
              })
            ]
          })
        );
      } else {
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
