import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { searchYouTubeVideos } from '@/lib/youtube';
import { searchUnsplashImages } from '@/lib/unsplash';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: { media: true },
    });

    if (!exercise) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 }
      );
    }

    // Return cached media if available and not refreshing
    if (exercise.media.length > 0 && !refresh) {
      return NextResponse.json(exercise.media);
    }

    // Fetch new media
    const [videos, images] = await Promise.all([
      searchYouTubeVideos(exercise.name),
      searchUnsplashImages(exercise.name),
    ]);

    // Delete old media if refreshing
    if (refresh && exercise.media.length > 0) {
      await prisma.exerciseMedia.deleteMany({
        where: { exerciseId: id },
      });
    }

    // Save new media
    const mediaData = [
      ...videos.map((v) => ({
        exerciseId: id,
        type: 'video' as const,
        url: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl,
        title: v.title,
        isAlternative: false,
      })),
      ...images.map((i) => ({
        exerciseId: id,
        type: 'image' as const,
        url: i.url,
        thumbnailUrl: i.thumbnailUrl,
        title: i.title,
        isAlternative: false,
      })),
    ];

    if (mediaData.length > 0) {
      await prisma.exerciseMedia.createMany({
        data: mediaData,
      });
    }

    // Fetch and return the saved media
    const savedMedia = await prisma.exerciseMedia.findMany({
      where: { exerciseId: id },
    });

    return NextResponse.json(savedMedia);
  } catch (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }
}
