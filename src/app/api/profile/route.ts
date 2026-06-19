import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUserId } from '@/lib/auth';

export async function GET() {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    let profile = await prisma.userProfile.findFirst({
      where: { userId }
    });
    
    if (!profile) {
      // Return a blank template if it does not exist yet
      return NextResponse.json({
        fullName: '',
        email: '',
        phone: '',
        website: '',
        github: '',
        linkedin: '',
        address: '',
        dateOfBirth: '',
        birthplace: '',
        nationality: '',
        photo: '',
        signature: '',
        workExperience: [],
        education: [],
        skills: [],
        languages: []
      });
    }

    return NextResponse.json({
      ...profile,
      workExperience: JSON.parse(profile.workExperience),
      education: JSON.parse(profile.education),
      skills: JSON.parse(profile.skills),
      languages: JSON.parse(profile.languages),
    });
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await getAuthUserId();
    if ('error' in auth) return auth.error;
    const { userId } = auth;

    const body = await req.json();
    
    // Extracted fields
    const {
      fullName = '',
      email = '',
      phone = '',
      website = '',
      github = '',
      linkedin = '',
      address = '',
      dateOfBirth = '',
      birthplace = '',
      nationality = '',
      photo = '',
      signature = '',
      workExperience = [],
      education = [],
      skills = [],
      languages = []
    } = body;

    const data = {
      fullName,
      email,
      phone,
      website,
      github,
      linkedin,
      address,
      dateOfBirth,
      birthplace,
      nationality,
      photo,
      signature,
      workExperience: JSON.stringify(workExperience),
      education: JSON.stringify(education),
      skills: JSON.stringify(skills),
      languages: JSON.stringify(languages)
    };

    // Upsert: create if not exists, update if exists
    const savedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data
      }
    });

    return NextResponse.json({
      ...savedProfile,
      workExperience: JSON.parse(savedProfile.workExperience),
      education: JSON.parse(savedProfile.education),
      skills: JSON.parse(savedProfile.skills),
      languages: JSON.parse(savedProfile.languages),
    });
  } catch (error: any) {
    console.error('Error saving profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
