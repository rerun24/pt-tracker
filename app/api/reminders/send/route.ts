import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReminderEmail } from '@/lib/email';

export async function POST() {
  try {
    const settings = await prisma.reminderSettings.findFirst();

    if (!settings || !settings.enabled || !settings.email) {
      return NextResponse.json({ message: 'Reminders disabled or email not set' });
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
      return NextResponse.json({ message: 'No exercises scheduled for today' });
    }

    const success = await sendReminderEmail(settings.email, scheduledExercises);

    if (success) {
      return NextResponse.json({ message: 'Reminder sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send reminder' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
