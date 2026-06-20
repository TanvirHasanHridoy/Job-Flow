import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Helper to convert mm to pt
const mmToPt = (mm: number) => mm * 2.83465;

// ATS-Optimized CV Document Component
export function AtsCvDocument({ cv, options }: { cv: any; options: any }) {
  const fontSize = options.fontSize || 11;
  const bulletSpacing = options.bulletSpacing || 6;
  const sectionSpacing = options.sectionSpacing || 16;
  
  const paddingTop = mmToPt(options.paddingTop || 28);
  const paddingSide = mmToPt(options.paddingSide || 24);
  const paddingBottom = mmToPt(options.paddingBottom || 20);

  const cvStyles = StyleSheet.create({
    page: {
      backgroundColor: '#ffffff',
      fontFamily: 'Helvetica',
      fontSize: fontSize,
      lineHeight: 1.5,
      color: '#1F2937',
      paddingTop: paddingTop,
      paddingLeft: paddingSide,
      paddingRight: paddingSide,
      paddingBottom: paddingBottom,
    },
    headerRow: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: bulletSpacing,
    },
    fullName: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#1F2937',
    },
    occupation: {
      fontSize: 13,
      fontFamily: 'Helvetica-Bold',
      color: '#2980B9',
      marginTop: 2,
    },
    contactBlock: {
      marginTop: sectionSpacing * 0.4,
      marginBottom: sectionSpacing * 0.5,
      borderBottomWidth: 1,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 8,
      width: '100%',
    },
    contactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: '100%',
    },
    contactItem: {
      width: '50%',
      fontSize: fontSize - 0.5,
      marginBottom: bulletSpacing * 0.5,
      flexDirection: 'row',
    },
    contactLabel: {
      fontFamily: 'Helvetica-Bold',
    },
    contactVal: {
      color: '#374151',
    },
    sectionTitleContainer: {
      marginTop: sectionSpacing * 0.6,
      marginBottom: sectionSpacing * 0.3,
      borderBottomWidth: 1,
      borderBottomColor: '#CBD5E1',
      paddingBottom: 2,
    },
    sectionTitleText: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 2,
    },
    summaryText: {
      fontSize: fontSize,
      lineHeight: 1.55,
      color: '#374151',
    },
    // Flex direction: column to ensure vertical chronological reading flow
    entryBlock: {
      flexDirection: 'column',
      marginBottom: bulletSpacing * 1.5,
      width: '100%',
    },
    dateText: {
      fontSize: fontSize - 0.5,
      fontFamily: 'Helvetica-Bold',
      color: '#6B7280',
      marginBottom: 2,
    },
    roleName: {
      fontSize: fontSize + 0.5,
      fontFamily: 'Helvetica-Bold',
      color: '#2980B9',
    },
    companyName: {
      fontSize: fontSize - 0.5,
      color: '#4B5563',
      marginTop: 1,
    },
    bulletList: {
      marginTop: bulletSpacing * 0.35,
    },
    bulletItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: bulletSpacing,
    },
    bulletDot: {
      width: 10,
      fontSize: fontSize,
      color: '#6B7280',
    },
    bulletText: {
      flex: 1,
      fontSize: fontSize,
      lineHeight: 1.45,
      color: '#374151',
    },
    signatureBlock: {
      marginTop: sectionSpacing,
      fontSize: fontSize - 0.5,
      color: '#4B5563',
    },
    signatureName: {
      marginTop: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#374151',
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

        {/* Contact details wrapped as a single, unified view container before profile summary */}
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

        {/* Work History - Self-contained vertical entries to maintain timeline reading order */}
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

        {/* Education - Self-contained vertical entries to maintain timeline reading order */}
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
              <Text style={cvStyles.sectionTitleText}>ADDITIONAL SKILLS</Text>
            </View>
            <View style={{ flexDirection: 'column' }}>
              {cv.skills.map((skill: any, idx: number) => (
                <View key={idx} style={{ marginBottom: 4, flexDirection: 'row' }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>• {skill.name}: </Text>
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
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>• {lang.language}: </Text>
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
  const clStyles = StyleSheet.create({
    page: {
      paddingTop: 90,
      paddingLeft: 79,
      paddingRight: 79,
      paddingBottom: 68,
      fontFamily: 'Helvetica',
      fontSize: 11,
      lineHeight: 1.6,
      color: '#1A1A1A',
    },
    senderBlock: {
      textAlign: 'left', // ATS friendly left aligned sender
      marginBottom: 20,
      fontSize: 10,
      color: '#4B5563',
    },
    recipientBlock: {
      marginBottom: 20,
      fontSize: 10.5,
      lineHeight: 1.5,
    },
    dateLine: {
      textAlign: 'left',
      marginBottom: 20,
      fontFamily: 'Helvetica-Bold',
    },
    subjectLine: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 20,
      textDecoration: 'underline',
    },
    salutation: {
      marginBottom: 16,
    },
    paragraph: {
      marginBottom: 14,
      textAlign: 'left', // ATS friendly left aligned paragraphs
    },
    closingBlock: {
      marginTop: 24,
      lineHeight: 1.5,
    },
    signatureName: {
      marginTop: 36,
      fontFamily: 'Helvetica-Bold',
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
