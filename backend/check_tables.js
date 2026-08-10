import { query } from './src/config/db.js';

try {
  const tables = await query('InventarioGP', "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
  console.log('Tables in InventarioGP:');
  if (tables.length === 0) {
    console.log('  (none)');
  } else {
    tables.forEach(t => console.log('  ' + t.TABLE_NAME));
  }
} catch(e) {
  console.log('Error:', e.message);
}
