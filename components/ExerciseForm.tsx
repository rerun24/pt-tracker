'use client';

import { useState } from 'react';
import Button from './ui/Button';
import Input from './ui/Input';

interface Exercise {
  id?: string;
  name: string;
  sets: number;
  reps: number;
  frequencyPerWeek: number;
}

interface ExerciseFormProps {
  exercise?: Exercise;
  onSubmit: (data: Omit<Exercise, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export default function ExerciseForm({
  exercise,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const [name, setName] = useState(exercise?.name || '');
  const [sets, setSets] = useState(exercise?.sets || 3);
  const [reps, setReps] = useState(exercise?.reps || 10);
  const [frequencyPerWeek, setFrequencyPerWeek] = useState(
    exercise?.frequencyPerWeek || 7
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ name, sets, reps, frequencyPerWeek });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="name"
        label="Exercise Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Hip Flexor Stretch"
        required
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          id="sets"
          label="Sets"
          type="number"
          min={1}
          max={20}
          value={sets}
          onChange={(e) => setSets(parseInt(e.target.value) || 1)}
          required
        />
        <Input
          id="reps"
          label="Reps"
          type="number"
          min={1}
          max={100}
          value={reps}
          onChange={(e) => setReps(parseInt(e.target.value) || 1)}
          required
        />
        <Input
          id="frequency"
          label="Days/Week"
          type="number"
          min={1}
          max={7}
          value={frequencyPerWeek}
          onChange={(e) => setFrequencyPerWeek(parseInt(e.target.value) || 1)}
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : exercise ? 'Update' : 'Add Exercise'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
