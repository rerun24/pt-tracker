import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Parse YYYY-MM-DD string and return date at noon UTC
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

// Format date to YYYY-MM-DD string
function formatDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get day of week from YYYY-MM-DD string (0 = Sunday)
function getDayOfWeek(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).getDay();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const days = parseInt(daysParam);
    // Client sends their local "today" date
    const todayParam = searchParams.get('today');

    let endDate: Date;
    let todayStr: string;

    if (todayParam) {
      // Use client's local date
      endDate = parseDateString(todayParam);
      todayStr = todayParam;
    } else {
      // Fallback to server date (not ideal but backwards compatible)
      endDate = new Date();
      todayStr = formatDateString(endDate);
    }

    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - days);

    // Get all logs in the date range
    const logs = await prisma.dailyLog.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        exercise: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Get all exercises for expected counts
    const exercises = await prisma.exercise.findMany();

    // Calculate daily completion rates
    const dailyStats: { [key: string]: { completed: number; total: number } } = {};

    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateStr = formatDateString(d);
      const dayOfWeek = getDayOfWeek(dateStr);

      // Count expected exercises for this day
      let expectedExercises = 0;
      exercises.forEach((exercise) => {
        if (exercise.frequencyPerWeek >= 7) {
          expectedExercises++;
          return;
        }
        const interval = 7 / exercise.frequencyPerWeek;
        for (let i = 0; i < exercise.frequencyPerWeek; i++) {
          const scheduledDay = Math.floor(i * interval) % 7;
          if (scheduledDay === dayOfWeek) {
            expectedExercises++;
            break;
          }
        }
      });

      dailyStats[dateStr] = { completed: 0, total: expectedExercises };
    }

    // Fill in completed counts
    logs.forEach((log) => {
      const dateStr = formatDateString(log.date);
      if (dailyStats[dateStr] && log.completed) {
        dailyStats[dateStr].completed++;
      }
    });

    // Convert to array for charts
    const chartData = Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      completed: stats.completed,
      total: stats.total,
    }));

    // Calculate streak using client's today
    let currentStreak = 0;

    for (let i = chartData.length - 1; i >= 0; i--) {
      const dayData = chartData[i];
      if (dayData.date > todayStr) continue;

      if (dayData.total > 0 && dayData.completed === dayData.total) {
        currentStreak++;
      } else if (dayData.date < todayStr) {
        // Only break if it's a past day with incomplete exercises
        break;
      }
    }

    // Overall stats
    const totalCompleted = logs.filter((l) => l.completed).length;
    const totalExpected = Object.values(dailyStats).reduce((sum, d) => sum + d.total, 0);
    const overallRate = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;

    // Per-exercise stats
    const exerciseStats = exercises.map((exercise) => {
      const exerciseLogs = logs.filter((l) => l.exerciseId === exercise.id);
      const completed = exerciseLogs.filter((l) => l.completed).length;
      const expectedDays = Math.ceil((days / 7) * exercise.frequencyPerWeek);
      return {
        id: exercise.id,
        name: exercise.name,
        completed,
        expected: expectedDays,
        rate: expectedDays > 0 ? Math.round((completed / expectedDays) * 100) : 0,
      };
    });

    return NextResponse.json({
      chartData,
      currentStreak,
      overallRate,
      totalCompleted,
      totalExpected,
      exerciseStats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
