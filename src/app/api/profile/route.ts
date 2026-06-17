import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let profile = await prisma.userProfile.findFirst();
    
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
      workExperience = [],
      education = [],
      skills = [],
      languages = []
    } = body;

    const existingProfile = await prisma.userProfile.findFirst();

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
      workExperience: JSON.stringify(workExperience),
      education: JSON.stringify(education),
      skills: JSON.stringify(skills),
      languages: JSON.stringify(languages)
    };

    let savedProfile;
    if (existingProfile) {
      savedProfile = await prisma.userProfile.update({
        where: { id: existingProfile.id },
        data
      });
    } else {
      savedProfile = await prisma.userProfile.create({
        data
      });
    }

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
