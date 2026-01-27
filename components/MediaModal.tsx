'use client';

import { useEffect, useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
}

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
}

export default function MediaModal({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
}: MediaModalProps) {
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMedia = async (refresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const url = refresh
        ? `/api/exercises/${exerciseId}/media?refresh=true`
        : `/api/exercises/${exerciseId}/media`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch media');
      const data = await response.json();
      setMedia(data);
    } catch {
      setError('Failed to load media. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, exerciseId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={exerciseName}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Videos and images for this exercise
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchMedia(true)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {loading && media.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : media.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No media found. Click Refresh to search.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Videos */}
            {media.filter((m) => m.type === 'video').length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Videos</h3>
                <div className="grid gap-3">
                  {media
                    .filter((m) => m.type === 'video')
                    .map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition"
                      >
                        {item.thumbnailUrl && (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title || 'Video thumbnail'}
                            className="w-32 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.title || 'Video'}
                          </p>
                          <p className="text-sm text-gray-500">YouTube</p>
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            )}

            {/* Images */}
            {media.filter((m) => m.type === 'image').length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Images</h3>
                <div className="grid grid-cols-3 gap-3">
                  {media
                    .filter((m) => m.type === 'image')
                    .map((item) => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-square rounded-lg overflow-hidden hover:opacity-90 transition"
                      >
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.title || 'Exercise image'}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
