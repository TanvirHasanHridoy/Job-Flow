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

// CV Document Component
export function CvDocument({ cv, options }: { cv: any; options: any }) {
  const baseFontSizePt = pxToPt(options.fontSize || 11.5);
  const bulletSpacingPt = pxToPt(options.bulletSpacing || 4);
  const sectionSpacingPt = pxToPt(options.sectionSpacing || 24);
  const headerSpacingPt = pxToPt(options.headerSpacing || 12);
  const photoHeightPt = pxToPt(options.photoHeight || 105);
  const signatureSpacingPt = pxToPt(options.signatureSpacing || 40);

  const paddingTop = mmToPt(options.paddingTop || 28);
  const paddingSide = mmToPt(options.paddingSide || 24);
  const paddingBottom = mmToPt(options.paddingBottom || 20);

  const cvStyles = StyleSheet.create({
    page: {
      backgroundColor: '#ffffff',
      fontFamily: 'Inter',
      fontSize: baseFontSizePt,
      lineHeight: 1.25, // Adjusted to match browser vertical rhythm (corresponds to browser 1.55 CSS line-height)
      color: '#1F2937',
      paddingTop: paddingTop,
      paddingLeft: paddingSide,
      paddingRight: paddingSide,
      paddingBottom: paddingBottom,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: bulletSpacingPt,
    },
    nameCol: {
      flex: 1,
    },
    fullName: {
      fontSize: pxToPt(24),
      fontFamily: 'Inter',
      fontWeight: 700,
      color: '#1F2937',
    },
    occupation: {
      fontSize: pxToPt(13),
      fontFamily: 'Inter',
      fontWeight: 700,
      color: '#2980B9',
      marginTop: 2,
    },
    photoBox: {
      width: photoHeightPt * 0.81,
      height: photoHeightPt,
      border: '1px solid #D1D5DB',
      borderRadius: 2,
      backgroundColor: '#E5E7EB',
      marginLeft: 16,
      overflow: 'hidden',
    },
    photoImage: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    photoPlaceholder: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    photoText: {
      fontSize: pxToPt(9),
      color: '#9CA3AF',
    },
    contactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: headerSpacingPt,
      marginBottom: sectionSpacingPt * 0.5,
    },
    contactItem: {
      width: '50%',
      fontSize: baseFontSizePt - pxToPt(0.5),
      marginBottom: bulletSpacingPt * 0.5,
      flexDirection: 'row',
    },
    contactLabel: {
      fontFamily: 'Inter',
      fontWeight: 700,
    },
    contactVal: {
      color: '#374151',
    },
    sectionTitleContainer: {
      marginTop: sectionSpacingPt * 0.4,
      marginBottom: sectionSpacingPt * 0.3,
      borderBottomWidth: 1,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 2,
    },
    sectionTitleText: {
      fontSize: pxToPt(15),
      fontFamily: 'Inter',
      fontWeight: 700,
    },
    summaryText: {
      fontSize: baseFontSizePt,
      lineHeight: 1.25,
      color: '#374151',
    },
    tableRow: {
      flexDirection: 'row',
      marginBottom: bulletSpacingPt,
    },
    dateCell: {
      width: '28%',
      paddingRight: 12,
      fontSize: baseFontSizePt - pxToPt(0.5),
      color: '#6B7280',
    },
    contentCell: {
      width: '72%',
    },
    roleName: {
      fontSize: baseFontSizePt + pxToPt(0.5),
      fontFamily: 'Inter',
      fontWeight: 700,
      color: '#2980B9',
    },
    companyName: {
      fontSize: baseFontSizePt - pxToPt(0.5),
      color: '#4B5563',
      marginTop: 1,
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
    },
    bulletText: {
      flex: 1,
      fontSize: baseFontSizePt,
      lineHeight: 1.25,
      color: '#374151',
    },
    signatureBlock: {
      marginTop: signatureSpacingPt,
      fontSize: baseFontSizePt - pxToPt(0.5),
      color: '#4B5563',
    },
    signatureName: {
      marginTop: 12,
      fontFamily: 'Inter',
      fontWeight: 700,
      color: '#374151',
    }
  });

  return (
    <Document>
      <Page size="A4" style={cvStyles.page}>
        {/* Header */}
        <View style={cvStyles.headerRow}>
          <View style={cvStyles.nameCol}>
            <Text style={cvStyles.fullName}>{cv.personalDetails?.fullName || ''}</Text>
            <Text style={cvStyles.occupation}>{cv.personalDetails?.occupation || ''}</Text>
          </View>
          {cv.personalDetails?.photo ? (
            <View style={cvStyles.photoBox}>
              <Image src={cv.personalDetails.photo} style={cvStyles.photoImage} />
            </View>
          ) : (
            <View style={cvStyles.photoBox}>
              <View style={cvStyles.photoPlaceholder}>
                <Text style={cvStyles.photoText}>Photo</Text>
              </View>
            </View>
          )}
        </View>

        {/* Contact Grid */}
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
                <View key={idx} style={cvStyles.tableRow}>
                  <Text style={cvStyles.dateCell}>{exp.period}</Text>
                  <View style={cvStyles.contentCell}>
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
              <View key={idx} style={cvStyles.tableRow}>
                <Text style={cvStyles.dateCell}>{edu.period}</Text>
                <View style={cvStyles.contentCell}>
                  <Text style={cvStyles.roleName}>{edu.degree}</Text>
                  <Text style={cvStyles.companyName}>
                    {edu.institution} {edu.location ? `– ${edu.location}` : ''}
                  </Text>
                </View>
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cv.skills.map((skill: any, idx: number) => (
                <View key={idx} style={{ width: '50%', marginBottom: 4, flexDirection: 'row' }}>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>{skill.name}: </Text>
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {cv.languages.map((lang: any, idx: number) => (
                <View key={idx} style={{ width: '50%', marginBottom: 4, flexDirection: 'row' }}>
                  <Text style={{ fontFamily: 'Inter', fontWeight: 700 }}>{lang.language}: </Text>
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

// Cover Letter Document Component
export function ClDocument({ cl, options }: { cl: any; options: any }) {
  const clFontSizePt = pxToPt(11.5);
  const clStyles = StyleSheet.create({
    page: {
      paddingTop: 90,
      paddingLeft: 79,
      paddingRight: 79,
      paddingBottom: 68,
      fontFamily: 'Inter',
      fontSize: clFontSizePt,
      lineHeight: 1.35, // Adjusted to match browser vertical rhythm (corresponds to browser 1.65 CSS line-height)
      color: '#1A1A1A',
    },
    senderBlock: {
      textAlign: 'right',
      marginBottom: 30,
      fontSize: pxToPt(10),
      color: '#4B5563',
    },
    recipientBlock: {
      marginBottom: 30,
      fontSize: pxToPt(10.5),
      lineHeight: 1.35,
    },
    dateLine: {
      textAlign: 'right',
      marginBottom: 20,
      fontFamily: 'Inter',
      fontWeight: 700,
    },
    subjectLine: {
      fontSize: pxToPt(12),
      fontFamily: 'Inter',
      fontWeight: 700,
      marginBottom: 24,
      textDecoration: 'underline',
    },
    salutation: {
      marginBottom: 16,
    },
    paragraph: {
      marginBottom: 14,
      textAlign: 'justify',
    },
    closingBlock: {
      marginTop: 24,
      lineHeight: 1.35,
    },
    signatureName: {
      marginTop: 36,
      fontFamily: 'Inter',
      fontWeight: 700,
    }
  });

  const layout = options.clLength === 'Short & Punchy (under 300 words)' ? 'short' : 'detailed';
  const paragraphs: string[] = cl.paragraphs?.[layout] || cl.paragraphs?.short || [];

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
