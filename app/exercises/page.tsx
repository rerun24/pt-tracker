'use client';

import { useEffect, useState } from 'react';
import ExerciseCard from '@/components/ExerciseCard';
import ExerciseForm from '@/components/ExerciseForm';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  frequencyPerWeek: number;
}

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const fetchExercises = async () => {
    try {
      const response = await fetch('/api/exercises');
      if (response.ok) {
        const data = await response.json();
        setExercises(data);
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleCreate = async (data: Omit<Exercise, 'id'>) => {
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setShowForm(false);
        fetchExercises();
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
    }
  };

  const handleUpdate = async (data: Omit<Exercise, 'id'>) => {
    if (!editingExercise) return;
    try {
      const response = await fetch(`/api/exercises/${editingExercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        setEditingExercise(null);
        fetchExercises();
      }
    } catch (error) {
      console.error('Error updating exercise:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchExercises();
      }
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Exercises</h1>
        {!showForm && !editingExercise && (
          <Button onClick={() => setShowForm(true)}>Add Exercise</Button>
        )}
      </div>

      {(showForm || editingExercise) && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingExercise ? 'Edit Exercise' : 'New Exercise'}
          </h2>
          <ExerciseForm
            exercise={editingExercise || undefined}
            onSubmit={editingExercise ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingExercise(null);
            }}
          />
        </Card>
      )}

      {exercises.length === 0 ? (
        <Card>
          <p className="text-gray-500 text-center py-8">
            No exercises yet. Add your first exercise to get started!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={() => setEditingExercise(exercise)}
              onDelete={() => handleDelete(exercise.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
