const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function runSeeder() {
  try {
    console.log('Running database seeder...');
    
    // First, clear all existing data thoroughly
    console.log('Clearing existing data...');
    try {
      await pool.query('DROP SCHEMA public CASCADE;');
    } catch (e) {
      console.log('Schema drop not needed (first run)');
    }
    await pool.query('CREATE SCHEMA public;');
    await pool.query('GRANT ALL ON SCHEMA public TO postgres;');
    await pool.query('GRANT ALL ON SCHEMA public TO public;');
    console.log('✓ Database cleared successfully');
    
    // Wait for schema to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Read and execute schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    await pool.query(schemaSQL);
    console.log('✓ Schema created successfully');
    
    // Wait for schema to be fully ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Read and execute seed data line by line to avoid syntax issues
    const seedSQL = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');
    const lines = seedSQL.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Skip empty lines and comments
      if (trimmedLine.length === 0 || trimmedLine.startsWith('--')) continue;
      
      // Only execute INSERT statements
      if (trimmedLine.startsWith('INSERT')) {
        try {
          await pool.query(trimmedLine);
          console.log(`✓ Executed: ${trimmedLine.substring(0, 60)}...`);
        } catch (err) {
          console.error('Error executing statement:', trimmedLine.substring(0, 100) + '...');
          throw err;
        }
      }
    }
    
    console.log('✓ Seed data inserted successfully');
    
    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

runSeeder();