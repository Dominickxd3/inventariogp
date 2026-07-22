import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { AsignacionesService } from '../services/asignaciones.service.js'
import { query, withTransaction, closeAll } from '../config/db.js'

const TEST_DB = 'InventarioGP_Test'

// IDs de prueba (deben existir en la BD de pruebas)
let testIdUsuario = 1
let testIdTrabajador = 1
let testIdEquipo = null
let testIdAsignacion = null
let testIdComponente1 = null
let testIdComponente2 = null

beforeAll(async () => {
  // Crear datos de prueba
  await withTransaction(TEST_DB, async (trx) => {
    const request = trx.request()
    const eqResult = await request.query(`
      INSERT INTO Tab_EQ_MaeEquipos (CodEquipo, IdTipodeEquipo, Estado)
      OUTPUT INSERTED.IdMaeEquipo
      VALUES ('TEST-CESE-EQ-01', 1, 'DISPONIBLE')
    `)
    testIdEquipo = eqResult.recordset[0].IdMaeEquipo

    const compResult1 = await request.query(`
      INSERT INTO Tab_EQ_Componentes (IdTipodeComponente, Estado)
      OUTPUT INSERTED.IdComponente
      VALUES (1, 'DISPONIBLE')
    `)
    testIdComponente1 = compResult1.recordset[0].IdComponente

    const compResult2 = await request.query(`
      INSERT INTO Tab_EQ_Componentes (IdTipodeComponente, Estado)
      OUTPUT INSERTED.IdComponente
      VALUES (1, 'DISPONIBLE')
    `)
    testIdComponente2 = compResult2.recordset[0].IdComponente
  })

  // Crear asignación con accesorios
  await withTransaction(TEST_DB, async (trx) => {
    const request = trx.request()
    await request.query(`
      UPDATE Tab_EQ_MaeEquipos SET Estado = 'ASIGNADO' WHERE IdMaeEquipo = ${testIdEquipo}
    `)
    const asigResult = await request.query(`
      INSERT INTO Tab_EQ_MovEquiposAsignaciones (IdMaeEquipo, IdReferente, FecAsignacion, Estado)
      OUTPUT INSERTED.IdMovEquipoAsignacion
      VALUES (${testIdEquipo}, ${testIdTrabajador}, GETDATE(), 'VIGENTE')
    `)
    testIdAsignacion = asigResult.recordset[0].IdMovEquipoAsignacion

    await request.query(`
      INSERT INTO Tab_EQ_MovAccesoriosTrabajador (IdComponente, IdReferente, FecAsignacion, Estado, IdUsuarioCrea, IdMovEquipoAsignacion)
      VALUES (${testIdComponente1}, ${testIdTrabajador}, GETDATE(), 'VIGENTE', ${testIdUsuario}, ${testIdAsignacion})
    `)
    await request.query(`
      INSERT INTO Tab_EQ_MovAccesoriosTrabajador (IdComponente, IdReferente, FecAsignacion, Estado, IdUsuarioCrea, IdMovEquipoAsignacion)
      VALUES (${testIdComponente2}, ${testIdTrabajador}, GETDATE(), 'VIGENTE', ${testIdUsuario}, ${testIdAsignacion})
    `)

    await request.query(`
      UPDATE Tab_EQ_Componentes SET Estado = 'ASIGNADO' WHERE IdComponente IN (${testIdComponente1}, ${testIdComponente2})
    `)
  })
})

afterAll(async () => {
  // Limpiar datos de prueba
  await withTransaction(TEST_DB, async (trx) => {
    const request = trx.request()
    await request.query(`DELETE FROM Tab_EQ_MovAccesoriosTrabajador WHERE IdMovEquipoAsignacion = ${testIdAsignacion}`)
    await request.query(`DELETE FROM Tab_EQ_MovEquiposAsignaciones WHERE IdMovEquipoAsignacion = ${testIdAsignacion}`)
    await request.query(`DELETE FROM Tab_EQ_MovEstadosEquipos WHERE IdMaeEquipo = ${testIdEquipo}`)
    await request.query(`DELETE FROM Tab_EQ_MaeEquipos WHERE IdMaeEquipo = ${testIdEquipo}`)
    await request.query(`DELETE FROM Tab_EQ_Componentes WHERE IdComponente IN (${testIdComponente1}, ${testIdComponente2})`)
  })
  await closeAll()
})

async function getAccsIds() {
  const rows = await query(TEST_DB, `
    SELECT IdMovAccesorio FROM Tab_EQ_MovAccesoriosTrabajador
    WHERE IdMovEquipoAsignacion = @id AND Estado = 'VIGENTE'
  `, { id: testIdAsignacion })
  return rows.map(r => r.IdMovAccesorio)
}

