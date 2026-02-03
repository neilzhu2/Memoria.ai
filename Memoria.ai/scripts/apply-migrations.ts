/**
 * Migration Runner Script
 * Applies pending database migrations to Supabase
 *
 * Usage: npx ts-node scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('ERROR: Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyMigration(migrationPath: string, migrationName: string) {
  console.log(`\n📦 Applying migration: ${migrationName}`);
  console.log(`   Path: ${migrationPath}`);

  try {
    // Read the SQL file
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`   SQL length: ${sql.length} characters`);
    console.log(`   Starting execution...`);

    // Execute the SQL via Supabase RPC
    // Note: This requires the SQL to be executed in the Supabase Dashboard SQL Editor
    // or via the service_role key, which we don't have here.

    console.log('\n⚠️  IMPORTANT: This migration must be run manually in Supabase Dashboard');
    console.log('   Please follow these steps:');
    console.log('   1. Go to https://tnjwogrzvnzxdvlqmqsq.supabase.co/project/_/sql');
    console.log(`   2. Copy the contents of: ${migrationPath}`);
    console.log('   3. Paste into the SQL Editor');
    console.log('   4. Click "Run" to execute');
    console.log('');

    return { success: false, requiresManualExecution: true };
  } catch (error) {
    console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, error };
  }
}

async function main() {
  console.log('🚀 Memoria.ai Database Migration Runner');
  console.log('=====================================\n');

  const migrationsDir = path.join(__dirname, '../supabase/migrations');

  const migrations = [
    {
      path: path.join(migrationsDir, 'create_topics_system.sql'),
      name: 'create_topics_system',
      description: 'Creates topic categories, recording topics, and user history tables',
    },
    {
      path: path.join(migrationsDir, 'add_topic_to_memories.sql'),
      name: 'add_topic_to_memories',
      description: 'Adds topic_id column to memories table with foreign key',
    },
  ];

  console.log(`Found ${migrations.length} migrations to apply:\n`);

  for (const migration of migrations) {
    console.log(`• ${migration.name}`);
    console.log(`  ${migration.description}\n`);
  }

  console.log('\n⚠️  MANUAL MIGRATION REQUIRED');
  console.log('=====================================');
  console.log('These migrations require admin privileges and must be executed manually.');
  console.log('');
  console.log('Please follow these steps:');
  console.log('');
  console.log('1. Open Supabase SQL Editor:');
  console.log('   https://tnjwogrzvnzxdvlqmqsq.supabase.co/project/_/sql');
  console.log('');
  console.log('2. Run migrations in this order:');
  console.log('');

  migrations.forEach((migration, index) => {
    console.log(`   ${index + 1}. ${migration.name}`);
    console.log(`      File: ${migration.path}`);
    console.log(`      Description: ${migration.description}`);
    console.log('');
  });

  console.log('3. After running both migrations, restart your Expo app');
  console.log('');
  console.log('📋 Migration file contents are ready to copy from:');
  console.log(`   ${migrationsDir}`);
  console.log('');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
