import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReminderEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.reminderSettings.findFirst();

    if (!settings || !settings.enabled || !settings.email) {
      return NextResponse.json({
        success: true,
        message: 'Reminders disabled or email not configured',
      });
    }

    // Check if current time matches configured time (within 5 minute window)
    const now = new Date();
    const [configuredHour, configuredMinute] = settings.time.split(':').map(Number);

    // Convert to the user's timezone
    const userTime = new Date(
      now.toLocaleString('en-US', { timeZone: settings.timezone })
    );
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();

    const configuredMinutes = configuredHour * 60 + configuredMinute;
    const currentMinutes = currentHour * 60 + currentMinute;
    const diff = Math.abs(currentMinutes - configuredMinutes);

    // Only send if within 5 minutes of configured time
    if (diff > 5 && diff < 1435) {
      return NextResponse.json({
        success: true,
        message: `Not time to send reminder. Current: ${currentHour}:${currentMinute}, Configured: ${settings.time}`,
      });
    }

    // Get today's exercises
    const today = new Date();
    const dayOfWeek = today.getDay();

    const exercises = await prisma.exercise.findMany();

    const scheduledExercises = exercises.filter((exercise) => {
      if (exercise.frequencyPerWeek >= 7) return true;
      const interval = 7 / exercise.frequencyPerWeek;
      for (let i = 0; i < exercise.frequencyPerWeek; i++) {
        const scheduledDay = Math.floor(i * interval) % 7;
        if (scheduledDay === dayOfWeek) return true;
      }
      return false;
    });

    if (scheduledExercises.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No exercises scheduled for today',
      });
    }

    const success = await sendReminderEmail(settings.email, scheduledExercises);

    return NextResponse.json({
      success,
      message: success ? 'Reminder sent' : 'Failed to send reminder',
    });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for health checks
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
