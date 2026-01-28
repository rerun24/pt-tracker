import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Parse YYYY-MM-DD string to get components without timezone conversion
function parseDateString(dateStr: string): { date: Date; dayOfWeek: number } {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date at noon UTC to avoid any date boundary issues
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  // Calculate day of week from the date components directly
  const tempDate = new Date(year, month - 1, day);
  const dayOfWeek = tempDate.getDay();
  return { date, dayOfWeek };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter required' },
        { status: 400 }
      );
    }

    const { date, dayOfWeek } = parseDateString(dateStr);

    // Get all exercises
    const exercises = await prisma.exercise.findMany({
      orderBy: { name: 'asc' },
    });

    // Determine which exercises are scheduled for today based on frequency
    // Simple algorithm: spread exercises evenly across the week
    const scheduledExercises = exercises.filter((exercise) => {
      if (exercise.frequencyPerWeek >= 7) return true;

      // Distribute days evenly
      const interval = 7 / exercise.frequencyPerWeek;
      for (let i = 0; i < exercise.frequencyPerWeek; i++) {
        const scheduledDay = Math.floor(i * interval) % 7;
        if (scheduledDay === dayOfWeek) return true;
      }
      return false;
    });

    // Get logs for this date
    const logs = await prisma.dailyLog.findMany({
      where: {
        date: date,
        exerciseId: { in: scheduledExercises.map((e) => e.id) },
      },
    });

    // Combine exercises with their logs
    const result = scheduledExercises.map((exercise) => {
      const log = logs.find((l) => l.exerciseId === exercise.id);
      return {
        exerciseId: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        setsCompleted: log?.setsCompleted || 0,
        completed: log?.completed || false,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, exerciseId, setsCompleted, completed } = body;

    if (!date || !exerciseId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { date: dateObj } = parseDateString(date);

    const log = await prisma.dailyLog.upsert({
      where: {
        date_exerciseId: {
          date: dateObj,
          exerciseId,
        },
      },
      create: {
        date: dateObj,
        exerciseId,
        setsCompleted: setsCompleted || 0,
        completed: completed || false,
      },
      update: {
        setsCompleted: setsCompleted || 0,
        completed: completed || false,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error updating log:', error);
    return NextResponse.json(
      { error: 'Failed to update log' },
      { status: 500 }
    );
  }
}
