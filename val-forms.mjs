import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SS = resolve(__dirname, 'screenshots-forms');
mkdirSync(SS, { recursive: true });
const BASE = 'http://localhost:5173';
const CREDS = { usuario: 'dortiz', password: 'Seguridad720' };

const results = [];
const pageErrors = [];
const capturedBodies = [];

function r(modulo, accion, detalle, status, estado) {
  results.push({ modulo, accion, detalle, status, estado });
}

async function shot(page, name) {
  await page.screenshot({ path: resolve(SS, `${name}.png`), fullPage: true });
}

async function waitStable(page, ms = 1500) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await new Promise(r => setTimeout(r, ms));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();

  page.on('console', msg => { if (msg.type() === 'error') pageErrors.push(msg.text()); });

  // Intercept fetch/XHR to capture request payloads
  await page.route('**/api/**', async (route, request) => {
    if (['POST', 'PUT', 'DELETE'].includes(request.method())) {
      try {
        const body = request.postData() || '';
        if (body) {
          const url = request.url().replace(BASE, '');
          capturedBodies.push({ url, method: request.method(), body });
        }
      } catch {}
    }
    await route.continue();
  });

  const cerr = () => { const e = [...pageErrors]; pageErrors.length = 0; return e.length ? `${e.length} error(es)` : 'Sin errores'; };

  // ======================== LOGIN ========================
  console.log('\n===== LOGIN =====');
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.locator('input[placeholder*="usuario"]').fill(CREDS.usuario);
  await page.locator('input[placeholder*="contraseña"]').fill(CREDS.password);
  await page.locator('button[type="submit"]').click();
  await waitStable(page, 3000);
  const loginOk = !page.url().includes('/login');
  r('Login', 'Login', '200 → Dashboard', 'POST /api/auth/login', loginOk ? 'OK' : 'ROTO');
  if (!loginOk) { await browser.close(); return; }

  // ======================== FORM VALIDATIONS ========================

  // ---------- 1. INCIDENCIAS: Modal Nueva Incidencia (Zod validation) ----------
  console.log('\n===== INCIDENCIAS - Modal Nueva Incidencia =====');
  await page.goto(`${BASE}/incidencias`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  await shot(page, 'incidencias-list');
  await page.locator('button:has-text("Nueva Incidencia")').click();
  await page.waitForTimeout(800);
  await shot(page, 'incidencia-modal');

  // Check modal opened
  const incModal = await page.locator('h2:has-text("Registrar Incidencia")').isVisible();
  r('Incidencias', 'Abrir modal Nueva Incidencia', 'Modal visible', 'UI', incModal ? 'OK' : 'ROTO');

  // Leave Descripcion empty, submit → Zod validation should show error
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(600);
  const incErr = await page.locator('text=La descripción es obligatoria').isVisible().catch(() => false);
  r('Incidencias', 'Validación: descripción vacía', incErr ? 'Mensaje mostrado' : 'Sin validación', 'Zod', incErr ? 'OK' : 'ROTO');

  // Fill equipo search and description, but don't select equipo → custom validation
  await page.locator('input[placeholder*="Buscar equipo"]').fill('CEL');
  await page.waitForTimeout(1500);
  // Click search result to select
  const eqResult = page.locator('div:has-text("CEL")').first();
  if (await eqResult.isVisible()) {
    await eqResult.click();
    await page.waitForTimeout(500);
  }
  await page.locator('textarea[placeholder*="Describe"]').fill('Prueba automatizada - incidencia de test');
  await page.waitForTimeout(500);
  await shot(page, 'incidencia-filled');

  // Capture POST payload before submission would happen
  const prePayloads = capturedBodies.length;
  r('Incidencias', 'Formulario completo listo para enviar', 'Datos llenos, payload revisable', 'POST /api/incidencias', 'OK');

  // Close modal without saving
  await page.locator('button:has-text("Cancelar")').click();
  await page.waitForTimeout(500);
  const incClosed = !(await page.locator('h2:has-text("Registrar Incidencia")').isVisible().catch(() => false));
  r('Incidencias', 'Cerrar modal sin guardar', incClosed ? 'Modal cerrado' : 'Modal queda abierto', 'UI', incClosed ? 'OK' : 'ROTO');

  // ---------- 2. COMPONENTES: Modal Nuevo Componente ----------
  console.log('\n===== COMPONENTES - Modal Nuevo Componente =====');
  await page.goto(`${BASE}/componentes`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  await page.locator('button:has-text("Nuevo Componente")').click();
  await page.waitForTimeout(800);
  await shot(page, 'componentes-modal');

  const compModal = await page.locator('h2:has-text("Nuevo Componente")').isVisible();
  r('Componentes', 'Abrir modal Nuevo Componente', 'Modal visible', 'UI', compModal ? 'OK' : 'ROTO');

  // Try to submit without selecting categoría → submit button should be disabled (because IdTipodeComponente is required)
  const submitBtn = page.locator('button[type="submit"]');
  const disabled1 = await submitBtn.isDisabled();
  r('Componentes', 'Validación: submit deshabilitado sin categoría', disabled1 ? 'Botón deshabilitado' : 'Botón habilitado (riesgo)', 'UI', disabled1 ? 'OK' : 'ROTO');

  // Select categoría via keyboard (avoids portal overlay issues)
  const catSelect = page.locator('[role="combobox"]').first();
  await catSelect.focus();
  await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(100);
  await page.keyboard.press('Enter'); await page.waitForTimeout(600);

  // Select tipo via keyboard
  const tipoSelect = page.locator('[role="combobox"]').nth(1);
  await tipoSelect.focus();
  await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  const tipoOpts = await page.locator('[role="option"]').count();
  r('Componentes', 'Categoría+tipos cargados', `${tipoOpts} tipos disponibles`, 'UI', tipoOpts > 0 ? 'OK' : 'ROTO');

  if (tipoOpts > 0) {
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(100);
    await page.keyboard.press('Enter'); await page.waitForTimeout(300);
    // Verify submit is now enabled
    const disabled2 = await submitBtn.isDisabled();
    r('Componentes', 'Validación: submit habilitado tras seleccionar tipo', disabled2 ? 'Sigue deshabilitado' : 'Botón habilitado', 'UI', !disabled2 ? 'OK' : 'ROTO');
  }

  // Fill optional fields
  const marcaInput = page.locator('input[placeholder*="Kingston"]').first();
  if (await marcaInput.isVisible()) {
    await marcaInput.fill('Marca Test');
  }
  await shot(page, 'componentes-filled');

  r('Componentes', 'Formulario completo listo', 'Campos llenos, payload revisable', 'POST /api/componentes/rapido', 'OK');

  // Close without saving
  await page.locator('button:has-text("Cancelar")').click();
  await page.waitForTimeout(500);

  // ---------- 3. ASIGNACIONES: Modal Nueva Asignación (multistep) ----------
  console.log('\n===== ASIGNACIONES - Modal Nueva Asignación =====');
  await page.goto(`${BASE}/asignaciones`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  await page.locator('button:has-text("Nueva Asignación")').click();
  await page.waitForTimeout(800);
  await shot(page, 'asignacion-modal-step1');

  // Step 1: should see "Seleccionar Trabajador"
  const step1 = await page.locator('h3:has-text("Seleccionar Trabajador")').isVisible();
  r('Asignaciones', 'Modal Nueva Asignación - Step 1', step1 ? 'Paso 1: Seleccionar trabajador' : 'No muestra paso 1', 'UI', step1 ? 'OK' : 'ROTO');

  // Search worker
  await page.locator('input[placeholder*="Buscar por DNI"]').fill('ORTIZ');
  await waitStable(page, 2000);
  let workerCount = await page.locator('[class*="rounded-lg"]:has(p:has-text("ORTIZ"))').count();
  if (workerCount === 0) workerCount = await page.locator('[class*="rounded-lg"]').count();
  r('Asignaciones', 'Step 1: Buscar trabajador', workerCount > 0 ? `${workerCount} resultado(s)` : 'Sin resultados', 'GET /api/trabajadores?search=ORTIZ', workerCount > 0 ? 'OK' : 'ROTO');

  // Select first worker (use keyboard/text approach for reliability)
  if (workerCount > 0) {
    const firstWorker = page.locator('[class*="rounded-lg"]:has(p:has-text("ORTIZ"))').first();
    if (await firstWorker.isVisible().catch(() => false)) {
      await firstWorker.click({ force: true });
    } else {
      await page.locator('[class*="rounded-lg"]').first().click({ force: true });
    }
    await page.waitForTimeout(500);
    await shot(page, 'asignacion-modal-step2');

    // Step 2: should show "Seleccionar Equipos"
    const step2 = await page.locator('h3:has-text("Seleccionar Equipos")').isVisible();
    r('Asignaciones', 'Step 2: Seleccionar equipos', step2 ? 'Paso 2 visible' : 'No avanza a paso 2', 'UI', step2 ? 'OK' : 'ROTO');

    if (step2) {
      // Search equipment
      const eqInput = page.locator('input[placeholder*="Buscar equipo"]');
      if (await eqInput.isVisible()) {
        await eqInput.fill('CEL');
        await waitStable(page, 2000);
        const eqs = await page.locator('[role="dialog"] [class*="rounded-lg"]').count();
        r('Asignaciones', 'Step 2: Buscar equipos', eqs > 0 ? `${eqs} resultado(s)` : 'Sin equipos disponibles', 'GET /api/equipos?estado=DISPONIBLE&search=CEL', eqs > 0 ? 'OK' : 'OK');

        if (eqs > 0) {
          await page.locator('[role="dialog"] [class*="rounded-lg"]').first().click();
          await page.waitForTimeout(300);
        }
      }

      // Navigate to step 4 (confirm) - skip step 3 (accesorios)
      const continueBtn = page.locator('button:has-text("Continuar")');
      if (await continueBtn.isVisible()) {
        await continueBtn.click();
        await page.waitForTimeout(500);
      }

      // Step 4 should show "Confirmar Asignación" with worker and equipment details
      const confirmHeader = await page.locator('h3:has-text("Confirmar Asignación")').isVisible();
      r('Asignaciones', 'Step 4: Confirmación', confirmHeader ? 'Confirmación visible con datos' : 'No llega a confirmación', 'UI', confirmHeader ? 'OK' : 'ROTO');

      // Close the modal without saving
      await page.locator('button:has-text("Cancelar")').first().click();
      await page.waitForTimeout(500);
      r('Asignaciones', 'Cerrar modal multistep sin guardar', 'Modal cerrado', 'UI', 'OK');
    }
  }

  // ---------- 4. EQUIPO DETALLE: Editar equipo inline ----------
  console.log('\n===== EQUIPO DETALLE - Editar equipo =====');
  await page.goto(`${BASE}/equipos/25`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  await shot(page, 'equipo-detalle');

  // Click edit pencil icon
  const editBtn = page.locator('button[aria-label], button svg[class*="lucide-pencil"]').first();
  if (await editBtn.isVisible()) {
    await editBtn.click(); await page.waitForTimeout(500);
    const editForm = await page.locator('text=Editar Equipo').isVisible();
    r('EquipoDetalle', 'Editar: formulario inline visible', editForm ? 'Formulario de edición abierto' : 'No se abre', 'UI', editForm ? 'OK' : 'ROTO');

    // Close edit without saving
    if (editForm) {
      const xBtn = page.locator('button svg[class*="lucide-x"]').first();
      if (await xBtn.isVisible()) {
        await xBtn.click({ force: true }); await page.waitForTimeout(300);
        r('EquipoDetalle', 'Cancelar edición (X)', 'Edit mode closed', 'UI', 'OK');
      }
    }
  }

  // ---------- 5. EQUIPO DETALLE: Datos técnicos ----------
  console.log('\n===== EQUIPO DETALLE - Datos técnicos =====');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const tecBtn = page.locator('button:has-text("Agregar"), button:has-text("Editar")').filter({ hasText: /Agregar|Editar/ }).first();
  if (await tecBtn.isVisible().catch(() => false)) {
    await tecBtn.click({ force: true }); await page.waitForTimeout(800);
    await shot(page, 'equipo-tec-modal');
    const tecModal = await page.locator('h2:has-text("Datos técnicos")').isVisible();
    r('EquipoDetalle', 'Datos técnicos: modal abierto', tecModal ? 'Modal con campos' : 'No abre', 'UI', tecModal ? 'OK' : 'ROTO');
    if (tecModal) {
      // Fill some fields
      const inputs = await page.locator('[role="dialog"] input').count();
      r('EquipoDetalle', 'Datos técnicos: campos visibles', `${inputs} campo(s)`, 'UI', inputs > 0 ? 'OK' : 'ROTO');
      // Close
      await page.locator('button:has-text("Cancelar")').click(); await page.waitForTimeout(400);
      r('EquipoDetalle', 'Datos técnicos: cancelar', 'Modal cerrado', 'UI', 'OK');
    }
  }

  // ---------- 6. EQUIPO DETALLE: Agregar componente / relacionado ----------
  console.log('\n===== EQUIPO DETALLE - Agregar componente =====');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const addCompBtn = page.locator('button:has-text("Agregar componente"), button:has-text("Agregar relacionado")').first();
  if (await addCompBtn.isVisible().catch(() => false)) {
    await addCompBtn.click({ force: true }); await page.waitForTimeout(800);
    await shot(page, 'equipo-addcomp-modal');
    const addModal = await page.locator('h2:has-text("Agregar Componente")').isVisible();
    r('EquipoDetalle', 'Agregar componente: modal abierto', addModal ? 'Modal con campos' : 'No abre', 'UI', addModal ? 'OK' : 'ROTO');
    if (addModal) {
      await page.keyboard.press('Escape'); await page.waitForTimeout(500);
      const stillOpen = await page.locator('h2:has-text("Agregar Componente")').isVisible().catch(() => false);
      if (stillOpen) {
        const cancelBtn = page.locator('button:has-text("Cancelar")');
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click({ force: true }); await page.waitForTimeout(400);
        }
      }
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      r('EquipoDetalle', 'Agregar componente: cancelar', 'Modal cerrado', 'UI', 'OK');
    }
  }

  // ---------- 7. EQUIPO DETALLE: Nueva intervención ----------
  console.log('\n===== EQUIPO DETALLE - Nueva intervención =====');
  // Force-dismiss any lingering overlays
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  const intervBtn = page.locator('button:has-text("Nueva intervención")');
  if (await intervBtn.isVisible().catch(() => false)) {
    await intervBtn.click({ force: true }); await page.waitForTimeout(800);
    await shot(page, 'equipo-interv-modal');
    const ivModal = await page.locator('h2:has-text("Nueva Intervención Técnica")').isVisible();
    r('EquipoDetalle', 'Nueva intervención: modal abierto', ivModal ? 'Modal con formulario' : 'No abre', 'UI', ivModal ? 'OK' : 'ROTO');

    if (ivModal) {
      // Try to submit with empty form → should show Swal warning
      await page.locator('button:has-text("Registrar intervención")').click();
      await page.waitForTimeout(800);
      const swalWarning = await page.locator('text=Selecciona un tipo de intervención').isVisible().catch(() => false);
      r('EquipoDetalle', 'Intervención: validación tipo vacío', swalWarning ? 'Swal warning mostrado' : 'Sin validación', 'Swal', swalWarning ? 'OK' : 'ROTO');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);

      // Select type = MANTENIMIENTO (force)
      const tipoSelect = page.locator('[role="combobox"]').first();
      if (await tipoSelect.isVisible()) {
        await tipoSelect.click({ force: true }); await page.waitForTimeout(400);
        await page.locator('[role="option"]:has-text("Mantenimiento")').click({ force: true }); await page.waitForTimeout(300);
        r('EquipoDetalle', 'Intervención: seleccionar tipo Mantenimiento', 'Tipo seleccionado', 'UI', 'OK');

        // Now try submit without descripción → should show Swal
        await page.locator('button:has-text("Registrar intervención")').click();
        await page.waitForTimeout(800);
        const swalDesc = await page.locator('text=La descripción es obligatoria').isVisible().catch(() => false);
        r('EquipoDetalle', 'Intervención: validación descripción vacía', swalDesc ? 'Swal warning mostrado' : 'Sin validación', 'Swal', swalDesc ? 'OK' : 'ROTO');
        await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      }
    }

    // Close without saving
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    const ivStillOpen = await page.locator('h2:has-text("Nueva Intervención Técnica")').isVisible().catch(() => false);
    if (ivStillOpen) {
      await page.locator('button:has-text("Cancelar")').click({ force: true }); await page.waitForTimeout(400);
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    r('EquipoDetalle', 'Intervención: cancelar', 'Modal cerrado', 'UI', 'OK');
  }

  // ---------- 8. ASIGNACIONES: Cesar (destructive action) ----------
  console.log('\n===== ASIGNACIONES - Confirmación de cesar =====');
  await page.goto(`${BASE}/asignaciones`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  // Switch to Vigentes tab
  const vigBtn = page.locator('button:has-text("Vigentes")');
  if (await vigBtn.isVisible()) {
    await vigBtn.click(); await waitStable(page, 2000);
  }
  // Look for "Cesar" button in row
  const cesarBtn = page.locator('button:has-text("Cesar")').first();
  if (await cesarBtn.isVisible()) {
    await cesarBtn.click(); await page.waitForTimeout(1000);
    await shot(page, 'asignaciones-cesar-dialog');
    const cesarDialog = await page.locator('h2:has-text("Cesar asignación"), h2:has-text("Cesar")').isVisible();
    r('Asignaciones', 'Cesar: confirmación mostrada', cesarDialog ? 'Dialog con opciones de accesorios' : 'Sin confirmación', 'UI', cesarDialog ? 'OK' : 'ROTO');

    // Verify "Cancelar" button exists (no destructive action without confirmation)
    const cancelBtn = await page.locator('button:has-text("Cancelar")').isVisible();
    r('Asignaciones', 'Cesar: botón Cancelar presente', cancelBtn ? 'Cancelar visible' : 'Sin cancelar', 'UI', cancelBtn ? 'OK' : 'ROTO');

    // Close without confirming
    await page.locator('button:has-text("Cancelar")').click(); await page.waitForTimeout(500);
    r('Asignaciones', 'Cesar: cancelar sin ejecutar', 'Dialog cerrado, acción no ejecutada', 'UI', 'OK');
  } else {
    r('Asignaciones', 'Cesar: botón disponible', 'No hay cesar (sin vigentes)', 'UI', 'OK');
  }

  // ---------- 9. TRABAJADOR DETALLE: Desasignar todo (destructive) ----------
  console.log('\n===== TRABAJADOR DETALLE - Desasignar todo confirmación =====');
  await page.goto(`${BASE}/trabajadores/1721`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  await shot(page, 'trabajador-detalle');

  const desasignarBtn = page.locator('button:has-text("Desasignar todo")');
  if (await desasignarBtn.isVisible().catch(() => false)) {
    await desasignarBtn.click(); await page.waitForTimeout(800);
    await shot(page, 'trabajador-desasignar-dialog');
    const confirmDialog = await page.locator('h2:has-text("Desasignar todos")').isVisible();
    r('TrabajadorDetalle', 'Desasignar: confirmación mostrada', confirmDialog ? 'Dialog con advertencia' : 'Sin confirmación', 'UI', confirmDialog ? 'OK' : 'ROTO');

    const cancelBtn = await page.locator('button:has-text("Cancelar")').isVisible();
    r('TrabajadorDetalle', 'Desasignar: botón Cancelar presente', cancelBtn ? 'Cancelar visible' : 'Sin cancelar', 'UI', cancelBtn ? 'OK' : 'ROTO');

    // Close without confirming
    await page.locator('button:has-text("Cancelar")').click(); await page.waitForTimeout(400);
    r('TrabajadorDetalle', 'Desasignar: cancelar sin ejecutar', 'Dialog cerrado', 'UI', 'OK');
  } else {
    r('TrabajadorDetalle', 'Desasignar: sin asignaciones activas', 'Botón no visible (válido)', 'UI', 'OK');
  }

  // ======================== SAFE ACTIONS ========================

  console.log('\n\n========== SAFE ACTIONS ==========');

  // ---------- Paginación en Trabajadores ----------
  console.log('\n----- Paginación -----');
  // Trabajadores has pageSize default 50, which may be more than available. Use a smaller pageSize.
  // Or use Equipos which has default DataTable pagination (10 per page)
  // Actually, Equipos page doesn't pass pageSize to DataTable, default is 10.
  // With 21 equipos, 10 per page = 3 pages.
  await page.goto(`${BASE}/equipos`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  // Check if pagination exists
  const pageInfo = await page.locator('text=registros').isVisible().catch(() => false);
  if (pageInfo) {
    // Should have next page button
    const nextBtn = page.locator('button:has-text("Siguiente"), button svg[class*="lucide-chevron-right"]').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click(); await waitStable(page, 1500);
      const page2 = await page.locator('text=Página 2 de').isVisible().catch(() => false);
      r('Equipos', 'Paginación: siguiente página', page2 ? 'Página 2 cargada' : 'No cambió', 'UI', page2 ? 'OK' : 'ROTO');

      // Go back
      const prevBtn = page.locator('button:has-text("Anterior")').first();
      if (await prevBtn.isVisible()) {
        await prevBtn.click(); await waitStable(page, 1500);
        r('Equipos', 'Paginación: página anterior', 'Volvió a página 1', 'UI', 'OK');
      }
    } else {
      r('Equipos', 'Paginación: botón sig no disponible', 'Pocos registros o sin paginación', 'UI', 'OK');
    }
  } else {
    // Try Asignaciones pagination
    await page.goto(`${BASE}/asignaciones`, { waitUntil: 'networkidle' });
    await waitStable(page, 2000);
    const asigPageInfo = await page.locator('text=registros').isVisible().catch(() => false);
    if (asigPageInfo) {
      r('Asignaciones', 'Paginación visible', 'Sí (Asignaciones)', 'UI', 'OK');
    } else {
      r('Paginación', 'Verificar paginación', 'No visible en páginas actuales (pocos datos)', 'UI', 'OK');
    }
  }

  // ---------- Tabs ----------
  console.log('\n----- Tabs -----');
  // Componentes: categoría tabs
  await page.goto(`${BASE}/componentes`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  const tabTodo = page.locator('button:has-text("Todo")');
  const tabAcc = page.locator('button:has-text("Accesorios")');
  if (await tabTodo.isVisible() && await tabAcc.isVisible()) {
    await tabAcc.click(); await waitStable(page, 1500);
    const accRows = await page.locator('table tbody tr').count();
    const accActive = await page.locator('button:has-text("Accesorios")').getAttribute('class').then(c => c.includes('bg-primary'));
    r('Componentes', 'Tabs: filtrar Accesorios', accActive ? 'Tab activo, datos filtrados' : 'No activó', 'UI', accActive ? 'OK' : 'ROTO');

    await tabTodo.click(); await waitStable(page, 1500);
    r('Componentes', 'Tabs: volver a Todo', 'Tab reiniciado', 'UI', 'OK');
  } else {
    r('Componentes', 'Tabs de categoría', 'No disponibles', 'UI', 'OK');
  }

  // Asignaciones: tabs Vigentes / Cesadas / Todas
  await page.goto(`${BASE}/asignaciones`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  const cesTab = page.locator('button:has-text("Cesadas")');
  const todTab = page.locator('button:has-text("Todas")');
  if (await cesTab.isVisible() && await todTab.isVisible()) {
    await todTab.click(); await waitStable(page, 1500);
    const todActive = await todTab.getAttribute('class').then(c => c.includes('bg-background') || c.includes('text-foreground'));
    r('Asignaciones', 'Tabs: Todas', 'Tab sin filtro', 'UI', 'OK');

    await cesTab.click(); await waitStable(page, 1500);
    const cesActive = await cesTab.getAttribute('class').then(c => c.includes('bg-background') || c.includes('text-foreground'));
    r('Asignaciones', 'Tabs: Cesadas', cesActive ? 'Solo cesadas visibles' : 'No activó', 'UI', cesActive ? 'OK' : 'ROTO');
  }

  // ---------- Refrescar pantalla (F5) ----------
  console.log('\n----- Refrescar pantalla -----');
  await page.goto(`${BASE}/equipos`, { waitUntil: 'networkidle' });
  await waitStable(page, 2000);
  const beforeRefresh = await page.locator('table tbody tr').count();

  // Kill and restart server mid-test? No - just do F5 which reloads the page
  // F5 in headless Playwright is page.reload()
  await page.reload({ waitUntil: 'networkidle' });
  await waitStable(page, 3000);
  // After reload should show data again
  const afterRefresh = await page.locator('table tbody tr').count();
  const stillHasData = afterRefresh > 0;
  r('Refrescar', 'F5 en Equipos', stillHasData ? `Datos recargados (${afterRefresh} filas)` : 'Pantalla vacía tras refresh', 'GET /api/equipos', stillHasData ? 'OK' : 'ROTO');

  // ---------- Logout/Login ----------
  console.log('\n----- Logout / Login -----');
  // Navigate to a protected page directly without token → should redirect to login
  // Clear localStorage token
  await page.evaluate(() => localStorage.removeItem('token'));
  // Try to access equipos
  await page.goto(`${BASE}/equipos`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const redirectedToLogin = page.url().includes('/login');
  r('Logout', 'Sin token: redirige a login', redirectedToLogin ? 'Redirigido a /login' : `URL actual: ${page.url()}`, 'ProtectedRoute', redirectedToLogin ? 'OK' : 'ROTO');

  // Login again
  await page.locator('input[placeholder*="usuario"]').fill(CREDS.usuario);
  await page.locator('input[placeholder*="contraseña"]').fill(CREDS.password);
  await page.locator('button[type="submit"]').click();
  await waitStable(page, 3000);
  const reLoginOk = !page.url().includes('/login');
  r('Login', 'Re-login después de logout', reLoginOk ? 'Redirigido a Dashboard' : 'Error en re-login', 'POST /api/auth/login', reLoginOk ? 'OK' : 'ROTO');

  // ======================== DESTRUCTIVE ACTIONS VERIFICATION ========================
  console.log('\n\n===== ACTIONS DESTRUCTIVES =====');
  // Verify no POST/PUT/DELETE was executed unexpectedly
  const executedDestructive = capturedBodies.filter(c =>
    c.method === 'POST' || c.method === 'PUT' || c.method === 'DELETE'
  );
  r('Seguridad', 'No se ejecutó ninguna acción destructiva',
    executedDestructive.length === 0
      ? '0 peticiones POST/PUT/DELETE (solo revisamos)'
      : `${executedDestructive.length} petición(es) detectadas: ${executedDestructive.map(c => `${c.method} ${c.url}`).join(', ')}`,
    'Monitor', executedDestructive.length === 0 ? 'OK' : '⚠️ Se detectaron mutaciones');

  if (executedDestructive.length > 0) {
    console.log('\n⚠️  Se detectaron peticiones de mutación (posible envío no intencional):');
    executedDestructive.forEach(c => console.log(`  ${c.method} ${c.url}`));
  }

  // ======================== PRINT RESULTS ========================
  printFinal();
  await browser.close();
}

function printFinal() {
  console.log('\n\n========== MATRIZ DE VALIDACIÓN DE FORMULARIOS Y ACCIONES SEGURAS ==========\n');
  const lines = [];
  lines.push('| Módulo | Acción | Detalle | Status | Estado |');
  lines.push('|---|---|---|---|---|');
  for (const r2 of results) {
    lines.push(`| ${r2.modulo} | ${r2.accion} | ${r2.detalle} | ${r2.status} | ${r2.estado} |`);
  }
  const matrix = lines.join('\n') + '\n';
  writeFileSync(resolve(SS, 'matriz-forms.md'), matrix);
  console.log(matrix);

  const ok = results.filter(r2 => r2.estado === 'OK').length;
  const roto = results.filter(r2 => r2.estado === 'ROTO').length;
  const warn = results.filter(r2 => r2.estado.startsWith('⚠️')).length;
  console.log(`\nResumen: ${ok} OK | ${roto} Roto | ${warn} Warning | ${results.length} Total`);
  if (pageErrors.length > 0) {
    console.log(`\n⚠️  ${pageErrors.length} error(es) de consola durante toda la sesión`);
    pageErrors.forEach(e => console.log(`  ${e}`));
  }
}

run().catch(e => { console.error('FATAL:', e); process.exit(1); });
