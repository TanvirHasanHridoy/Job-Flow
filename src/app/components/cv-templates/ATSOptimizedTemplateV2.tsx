import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Helper to convert mm to pt
const mmToPt = (mm: number) => mm * 2.83465;

// Helper to convert px to pt (browser px is 1/96in, PDF pt is 1/72in, conversion factor is 72/96 = 0.75)
const pxToPt = (px: number) => px * 0.75;

// Register Inter Google Font via direct raw TTF files on CDN
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-500-normal.ttf', fontWeight: 500 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf', fontWeight: 700 }
  ]
});

// Register Outfit Google Font via direct raw TTF files on CDN
Font.register({
  family: 'Outfit',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-500-normal.ttf', fontWeight: 500 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-600-normal.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/outfit@latest/latin-700-normal.ttf', fontWeight: 700 }
  ]
});

// Register Georgia (using Lora as serif alternative) via direct raw TTF files on CDN
Font.register({
  family: 'Georgia',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-500-normal.ttf', fontWeight: 500 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-600-normal.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/lora@latest/latin-700-normal.ttf', fontWeight: 700 }
  ]
});

// ATS-Optimized CV Document Component
export function AtsCvDocument({ cv, options }: { cv: any; options: any }) {
  const baseFontSizePt = pxToPt(options.fontSize || 11.5);
  const bulletSpacingPt = pxToPt(options.bulletSpacing || 4);
  const sectionSpacingPt = pxToPt(options.sectionSpacing || 24);
  const headerSpacingPt = pxToPt(options.headerSpacing || 12);
  const signatureSpacingPt = pxToPt(options.signatureSpacing || 40);

  const paddingTop = mmToPt(options.paddingTop || 28);
  const paddingSide = mmToPt(options.paddingSide || 24);
  const paddingBottom = mmToPt(options.paddingBottom || 20);

  // Dynamic style presets mapping
  const template = options.styleTemplate || 'CLASSIC_CORPORATE';
  let fontFam = 'Georgia';
  let accentColor = '#2980B9';
  let titleColor = '#18181b';
  let textColor = '#27272a';
  let borderColor = '#d4d4d8';
  let headingTransform: 'uppercase' | 'lowercase' | 'none' = 'uppercase';

  if (template === 'MODERN_MINIMALIST') {
    fontFam = 'Outfit';
    accentColor = '#18181b';
    titleColor = '#09090b';
    textColor = '#27272a';
    borderColor = '#e4e4e7';
    headingTransform = 'lowercase';
  } else if (template === 'TECH_CREATIVE') {
    fontFam = 'Inter';
    accentColor = '#6366f1';
    titleColor = '#312e81';
    textColor = '#1f2937';
    borderColor = '#818cf8';
    headingTransform = 'uppercase';
  } else { // CLASSIC_CORPORATE
    fontFam = 'Georgia';
    accentColor = '#2980B9';
    titleColor = '#18181b';
    textColor = '#27272a';
    borderColor = '#d4d4d8';
    headingTransform = 'uppercase';
  }

  const cvStyles = StyleSheet.create({
    page: {
      backgroundColor: '#ffffff',
      fontFamily: fontFam,
      fontSize: baseFontSizePt,
      lineHeight: 1.25, // Adjusted to match browser vertical rhythm (corresponds to browser 1.55 CSS line-height)
      color: textColor,
      paddingTop: paddingTop,
      paddingLeft: paddingSide,
      paddingRight: paddingSide,
      paddingBottom: paddingBottom,
    },
    headerRow: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: bulletSpacingPt,
    },
    fullName: {
      fontSize: pxToPt(24),
      fontFamily: fontFam,
      fontWeight: 700,
      color: titleColor,
    },
    occupation: {
      fontSize: pxToPt(13),
      fontFamily: fontFam,
      fontWeight: 700,
      color: accentColor,
      marginTop: 2,
    },
    contactBlock: {
      marginTop: headerSpacingPt,
      marginBottom: sectionSpacingPt * 0.5,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      paddingBottom: 8,
      width: '100%',
    },
    contactGrid: {
      flexDirection: 'column',
      width: '100%',
    },
    contactItem: {
      fontSize: baseFontSizePt - pxToPt(0.5),
      marginBottom: bulletSpacingPt * 0.5,
      flexDirection: 'row',
      fontFamily: fontFam,
    },
    contactLabel: {
      fontFamily: fontFam,
      fontWeight: 700,
    },
    contactVal: {
      color: textColor,
      fontFamily: fontFam,
    },
    sectionTitleContainer: {
      marginTop: sectionSpacingPt * 0.6,
      marginBottom: sectionSpacingPt * 0.3,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      paddingBottom: 2,
    },
    sectionTitleText: {
      fontSize: pxToPt(15),
      fontFamily: fontFam,
      fontWeight: 700,
      textTransform: headingTransform,
    },
    summaryText: {
      fontSize: baseFontSizePt,
      lineHeight: 1.25,
      color: textColor,
      fontFamily: fontFam,
    },
    entryBlock: {
      flexDirection: 'column',
      marginBottom: bulletSpacingPt * 1.5,
      width: '100%',
    },
    dateText: {
      fontSize: baseFontSizePt - pxToPt(0.5),
      fontFamily: fontFam,
      fontWeight: 700,
      color: '#6B7280',
      marginBottom: 2,
    },
    roleName: {
      fontSize: baseFontSizePt + pxToPt(0.5),
      fontFamily: fontFam,
      fontWeight: 700,
      color: accentColor,
    },
    companyName: {
      fontSize: baseFontSizePt - pxToPt(0.5),
      color: '#4B5563',
      marginTop: 1,
      fontFamily: fontFam,
    },
    bulletList: {
      marginTop: bulletSpacingPt * 0.35,
    },
    bulletItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: bulletSpacingPt,
    },
    bulletDot: {
      width: 10,
      fontSize: baseFontSizePt,
      color: '#6B7280',
      fontFamily: fontFam,
    },
    bulletText: {
      flex: 1,
      fontSize: baseFontSizePt,
      lineHeight: 1.25,
      color: textColor,
      fontFamily: fontFam,
    },
    signatureBlock: {
      marginTop: signatureSpacingPt,
      fontSize: baseFontSizePt - pxToPt(0.5),
      color: '#4B5563',
      fontFamily: fontFam,
    },
    signatureName: {
      marginTop: 12,
      fontFamily: fontFam,
      fontWeight: 700,
      color: textColor,
    }
  });

  return (
    <Document>
      <Page size="A4" style={cvStyles.page}>
        {/* Header */}
        <View style={cvStyles.headerRow}>
          <Text style={cvStyles.fullName}>{cv.personalDetails?.fullName || ''}</Text>
          <Text style={cvStyles.occupation}>{cv.personalDetails?.occupation || ''}</Text>
        </View>

        {/* Contact Details */}
        <View style={cvStyles.contactBlock}>
          <View style={cvStyles.contactGrid}>
            {cv.personalDetails?.address && (
              <View style={cvStyles.contactItem}>
                <Text style={cvStyles.contactLabel}>Address: </Text>
                <Text style={cvStyles.contactVal}>{cv.personalDetails.address}</Text>
              </View>
            )}
            {cv.personalDetails?.phone && (
              <View style={cvStyles.contactItem}>
                <Text style={cvStyles.contactLabel}>Phone: </Text>
                <Text style={cvStyles.contactVal}>{cv.personalDetails.phone}</Text>
              </View>
            )}
            {cv.personalDetails?.email && (
              <View style={cvStyles.contactItem}>
                <Text style={cvStyles.contactLabel}>Email: </Text>
                <Text style={cvStyles.contactVal}>{cv.personalDetails.email}</Text>
              </View>
            )}
            {cv.personalDetails?.dateOfBirth && (
              <View style={cvStyles.contactItem}>
                <Text style={cvStyles.contactLabel}>DOB: </Text>
                <Text style={cvStyles.contactVal}>{cv.personalDetails.dateOfBirth}</Text>
              </View>
            )}
            {cv.personalDetails?.nationality && (
              <View style={cvStyles.contactItem}>
                <Text style={cvStyles.contactLabel}>Nationality: </Text>
                <Text style={cvStyles.contactVal}>{cv.personalDetails.nationality}</Text>
              </View>
            )}
            {cv.personalDetails?.linkedin && (
              <View style={cvStyles.contactItem}>
                <Text style={cvStyles.contactLabel}>LinkedIn: </Text>
                <Text style={cvStyles.contactVal}>{cv.personalDetails.linkedin}</Text>
              </View>
            )}
            {cv.personalDetails?.website && (
              <View style={cvStyles.contactItem}>
                <Text style={cvStyles.contactLabel}>Website: </Text>
                <Text style={cvStyles.contactVal}>{cv.personalDetails.website}</Text>
              </View>
            )}
            {cv.personalDetails?.github && (
              <View style={cvStyles.contactItem}>
                <Text style={cvStyles.contactLabel}>Github: </Text>
                <Text style={cvStyles.contactVal}>{cv.personalDetails.github}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary */}
        {cv.summary && (
          <View>
            <View style={cvStyles.sectionTitleContainer}>
              <Text style={cvStyles.sectionTitleText}>PROFESSIONAL PROFILE</Text>
            </View>
            <Text style={cvStyles.summaryText}>{cv.summary.replace(/<[^>]*>/g, '')}</Text>
          </View>
        )}

        {/* Work History */}
        {cv.workExperience && cv.workExperience.length > 0 && (
          <View>
            <View style={cvStyles.sectionTitleContainer}>
              <Text style={cvStyles.sectionTitleText}>WORK HISTORY</Text>
            </View>
            {cv.workExperience.map((exp: any, idx: number) => {
              let bulletsList: string[] = [];
              if (exp.bullets) {
                if (Array.isArray(exp.bullets)) {
                  bulletsList = exp.bullets;
                } else {
                  const styleKey = options.bulletStyle === 'STAR Method' ? 'star' : options.bulletStyle === 'Short & Punchy' ? 'punchy' : 'standard';
                  bulletsList = exp.bullets[styleKey] || exp.bullets.standard || [];
                }
              }
              return (
                <View key={idx} style={cvStyles.entryBlock}>
                  <Text style={cvStyles.dateText}>{exp.period}</Text>
                  <Text style={cvStyles.roleName}>{exp.role}</Text>
                  <Text style={cvStyles.companyName}>
                    {exp.company} {exp.location ? `– ${exp.location}` : ''}
                  </Text>
                  <View style={cvStyles.bulletList}>
                    {bulletsList.map((bullet: string, bIdx: number) => (
                      <View key={bIdx} style={cvStyles.bulletItem}>
                        <Text style={cvStyles.bulletDot}>•</Text>
                        <Text style={cvStyles.bulletText}>{bullet.replace(/<[^>]*>/g, '')}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Education */}
        {cv.education && cv.education.length > 0 && (
          <View>
            <View style={cvStyles.sectionTitleContainer}>
              <Text style={cvStyles.sectionTitleText}>EDUCATION</Text>
            </View>
            {cv.education.map((edu: any, idx: number) => (
              <View key={idx} style={cvStyles.entryBlock}>
                <Text style={cvStyles.dateText}>{edu.period}</Text>
                <Text style={cvStyles.roleName}>{edu.degree}</Text>
                <Text style={cvStyles.companyName}>
                  {edu.institution} {edu.location ? `– ${edu.location}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {cv.skills && cv.skills.length > 0 && (
          <View>
            <View style={cvStyles.sectionTitleContainer}>
              <Text style={cvStyles.sectionTitleText}>SKILLS</Text>
            </View>
            <View style={{ flexDirection: 'column' }}>
              {cv.skills.map((skill: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 4, flexDirection: 'row' }}>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>• {skill.name}: </Text>
                  <Text style={{ color: '#4B5563' }}>{skill.level}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {cv.languages && cv.languages.length > 0 && (
          <View>
            <View style={cvStyles.sectionTitleContainer}>
              <Text style={{ ...cvStyles.sectionTitleText, marginTop: 8 }}>LANGUAGES</Text>
            </View>
            <View style={{ flexDirection: 'column' }}>
              {cv.languages.map((lang: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 4, flexDirection: 'row' }}>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>• {lang.language}: </Text>
                  <Text style={{ color: '#4B5563' }}>{lang.level}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Signature */}
        {cv.signingLine ? (
          <View style={cvStyles.signatureBlock}>
            <Text>{cv.signingLine}</Text>
            <Text style={cvStyles.signatureName}>{cv.personalDetails?.fullName || ''}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

// ATS-Optimized Cover Letter Document Component
export function AtsClDocument({ cl, options }: { cl: any; options: any }) {
  const clFontSizePt = pxToPt(11.5);

  const template = options.styleTemplate || 'CLASSIC_CORPORATE';
  let fontFam = 'Georgia';

  if (template === 'MODERN_MINIMALIST') {
    fontFam = 'Outfit';
  } else if (template === 'TECH_CREATIVE') {
    fontFam = 'Inter';
  } else { // CLASSIC_CORPORATE
    fontFam = 'Georgia';
  }

  const clStyles = StyleSheet.create({
    page: {
      paddingTop: 90,
      paddingLeft: 79,
      paddingRight: 79,
      paddingBottom: 68,
      fontFamily: fontFam,
      fontSize: clFontSizePt,
      lineHeight: 1.35, // Adjusted to match browser vertical rhythm (corresponds to browser 1.65 CSS line-height)
      color: '#1A1A1A',
    },
    senderBlock: {
      textAlign: 'left', // ATS friendly left aligned sender
      marginBottom: 20,
      fontSize: pxToPt(10),
      color: '#4B5563',
      fontFamily: fontFam,
    },
    recipientBlock: {
      marginBottom: 20,
      fontSize: pxToPt(10.5),
      lineHeight: 1.35,
      fontFamily: fontFam,
    },
    dateLine: {
      textAlign: 'left',
      marginBottom: 20,
      fontFamily: fontFam,
      fontWeight: 700,
    },
    subjectLine: {
      fontSize: pxToPt(12),
      fontFamily: fontFam,
      fontWeight: 700,
      marginBottom: 20,
      textDecoration: 'underline',
    },
    salutation: {
      marginBottom: 16,
      fontFamily: fontFam,
    },
    paragraph: {
      marginBottom: 14,
      textAlign: 'left', // ATS friendly left aligned paragraphs
      fontFamily: fontFam,
    },
    closingBlock: {
      marginTop: 24,
      lineHeight: 1.35,
      fontFamily: fontFam,
    },
    signatureName: {
      marginTop: 36,
      fontFamily: fontFam,
      fontWeight: 700,
    }
  });

  let paragraphs: string[] = [];
  if (cl.paragraphs) {
    if (Array.isArray(cl.paragraphs)) {
      paragraphs = cl.paragraphs;
    } else {
      const layout = options.clLength === 'Short & Punchy (under 300 words)' ? 'short' : 'detailed';
      paragraphs = cl.paragraphs[layout] || cl.paragraphs.short || cl.paragraphs.detailed || [];
    }
  }

  return (
    <Document>
      <Page size="A4" style={clStyles.page}>
        {cl.senderAddress && (
          <Text style={clStyles.senderBlock}>{cl.senderAddress}</Text>
        )}
        {cl.recipientAddress && (
          <Text style={clStyles.recipientBlock}>{cl.recipientAddress}</Text>
        )}
        {cl.dateLine && (
          <Text style={clStyles.dateLine}>{cl.dateLine}</Text>
        )}
        {cl.subjectLine && (
          <Text style={clStyles.subjectLine}>{cl.subjectLine}</Text>
        )}
        {cl.salutation && (
          <Text style={clStyles.salutation}>{cl.salutation}</Text>
        )}
        {paragraphs.map((p: string, idx: number) => (
          <Text key={idx} style={clStyles.paragraph}>{p}</Text>
        ))}
        <View style={clStyles.closingBlock}>
          <Text>{cl.closing || 'Mit freundlichen Grüßen,'}</Text>
          <Text style={clStyles.signatureName}>{cl.signatureName || ''}</Text>
        </View>
      </Page>
    </Document>
  );
}
