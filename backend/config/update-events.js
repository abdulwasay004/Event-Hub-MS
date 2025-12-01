const pool = require('./database');

async function updateEvents() {
  try {
    await pool.query(`
      UPDATE events 
      SET start_date = '2025-12-20 14:00:00', 
          end_date = '2025-12-20 23:00:00', 
          status = 'active' 
      WHERE event_id = 1
    `);
    
    await pool.query(`
      UPDATE events 
      SET start_date = '2025-12-25 09:00:00', 
          end_date = '2025-12-25 17:00:00', 
          status = 'active' 
      WHERE event_id = 2
    `);
    
    await pool.query(`
      UPDATE events 
      SET start_date = '2026-01-10 07:00:00', 
          end_date = '2026-01-10 12:00:00', 
          status = 'active' 
      WHERE event_id = 3
    `);
    
    console.log('✓ Events updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating events:', error);
    process.exit(1);
  }
}

updateEvents();
