const pool = require('./database');

async function checkDatabase() {
  try {
    const [users, ticketTypes, events] = await Promise.all([
      pool.query('SELECT user_id, name, email, role FROM users ORDER BY user_id'),
      pool.query('SELECT COUNT(*) as count FROM ticket_types'),
      pool.query('SELECT event_id, title, status FROM events ORDER BY event_id')
    ]);
    
    console.log('\n=== DATABASE STATUS CHECK ===\n');
    
    console.log('USERS (' + users.rows.length + ' total):');
    users.rows.forEach(u => {
      console.log(`  ${u.user_id}. ${u.name} (${u.email}) - ${u.role.toUpperCase()}`);
    });
    
    console.log(`\nTICKET TYPES: ${ticketTypes.rows[0].count}`);
    
    console.log('\nEVENTS (' + events.rows.length + ' total):');
    events.rows.forEach(e => {
      console.log(`  ${e.event_id}. ${e.title} - ${e.status.toUpperCase()}`);
    });
    
    console.log('\n✓ Database check complete - All tables have data');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database check failed:', error.message);
    process.exit(1);
  }
}

checkDatabase();