describe('cesar() — integridad de cese de asignaciones', () => {

  // ===== CASO 1: Cese exitoso con todos los accesorios =====
  it('debe cesar asignación exitosamente cuando se envían todos los accesorios', async () => {
    const accIds = await getAccsIds()
    const accesorios = accIds.map(id => ({ idMovAccesorio: id, accion: 'DISPONIBLE' }))

    await AsignacionesService.cesar(
      testIdAsignacion,
      testIdUsuario,
      accesorios,
      { Motivo: 'DEVOLUCION', Obs: 'Test cese ok' }
    )

    const asig = await query(TEST_DB, `SELECT Estado FROM Tab_EQ_MovEquiposAsignaciones WHERE IdMovEquipoAsignacion = @id`, { id: testIdAsignacion })
    expect(asig[0].Estado).toBe('CESADO')

    const accs = await query(TEST_DB, `SELECT Estado FROM Tab_EQ_MovAccesoriosTrabajador WHERE IdMovEquipoAsignacion = @id`, { id: testIdAsignacion })
    accs.forEach(a => expect(a.Estado).not.toBe('VIGENTE'))

    const eq = await query(TEST_DB, `SELECT Estado FROM Tab_EQ_MaeEquipos WHERE IdMaeEquipo = @id`, { id: testIdEquipo })
    expect(eq[0].Estado).toBe('DISPONIBLE')
  })

  // ===== CASO 2: Cese sin accesorios cuando existen vigentes → 409 =====
  it('debe rechazar con 409 si hay accesorios vigentes y no se envía arreglo', async () => {
    const accIds = await getAccsIds()
    if (accIds.length === 0) return // no hay acc vigentes, saltar

    await expect(
      AsignacionesService.cesar(testIdAsignacion, testIdUsuario, undefined, { Motivo: 'DEVOLUCION', Obs: 'sin accs' })
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('tiene accesorios vigentes') })
  })

  // ===== CASO 3: Cese con accesorio faltante → 409 =====
  it('debe rechazar con 409 si falta un accesorio', async () => {
    const accIds = await getAccsIds()
    if (accIds.length < 2) return

    const incompleto = accIds.slice(0, 1).map(id => ({ idMovAccesorio: id, accion: 'DISPONIBLE' }))
    await expect(
      AsignacionesService.cesar(testIdAsignacion, testIdUsuario, incompleto, { Motivo: 'DEVOLUCION', Obs: 'falta 1' })
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('faltan') })
  })

  // ===== CASO 4: Cese con accesorio extra o de otra asignación → 409 =====
  it('debe rechazar con 409 si se envía un ID extra', async () => {
    const accIds = await getAccsIds()
    const extra = [...accIds.map(id => ({ idMovAccesorio: id, accion: 'DISPONIBLE' })), { idMovAccesorio: 99999, accion: 'DISPONIBLE' }]

    await expect(
      AsignacionesService.cesar(testIdAsignacion, testIdUsuario, extra, { Motivo: 'DEVOLUCION', Obs: 'id extra' })
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('sobran') })
  })

  // ===== CASO 5: Cese con IDs duplicados → 409 =====
  it('debe rechazar con 409 si hay IDs duplicados', async () => {
    const accIds = await getAccsIds()
    if (accIds.length === 0) return
    const dupId = accIds[0]
    const duplicados = [
      { idMovAccesorio: dupId, accion: 'DISPONIBLE' },
      { idMovAccesorio: dupId, accion: 'BAJA' },
    ]

    await expect(
      AsignacionesService.cesar(testIdAsignacion, testIdUsuario, duplicados, { Motivo: 'DEVOLUCION', Obs: 'duplicado' })
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('duplicado') })
  })

  // ===== CASO 6: Cese con accesorio cuyo IdComponente es null → 409 =====
  it('debe rechazar con 409 si IdComponente es null', async () => {
    // Crear accesorio sin IdComponente
    const accId = await withTransaction(TEST_DB, async (trx) => {
      const r = await trx.request().query(`
        INSERT INTO Tab_EQ_MovAccesoriosTrabajador (IdComponente, IdReferente, FecAsignacion, Estado, IdUsuarioCrea, IdMovEquipoAsignacion)
        OUTPUT INSERTED.IdMovAccesorio
        VALUES (NULL, ${testIdTrabajador}, GETDATE(), 'VIGENTE', ${testIdUsuario}, ${testIdAsignacion})
      `)
      return r.recordset[0].IdMovAccesorio
    })

    const accIds = await getAccsIds()
    const accs = accIds.map(id => ({ idMovAccesorio: id, accion: 'DISPONIBLE' }))

    await expect(
      AsignacionesService.cesar(testIdAsignacion, testIdUsuario, accs, { Motivo: 'DEVOLUCION', Obs: 'IdComponente null' })
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('no tiene componente asociado') })
  })

  // ===== CASO 7: Cese con acción MANTENER → 422 =====
  it('debe rechazar MANTENER con 422', async () => {
    const accIds = await getAccsIds()
    const accs = accIds.map(id => ({ idMovAccesorio: id, accion: 'MANTENER' }))

    await expect(
      AsignacionesService.cesar(testIdAsignacion, testIdUsuario, accs, { Motivo: 'DEVOLUCION', Obs: 'mantener test' })
    ).rejects.toMatchObject({ statusCode: 422, message: expect.stringContaining('no tiene una regla empresarial aprobada') })
  })

  // ===== CASO 8: Cese simultáneo — uno exitoso, el otro 409 =====
  it('debe permitir un cese y rechazar el segundo con 409', async () => {
    const accIds = await getAccsIds()
    const accs = accIds.map(id => ({ idMovAccesorio: id, accion: 'DISPONIBLE' }))

    await AsignacionesService.cesar(
      testIdAsignacion,
      testIdUsuario,
      accs,
      { Motivo: 'DEVOLUCION', Obs: 'primer cese' }
    )

    await expect(
      AsignacionesService.cesar(testIdAsignacion, testIdUsuario, accs, { Motivo: 'DEVOLUCION', Obs: 'segundo cese' })
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('ya fue cesada') })
  })
})
