import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReminderEmail } from '@/lib/email';

// Minimal JSON response helper to prevent "output too large" errors
function jsonResponse(data: object, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    let settings;
    try {
      settings = await prisma.reminderSettings.findFirst();
    } catch (dbError) {
      // Database connection error - return minimal response
      return jsonResponse({ success: false, error: 'db_error' }, 500);
    }

    if (!settings || !settings.enabled || !settings.email) {
      return jsonResponse({ success: true, skipped: 'not_configured' });
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
      return jsonResponse({ success: true, skipped: 'not_time' });
    }

    // Get today's exercises
    let exercises;
    try {
      exercises = await prisma.exercise.findMany();
    } catch (dbError) {
      return jsonResponse({ success: false, error: 'db_error' }, 500);
    }

    const today = new Date();
    const dayOfWeek = today.getDay();

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
      return jsonResponse({ success: true, skipped: 'no_exercises' });
    }

    let emailSent = false;
    try {
      emailSent = await sendReminderEmail(settings.email, scheduledExercises);
    } catch (emailError) {
      return jsonResponse({ success: false, error: 'email_error' }, 500);
    }

    return jsonResponse({ success: emailSent, sent: emailSent });
  } catch (error) {
    // Catch-all: return minimal error response
    return jsonResponse({ success: false, error: 'unknown' }, 500);
  }
}

// Also support GET for health checks
export async function GET() {
  return NextResponse.json({ status: 'ok' });
}
