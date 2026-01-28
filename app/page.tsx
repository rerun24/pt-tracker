'use client';

import { useEffect, useState, useCallback } from 'react';
import DailyChecklist from '@/components/DailyChecklist';
import Button from '@/components/ui/Button';
import { getLocalDateString, addDays } from '@/lib/date';

interface ExerciseLog {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  setsCompleted: number;
  completed: boolean;
}

export default function HomePage() {
  const [date, setDate] = useState(() => getLocalDateString());
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logs?date=${date}`);
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleUpdateLog = async (
    exerciseId: string,
    setsCompleted: number,
    completed: boolean
  ) => {
    // Optimistic update
    setExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId ? { ...e, setsCompleted, completed } : e
      )
    );

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, exerciseId, setsCompleted, completed }),
      });
    } catch (error) {
      console.error('Error updating log:', error);
      // Revert on error
      fetchLogs();
    }
  };

  const goToDay = (offset: number) => {
    setDate(addDays(date, offset));
  };

  const isToday = date === getLocalDateString();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Button variant="secondary" size="sm" onClick={() => goToDay(-1)}>
          Previous Day
        </Button>
        {!isToday && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDate(getLocalDateString())}
          >
            Today
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => goToDay(1)}>
          Next Day
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : (
        <DailyChecklist
          date={date}
          exercises={exercises}
          onUpdateLog={handleUpdateLog}
        />
      )}
    </div>
  );
}
