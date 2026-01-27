# PT Tracker

A web app for tracking physical therapy exercises with daily checklists, progress charts, exercise media lookup, and email reminders.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Media APIs**: YouTube Data API v3, Unsplash API
- **Email**: Resend
- **Charts**: Recharts
- **Deployment**: Render

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```

3. Set up the database:
   ```bash
   npx prisma db push
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `APP_PASSWORD` | Password to access the app |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `UNSPLASH_ACCESS_KEY` | Unsplash API access key |
| `RESEND_API_KEY` | Resend API key for emails |
| `CRON_SECRET` | Secret for authenticating cron requests |

## Deployment to Render

1. Push your code to GitHub
2. Connect your repo to Render
3. Render will use `render.yaml` to set up the web service and database
4. Configure environment variables in Render dashboard:
   - `APP_PASSWORD`: Choose a secure password
   - `YOUTUBE_API_KEY`: From Google Cloud Console
   - `UNSPLASH_ACCESS_KEY`: From Unsplash Developer
   - `RESEND_API_KEY`: From Resend dashboard

## Email Reminders Setup

1. Create account at [resend.com](https://resend.com)
2. Verify your email address in Settings > Emails
3. Note: Free tier only sends to verified emails

### External Cron (cron-job.org)

Since Render's free tier doesn't include cron, use [cron-job.org](https://cron-job.org) (free):

1. Create an account
2. Add a new cron job:
   - URL: `https://your-app.onrender.com/api/cron`
   - Method: POST
   - Schedule: `0 * * * *` (every hour)
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

The app checks the configured reminder time and only sends emails when it matches.

## Features

- **Daily Checklist**: Track exercise completion with clickable set buttons
- **Exercise Management**: Add, edit, delete exercises with sets/reps/frequency
- **Media Lookup**: View YouTube videos and images for each exercise
- **Progress Charts**: Weekly completion rates and streaks
- **Email Reminders**: Daily reminders for scheduled exercises
