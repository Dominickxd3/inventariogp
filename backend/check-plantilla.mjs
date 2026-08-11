import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf8');
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=#\s]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

import { query, closeAll } from "./src/config/db.js";

const r = await query('InventarioGP', "SELECT * FROM Tab_EQ_PlantillaCaracteristicas WHERE Activo = 1 ORDER BY IdTipodeEquipo, Orden");
console.log("Registros:", r.recordset.length);
if (r.recordset.length === 0) {
  console.log("TABLA VACIA - no hay plantillas cargadas");
} else {
  r.recordset.forEach(x => console.log("  Tipo=" + x.IdTipodeEquipo + " | " + x.Clave + " (" + x.Etiqueta + ") Req=" + x.Requerido));
}
await closeAll();
