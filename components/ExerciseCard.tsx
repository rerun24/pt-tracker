'use client';

import { useState } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import MediaModal from './MediaModal';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  frequencyPerWeek: number;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
}: ExerciseCardProps) {
  const [showMedia, setShowMedia] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <>
      <Card className="flex items-center justify-between">
        <div
          className="flex-1 cursor-pointer"
          onClick={() => setShowMedia(true)}
        >
          <h3 className="font-semibold text-lg">{exercise.name}</h3>
          <p className="text-gray-600 text-sm mt-1">
            {exercise.sets} sets x {exercise.reps} reps &middot;{' '}
            {exercise.frequencyPerWeek}x per week
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button variant="secondary" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant={confirmDelete ? 'danger' : 'secondary'}
            size="sm"
            onClick={handleDelete}
          >
            {confirmDelete ? 'Confirm' : 'Delete'}
          </Button>
        </div>
      </Card>

      <MediaModal
        isOpen={showMedia}
        onClose={() => setShowMedia(false)}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
      />
    </>
  );
}
