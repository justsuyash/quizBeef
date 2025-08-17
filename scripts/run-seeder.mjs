import { execSync } from 'child_process';

try {
  console.log('🚀 Starting database seeder...');
  
  // Run with tsx which handles TypeScript + ESM better
  execSync('npx tsx scripts/advanced-seeder.ts', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Seeding completed successfully!');
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}

