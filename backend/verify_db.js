import { query } from './src/config/db.js';

const tables = await query('InventarioGP', "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
console.log('Tables (' + tables.length + '):');
tables.forEach(t => console.log('  ' + t.TABLE_NAME));

const users = await query('InventarioGP', "SELECT IdUsuario, NombreUsuario, Rol FROM Tab_SYS_Usuarios");
console.log('\nUsers:');
users.forEach(u => console.log('  ' + u.IdUsuario + ' | ' + u.NombreUsuario + ' | ' + u.Rol));
