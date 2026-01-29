const { execSync, spawn } = require('child_process');

// Skip migrations if using connection pooler (they should be run manually)
const skipMigrations = process.env.DATABASE_URL?.includes('pooler.supabase.com');

if (skipMigrations) {
  console.log('Using connection pooler - skipping auto-migrations.');
  console.log('Run migrations manually with direct connection if needed.');
} else {
  console.log('Running database migrations...');
  try {
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: process.env,
      timeout: 30000 // 30 second timeout
    });
    console.log('Database migrations complete.');
  } catch (error) {
    console.error('Database migration failed, but continuing startup:', error.message);
  }
}

console.log('Starting Next.js server...');
spawn('npm', ['run', 'start:server'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});
