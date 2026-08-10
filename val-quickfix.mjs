import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[placeholder*="usuario"]').fill('dortiz');
  await page.locator('input[placeholder*="contraseña"]').fill('Seguridad720');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(3000);

  // Test Componentes submit button
  await page.goto(`${BASE}/componentes`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Nuevo Componente")').click();
  await page.waitForTimeout(800);

  const cat = page.locator('[role="combobox"]').first();
  await cat.dispatchEvent('click');
  await page.waitForTimeout(500);
  const opts1 = await page.locator('[role="option"]').count();
  console.log('Categoria options:', opts1);
  if (opts1 > 0) {
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(600);
  }

  const tipo = page.locator('[role="combobox"]').nth(1);
  await tipo.dispatchEvent('click');
  await page.waitForTimeout(500);
  const opts2 = await page.locator('[role="option"]').count();
  console.log('Tipo options:', opts2);
  if (opts2 > 0) {
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(600);
  }

  const btn = page.locator('button[type="submit"]');
  console.log('Submit disabled after selection:', await btn.isDisabled());
  console.log('Submit HTML:', await btn.evaluate(el => el.outerHTML));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Test Asignaciones worker click
  await page.goto(`${BASE}/asignaciones`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Nueva Asignación")').click();
  await page.waitForTimeout(800);
  await page.locator('input[placeholder*="Buscar por DNI"]').fill('ORTIZ');
  await page.waitForTimeout(2000);

  // Debug: what elements exist
  const dialogContent = await page.locator('[data-slot="dialog-content"]').count();
  console.log('\nDialog contents:', dialogContent);

  const workersCount = await page.locator('div.cursor-pointer:has(p.font-medium)').count();
  console.log('Workers (cursor-pointer):', workersCount);

  // Try clicking the div containing "ORTIZ"
  const workerEl = page.locator('div.cursor-pointer').filter({ hasText: 'ORTIZ' });
  const workerVisible = await workerEl.count();
  console.log('Worker elements with ORTIZ:', workerVisible);

  if (workerVisible > 0) {
    await workerEl.first().click();
    await page.waitForTimeout(800);
    const step2 = await page.locator('h3:has-text("Seleccionar Equipos")').isVisible();
    console.log('Step 2 visible:', step2);

    if (!step2) {
      // Try clicking directly on the text element
      const nameEl = page.locator('p.font-medium').filter({ hasText: 'ORTIZ' }).first();
      if (await nameEl.isVisible()) {
        await nameEl.click();
        await page.waitForTimeout(500);
        console.log('Step 2 after text click:', await page.locator('h3:has-text("Seleccionar Equipos")').isVisible());
      }
    }
  }

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });
