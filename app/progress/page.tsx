'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import ProgressChart from '@/components/ProgressChart';
import { getLocalDateString } from '@/lib/date';

interface ChartDataPoint {
  date: string;
  completionRate: number;
  completed: number;
  total: number;
}

interface ExerciseStat {
  id: string;
  name: string;
  completed: number;
  expected: number;
  rate: number;
}

interface Stats {
  chartData: ChartDataPoint[];
  currentStreak: number;
  overallRate: number;
  totalCompleted: number;
  totalExpected: number;
  exerciseStats: ExerciseStat[];
}

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/stats?days=${days}&today=${getLocalDateString()}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [days]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <p className="text-gray-500 text-center py-8">
          Failed to load progress data.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm" className="text-center">
          <p className="text-3xl font-bold text-primary-600">
            {stats.currentStreak}
          </p>
          <p className="text-sm text-gray-600 mt-1">Day Streak</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-3xl font-bold text-primary-600">
            {stats.overallRate}%
          </p>
          <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-3xl font-bold text-primary-600">
            {stats.totalCompleted}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            of {stats.totalExpected} exercises
          </p>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <h2 className="font-semibold mb-4">Daily Completion Rate</h2>
        {stats.chartData.length > 0 ? (
          <ProgressChart data={stats.chartData} />
        ) : (
          <p className="text-gray-500 text-center py-8">
            No data available for this period.
          </p>
        )}
      </Card>

      {/* Exercise Breakdown */}
      {stats.exerciseStats.length > 0 && (
        <Card>
          <h2 className="font-semibold mb-4">Exercise Breakdown</h2>
          <div className="space-y-3">
            {stats.exerciseStats.map((exercise) => (
              <div key={exercise.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{exercise.name}</span>
                    <span className="text-sm text-gray-500">
                      {exercise.completed}/{exercise.expected} ({exercise.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${exercise.rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
