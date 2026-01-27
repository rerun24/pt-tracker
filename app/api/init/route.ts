import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  // Simple auth check using cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create a fresh connection for this request
  const prisma = new PrismaClient();

  try {
    // Connect explicitly
    await prisma.$connect();

    // Try to create tables by running queries
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Exercise" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "sets" INTEGER NOT NULL,
        "reps" INTEGER NOT NULL,
        "frequencyPerWeek" INTEGER NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ExerciseMedia" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "exerciseId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "thumbnailUrl" TEXT,
        "title" TEXT,
        "isAlternative" BOOLEAN NOT NULL DEFAULT false,
        "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DailyLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "date" DATE NOT NULL,
        "exerciseId" TEXT NOT NULL,
        "setsCompleted" INTEGER NOT NULL DEFAULT 0,
        "completed" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE,
        UNIQUE("date", "exerciseId")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ReminderSettings" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL,
        "time" TEXT NOT NULL DEFAULT '08:30',
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "timezone" TEXT NOT NULL DEFAULT 'America/Los_Angeles',
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$disconnect();
    return NextResponse.json({ success: true, message: 'Database initialized' });
  } catch (error) {
    console.error('Init error:', error);
    await prisma.$disconnect();
    return NextResponse.json({
      error: 'Failed to initialize database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST with authorization to initialize database' });
}
