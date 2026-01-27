import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    let settings = await prisma.reminderSettings.findFirst();

    if (!settings) {
      // Create default settings
      settings = await prisma.reminderSettings.create({
        data: {
          email: '',
          time: '08:30',
          enabled: false,
          timezone: 'America/Los_Angeles',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching reminder settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, time, enabled, timezone } = body;

    let settings = await prisma.reminderSettings.findFirst();

    if (settings) {
      settings = await prisma.reminderSettings.update({
        where: { id: settings.id },
        data: {
          ...(email !== undefined && { email }),
          ...(time !== undefined && { time }),
          ...(enabled !== undefined && { enabled }),
          ...(timezone !== undefined && { timezone }),
        },
      });
    } else {
      settings = await prisma.reminderSettings.create({
        data: {
          email: email || '',
          time: time || '08:30',
          enabled: enabled ?? false,
          timezone: timezone || 'America/Los_Angeles',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating reminder settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
