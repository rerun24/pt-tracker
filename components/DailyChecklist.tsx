'use client';

import { useState } from 'react';
import Card from './ui/Card';
import MediaModal from './MediaModal';

interface ExerciseLog {
  id: string;
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  setsCompleted: number;
  completed: boolean;
}

interface DailyChecklistProps {
  date: string;
  exercises: ExerciseLog[];
  onUpdateLog: (
    exerciseId: string,
    setsCompleted: number,
    completed: boolean
  ) => Promise<void>;
}

export default function DailyChecklist({
  date,
  exercises,
  onUpdateLog,
}: DailyChecklistProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [mediaExercise, setMediaExercise] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleSetToggle = async (exercise: ExerciseLog, setIndex: number) => {
    setUpdating(exercise.exerciseId);
    try {
      const isCurrentlyCompleted = setIndex < exercise.setsCompleted;
      const newSetsCompleted = isCurrentlyCompleted
        ? setIndex
        : setIndex + 1;
      const completed = newSetsCompleted >= exercise.sets;
      await onUpdateLog(exercise.exerciseId, newSetsCompleted, completed);
    } finally {
      setUpdating(null);
    }
  };

  const totalSets = exercises.reduce((sum, e) => sum + e.sets, 0);
  const completedSets = exercises.reduce((sum, e) => sum + e.setsCompleted, 0);
  const progressPercent = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{formatDate(date)}</h2>
        <span className="text-lg font-medium text-primary-600">
          {Math.round(progressPercent)}% Complete
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-primary-600 h-3 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {exercises.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">
            No exercises scheduled for today. Add some exercises to get started!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <Card
              key={exercise.exerciseId}
              padding="sm"
              className={exercise.completed ? 'bg-green-50 border-green-200' : ''}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() =>
                    setMediaExercise({
                      id: exercise.exerciseId,
                      name: exercise.name,
                    })
                  }
                >
                  <h3
                    className={`font-medium ${
                      exercise.completed ? 'text-green-700' : ''
                    }`}
                  >
                    {exercise.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {exercise.sets} sets x {exercise.reps} reps
                  </p>
                </div>

                <div className="flex gap-2">
                  {Array.from({ length: exercise.sets }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleSetToggle(exercise, index)}
                      disabled={updating === exercise.exerciseId}
                      className={`w-10 h-10 rounded-lg border-2 font-medium transition ${
                        index < exercise.setsCompleted
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-primary-400'
                      } ${
                        updating === exercise.exerciseId
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {mediaExercise && (
        <MediaModal
          isOpen={true}
          onClose={() => setMediaExercise(null)}
          exerciseId={mediaExercise.id}
          exerciseName={mediaExercise.name}
        />
      )}
    </div>
  );
}
