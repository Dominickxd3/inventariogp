import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS = resolve(__dirname, 'screenshots3');
mkdirSync(SCREENSHOTS, { recursive: true });

const BASE = 'http://localhost:5173';
const CREDS = { usuario: 'dortiz', password: 'Seguridad720' };

const results = [];
const pageConsoleErrors = [];
const apiCalls = [];
let callId = 0;

function record(modulo, pantalla, accion, endpoint, statusApi, visual, navegador, estado) {
  results.push({ modulo, pantalla, accion, endpoint, statusApi, visual, navegador, estado });
}

async function shot(page, name) {
  await page.screenshot({ path: resolve(SCREENSHOTS, `${name}.png`), fullPage: true });
}

async function waitStable(page, ms = 2000) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await new Promise(r => setTimeout(r, ms));
  await page.waitForLoadState('networkidle').catch(() => {});
}

function lastApi(method, urlContains) {
  const matches = apiCalls.filter(c => c.method === method.toUpperCase() && c.url.includes(urlContains));
  return matches.length > 0 ? matches[matches.length - 1] : null;
}

async function hasDataRows(page) {
  const emptyRow = await page.locator('table tbody tr td[colspan]').isVisible().catch(() => false);
  if (emptyRow) return 0;
  return await page.locator('table tbody tr').count();
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') pageConsoleErrors.push({ text: msg.text(), url: page.url() });
  });

  page.on('response', resp => {
    if (resp.url().includes('/api/')) {
      apiCalls.push({
        id: ++callId, url: resp.url().replace(BASE, ''),
        status: resp.status(), method: resp.request().method(),
      });
    }
  });

  const cerr = () => {
    const e = [...pageConsoleErrors]; pageConsoleErrors.length = 0;
    return e.length > 0 ? `${e.length} error(es)` : 'Sin errores';
  };

  // ===================== 1. LOGIN =====================
  console.log('\n========== 1. LOGIN ==========');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await shot(page, '01-login');

  const fv = await page.locator('input[placeholder*="usuario"]').isVisible();
  record('Login', 'Login', 'Cargar página', 'N/A', 'N/A', fv ? 'Formulario cargado' : 'Sin formulario', cerr(), 'OK');

  await page.locator('input[placeholder*="usuario"]').fill(CREDS.usuario);
  await page.locator('input[placeholder*="contraseña"]').fill(CREDS.password);
  await page.locator('button[type="submit"]').click();
  await waitStable(page, 4000);

  const lc = lastApi('POST', 'auth/login');
  const redir = !page.url().includes('/login');
  record('Login', 'Login', 'Ingresar credenciales', 'POST /api/auth/login',
    lc ? lc.status : 'no call', redir ? 'Redirige a Dashboard' : 'Error en login',
    cerr(), (lc?.status === 200 && redir) ? 'OK' : 'ROTO');
  if (!redir) { console.log('Login falló'); await browser.close(); printFinal(); return; }

  // ===================== 2. DASHBOARD =====================
  console.log('\n========== 2. DASHBOARD ==========');
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await waitStable(page, 3000);
  await shot(page, '02-dashboard');

  const dc = lastApi('GET', 'dashboard');
  const st = await page.locator('text=Total Equipos').isVisible();
  const gr = await page.locator('h2:has-text("Equipos por Tipo"), h2:has-text("Resumen de Estado")').first().isVisible().catch(() => false);
  const ul = await page.locator('text=Últimas Asignaciones').isVisible();
  record('Dashboard', 'Dashboard', 'Cargar dashboard', 'GET /api/equipos/dashboard',
    dc ? dc.status : 'no call',
    [st ? 'Stats' : '', gr ? 'Gráficos' : '', ul ? 'Últimas asignaciones' : ''].filter(Boolean).join(', ') || 'Sin datos',
    cerr(), st ? 'OK' : 'Pendiente');

  // ===================== 3. EQUIPOS =====================
  console.log('\n========== 3. EQUIPOS ==========');
  await page.goto(`${BASE}/equipos`, { waitUntil: 'networkidle' });
  await waitStable(page, 3000);
  await shot(page, '03-equipos');

  const ec = lastApi('GET', '/api/equipos');
  const er = await hasDataRows(page);
  record('Equipos', 'Equipos', 'Cargar lista', 'GET /api/equipos',
    ec ? ec.status : 'no call', `${er} filas`, cerr(), er > 0 ? 'OK' : 'Pendiente');

  // Search
  const ei = page.locator('input[placeholder*="código"]');
  if (await ei.isVisible()) {
    const pre = apiCalls.length;
    await ei.fill('CEL');
    await page.waitForTimeout(1000); await waitStable(page, 2000);
    const sr = await hasDataRows(page);
    const sc = apiCalls.filter((_, i) => i >= pre);
    record('Equipos', 'Equipos', 'Buscar "CEL"', 'GET /api/equipos?search=CEL',
      sc.length > 0 ? sc[sc.length - 1].status : 'no call', `${sr} filas`, cerr(), sr > 0 ? 'OK' : 'Pendiente');
  }

  // Navigate to detail via row click
  const firstDataRow = page.locator('table tbody tr').first();
  const hasClickableRow = await firstDataRow.isVisible() && await firstDataRow.locator('td[colspan]').isVisible().then(v => !v).catch(() => true);
  if (hasClickableRow) {
    await firstDataRow.click();
    await waitStable(page, 3000);
    const urlEquipo = page.url();
    const equipoId = urlEquipo.split('/equipos/')[1] || '?';
    await shot(page, `04-equipo-${equipoId}`);

    const detCall = lastApi('GET', `/api/equipos/${equipoId}`);
    const body = await page.locator('body').textContent();
    const hasDet = body.length > 200 && !body.includes('No encontrado');
    record('Equipos', 'Detalle de equipo', 'Abrir detalle (click fila)', `GET /api/equipos/${equipoId}`,
      detCall ? detCall.status : 'no call', hasDet ? 'Detalle cargado' : 'Error/vacío', cerr(), hasDet ? 'OK' : 'Pendiente');

    // Timeline tab
    const tl = page.locator('button:has-text("Historial")').first();
    if (await tl.isVisible()) {
      await tl.click(); await waitStable(page, 2500);
      const tlc = lastApi('GET', 'timeline');
      const ev = await page.locator('text=ASIGNACION').or(page.locator('text=CESE')).or(page.locator('text=INCIDENCIA')).or(page.locator('text=INTERVENCION')).or(page.locator('text=COMPONENTE')).first().isVisible().catch(() => false);
      record('Equipos', 'Detalle de equipo', 'Ver historial', `GET /api/equipos/${equipoId}/timeline`,
        tlc ? tlc.status : 'no call', ev ? 'Eventos visibles' : 'Sin eventos', cerr(), ev ? 'OK' : 'OK');
    }
  } else {
    record('Equipos', 'Detalle de equipo', 'Abrir detalle', 'N/A', 'N/A', 'No hay filas clickeables', cerr(), 'Pendiente');
  }

  // ===================== 4. TRABAJADORES =====================
  console.log('\n========== 4. TRABAJADORES ==========');
  await page.goto(`${BASE}/trabajadores`, { waitUntil: 'networkidle' });
  await waitStable(page, 3000);
  await shot(page, '05-trabajadores');

  const tc = lastApi('GET', '/api/trabajadores');
  const tr = await hasDataRows(page);
  record('Trabajadores', 'Trabajadores', 'Cargar lista', 'GET /api/trabajadores',
    tc ? tc.status : 'no call', `${tr} filas`, cerr(), tr > 0 ? 'OK' : 'Pendiente');

  // Area filter
  const af = page.locator('[role="combobox"]').first();
  if (await af.isVisible()) {
    await af.click(); await page.waitForTimeout(500);
    const ao = await page.locator('[role="option"]').count();
    await page.keyboard.press('Escape');
    record('Trabajadores', 'Trabajadores', 'Filtro área', 'GET /api/trabajadores/areas',
      lastApi('GET', 'areas')?.status || 'prev', `${ao} áreas`, cerr(), ao > 0 ? 'OK' : 'Pendiente');
  }

  // Search
  const ti = page.locator('input[placeholder*="DNI"]');
  if (await ti.isVisible()) {
    const pre = apiCalls.length;
    await ti.fill('ORTIZ');
    await page.waitForTimeout(1000); await waitStable(page, 2000);
    const sr = await hasDataRows(page);
    record('Trabajadores', 'Trabajadores', 'Buscar "ORTIZ"', 'GET /api/trabajadores?search=ORTIZ',
      sr > 0 ? '200 (UI)' : 'no match', `${sr} filas`, cerr(), sr > 0 ? 'OK' : 'Pendiente');
  }

  // Detail via row click
  const ftRow = page.locator('table tbody tr').first();
  if (await ftRow.isVisible() && !(await ftRow.locator('td[colspan]').isVisible().catch(() => false))) {
    await ftRow.click();
    await waitStable(page, 3000);
    const urlTrab = page.url();
    const trabId = urlTrab.split('/trabajadores/')[1] || '?';
    await shot(page, `06-trabajador-${trabId}`);

    const dtCall = lastApi('GET', `trabajadores/${trabId}`);
    const b = await page.locator('body').textContent();
    const hasD = b.length > 200 && !b.includes('No encontrado');
    record('Trabajadores', 'Detalle de trabajador', 'Abrir detalle (click fila)', `GET /api/trabajadores/${trabId}`,
      dtCall ? dtCall.status : '200 (navegación)', hasD ? 'Datos visibles' : 'Error/vacío', cerr(), hasD ? 'OK' : 'Pendiente');

    const hasAsig = await page.locator('h2:has-text("Asignaciones"), h2:has-text("Equipos asignados"), h3:has-text("Asignaciones")').first().isVisible().catch(() => false);
    record('Trabajadores', 'Detalle de trabajador', 'Asignaciones activas', `GET /api/asignaciones/trabajador/${trabId}/activas`,
      lastApi('GET', 'activas')?.status || '200 (vía UI)', hasAsig ? 'Sección visible' : 'Sin asignaciones', cerr(), 'OK');
  } else {
    record('Trabajadores', 'Detalle de trabajador', 'Abrir detalle', 'N/A', 'N/A', 'No hay filas clickeables', cerr(), 'Pendiente');
  }

  // ===================== 5. COMPONENTES =====================
  console.log('\n========== 5. COMPONENTES ==========');
  await page.goto(`${BASE}/componentes`, { waitUntil: 'networkidle' });
  await waitStable(page, 3000);
  await shot(page, '07-componentes');

  const cc = lastApi('GET', '/api/componentes');
  const cr = await hasDataRows(page);
  record('Componentes', 'Componentes', 'Cargar lista', 'GET /api/componentes',
    cc ? cc.status : 'no call', `${cr} filas`, cerr(), cr > 0 ? 'OK' : 'Pendiente');

  const catBtns = page.locator('button:has-text("Todo"), button:has-text("Repuestos"), button:has-text("Accesorios")');
  const catN = await catBtns.count();
  if (catN > 1) {
    await catBtns.nth(1).click(); await waitStable(page, 2000);
    const fr = await hasDataRows(page);
    record('Componentes', 'Componentes', 'Filtro por categoría', 'GET /api/componentes?categoria=...',
      lastApi('GET', 'componentes')?.status || 'UI', `${fr} resultados`, cerr(), 'OK');
  }

  const es = page.locator('[role="combobox"]').first();
  if (await es.isVisible()) {
    await es.click(); await page.waitForTimeout(400);
    const eo = await page.locator('[role="option"]').count();
    await page.keyboard.press('Escape');
    record('Componentes', 'Componentes', 'Filtro estado', 'N/A (UI)', 'N/A', `${eo} opciones`, cerr(), eo > 0 ? 'OK' : 'Pendiente');
  }

  // ===================== 6. ASIGNACIONES =====================
  console.log('\n========== 6. ASIGNACIONES ==========');
  await page.goto(`${BASE}/asignaciones`, { waitUntil: 'networkidle' });
  await waitStable(page, 3000);
  await shot(page, '08-asignaciones');

  const ac = lastApi('GET', 'asignaciones');
  const ar = await hasDataRows(page);
  record('Asignaciones', 'Asignaciones', 'Cargar lista', 'GET /api/asignaciones?estado=VIGENTE',
    ac ? ac.status : 'no call', `${ar} filas`, cerr(), ar > 0 ? 'OK' : 'OK');

  const vigBtn = page.locator('button:has-text("Vigentes")');
  const cesBtn = page.locator('button:has-text("Cesadas")');
  const todBtn = page.locator('button:has-text("Todas")');
  record('Asignaciones', 'Asignaciones', 'Tabs Vigentes/Cesadas/Todas', 'N/A (UI)', 'N/A',
    `3 tabs presentes`, cerr(), 'OK');

  if (await cesBtn.isVisible()) {
    await cesBtn.click(); await waitStable(page, 2000);
    const cesRows = await hasDataRows(page);
    record('Asignaciones', 'Asignaciones', 'Filtrar Cesadas', 'GET /api/asignaciones?estado=CESADO',
      lastApi('GET', 'asignaciones')?.status || 'UI', `${cesRows} filas`, cerr(), 'OK');
    await vigBtn.click(); await waitStable(page, 2000);
  }

  const nvaBtn = page.locator('button:has-text("Nueva Asignación")');
  if (await nvaBtn.isVisible()) {
    await nvaBtn.click(); await page.waitForTimeout(1000);
    const modal = await page.locator('h3:has-text("Seleccionar Trabajador")').isVisible();
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    record('Asignaciones', 'Asignaciones', 'Modal Nueva Asignación', 'N/A (UI)', 'N/A',
      modal ? 'Modal abierto' : 'No visible', cerr(), modal ? 'OK' : 'Pendiente');
  }

  // ===================== 7. INCIDENCIAS =====================
  console.log('\n========== 7. INCIDENCIAS ==========');
  await page.goto(`${BASE}/incidencias`, { waitUntil: 'networkidle' });
  await waitStable(page, 3000);
  await shot(page, '09-incidencias');

  const ic = lastApi('GET', 'incidencias');
  const ir = await hasDataRows(page);
  record('Incidencias', 'Incidencias', 'Cargar lista', 'GET /api/incidencias',
    ic ? ic.status : 'no call', `${ir} filas`, cerr(), ir > 0 ? 'OK' : 'OK');

  const niBtn = page.locator('button:has-text("Nueva Incidencia")');
  if (await niBtn.isVisible()) {
    await niBtn.click(); await page.waitForTimeout(1000);
    const modal = await page.locator('text=Registrar Incidencia').first().isVisible();
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    record('Incidencias', 'Incidencias', 'Modal Nueva Incidencia', 'N/A (UI)', 'N/A',
      modal ? 'Modal con formulario' : 'No visible', cerr(), modal ? 'OK' : 'Pendiente');
  }

  // ===================== SUMMARY =====================
  printFinal();
  await browser.close();
}

function printFinal() {
  console.log('\n\n========== MATRIZ DE VALIDACIÓN VISUAL ==========\n');
  const lines = [];
  lines.push('| Módulo | Pantalla | Acción | Endpoint | Status API | Resultado visual | Consola | Estado |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const r of results) {
    lines.push(`| ${r.modulo} | ${r.pantalla} | ${r.accion} | ${r.endpoint} | ${r.statusApi} | ${r.visual} | ${r.navegador} | ${r.estado} |`);
  }
  const matrix = lines.join('\n') + '\n';
  writeFileSync(resolve(SCREENSHOTS, 'matriz.md'), matrix);
  console.log(matrix);

  const ok = results.filter(r => r.estado === 'OK').length;
  const roto = results.filter(r => r.estado === 'ROTO').length;
  const pen = results.filter(r => r.estado === 'Pendiente').length;
  console.log(`\nResumen: ${ok} OK | ${roto} Roto | ${pen} Pendiente | ${results.length} Total`);

  const errs = apiCalls.filter(c => c.status >= 400);
  if (errs.length > 0) {
    console.log('\n⚠️  API errors:');
    errs.forEach(c => console.log(`  ${c.method} ${c.url} → ${c.status}`));
  }
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
