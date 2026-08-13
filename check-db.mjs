import dotenv from 'dotenv';
dotenv.config();
import { query, closeAll } from "./backend/src/config/db.js";

async function main() {
  try {
    const r = await query('InventarioGP', "SELECT * FROM Tab_EQ_PlantillaCaracteristicas WHERE Activo = 1 ORDER BY IdTipodeEquipo, Orden");
    console.log("Tab_EQ_PlantillaCaracteristicas:", r.recordset.length, "registros\n");
    if (r.recordset.length === 0) {
      console.log("TABLA VACIA - Se necesita llenar con la plantilla para cada tipo");
    } else {
      r.recordset.forEach(x => console.log(`  Tipo=${x.IdTipodeEquipo} | ${x.Clave} (${x.Etiqueta}) Req=${x.Requerido} Ord=${x.Orden}`));
    }
  } catch(e) {
    console.log("ERROR:", e.message);
  } finally {
    await closeAll();
    process.exit(0);
  }
}
main();
