import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '30';
    const days = parseInt(daysParam);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

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

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();

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
      const dateStr = log.date.toISOString().split('T')[0];
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

    // Calculate streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = chartData.length - 1; i >= 0; i--) {
      const dayData = chartData[i];
      if (dayData.date > today) continue;

      if (dayData.total > 0 && dayData.completed === dayData.total) {
        currentStreak++;
      } else if (dayData.date < today) {
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
