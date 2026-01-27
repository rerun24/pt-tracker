const { execSync } = require('child_process');

console.log('Running database migrations...');
try {
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: process.env
  });
  console.log('Database migrations complete.');
} catch (error) {
  console.error('Database migration failed, but continuing startup:', error.message);
}

console.log('Starting Next.js server...');
require('child_process').spawn('npm', ['run', 'start:server'], {
  stdio: 'inherit',
  env: process.env,
  shell: true
});
