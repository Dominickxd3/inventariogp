import { query } from "./backend/src/config/db.js";

async function main() {
  try {
    const r1 = await query('InventarioGP', 'SELECT TOP 5 * FROM Tab_EQ_TiposEquipo');
    console.log('TiposEquipo:', r1.recordset.length);
    r1.recordset.forEach(r => console.log(' ', r.IdTipoEquipo, r.DesTipodeEquipo));

    const r2 = await query('InventarioGP', 'SELECT TOP 10 * FROM Tab_EQ_CaracteristicasEquipo');
    console.log('CaracteristicasEquipo:', r2.recordset.length);
    r2.recordset.forEach(r => console.log(' ', r.IdMaeEquipo, r.Clave, '=', r.Valor?.slice(0,30)));

    try {
      const r3 = await query('InventarioGP', 'SELECT TOP 5 * FROM Tab_EQ_PlantillaCaracteristicas');
      console.log('PlantillaCaracteristicas:', r3.recordset.length);
      r3.recordset.forEach(r => console.log(' ', JSON.stringify(r)));
    } catch(e) {
      console.log('PlantillaCaracteristicas: NO EXISTE');
    }
  } catch(e) {
    console.log('ERROR:', e.message);
  } finally {
    process.exit(0);
  }
}
main();
