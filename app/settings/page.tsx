'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ReminderSettings {
  id: string;
  email: string;
  time: string;
  enabled: boolean;
  timezone: string;
}

const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/reminders');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings?.email) {
      setMessage({ type: 'error', text: 'Please enter an email address first.' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test email sent!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to send test email.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred.' });
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <h2 className="font-semibold text-lg mb-4">Email Reminders</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Reminders</p>
              <p className="text-sm text-gray-500">
                Receive daily email reminders for your exercises
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings?.enabled || false}
                onChange={(e) =>
                  setSettings((prev) =>
                    prev ? { ...prev, enabled: e.target.checked } : null
                  )
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <Input
            id="email"
            label="Email Address"
            type="email"
            value={settings?.email || ''}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, email: e.target.value } : null
              )
            }
            placeholder="your@email.com"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder Time
            </label>
            <input
              type="time"
              value={settings?.time || '08:30'}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, time: e.target.value } : null
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              value={settings?.timezone || 'America/Los_Angeles'}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, timezone: e.target.value } : null
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="secondary" onClick={handleTestEmail} disabled={saving}>
              Send Test Email
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-semibold text-lg mb-4">External Cron Setup</h2>
        <p className="text-gray-600 text-sm mb-4">
          To enable daily reminders, set up a cron job at{' '}
          <a
            href="https://cron-job.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            cron-job.org
          </a>{' '}
          (free) with the following settings:
        </p>
        <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
          <li>
            URL: <code className="bg-gray-100 px-1 rounded">https://your-app.onrender.com/api/cron</code>
          </li>
          <li>Method: POST</li>
          <li>
            Schedule: Every hour (the app will check if it&apos;s time based on your settings)
          </li>
          <li>
            Header: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer YOUR_CRON_SECRET</code>
          </li>
        </ul>
      </Card>
    </div>
  );
}
