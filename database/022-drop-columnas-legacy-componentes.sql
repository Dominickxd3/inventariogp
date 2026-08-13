-- ============================================================================
-- MIGRACION 022 - Elimina columnas legacy de Tab_EQ_Componentes
-- Proyecto: InventarioGP
-- Fecha:    2026-08-13
-- ============================================================================
-- La arquitectura dinamica guarda las caracteristicas (Marca, Modelo, Serie,
-- Lote, Capacidad, etc.) en Tab_Componente_Caracteristicas. Las columnas fijas
-- Marca, Modelo, Serie, Lote, Capacidad, FecInventario y FecCompra quedaron sin
-- uso real.
--
-- Antes de eliminarlas se respaldan los valores existentes hacia
-- Tab_Componente_Caracteristicas, solo donde la plantilla del tipo define esa
-- clave (asintiendo con el modelo dinamico). FecInventario/FecCompra solo
-- existian en RAM-001 y no tienen equivalente en el modelo dinamico.
-- ============================================================================

USE [InventarioGP];
GO

-- 1) Respaldo: Marca
INSERT INTO dbo.Tab_Componente_Caracteristicas (IdComponente, IdPlantilla, Clave, Valor, FecRegistro)
SELECT e.IdComponente, p.IdPlantilla, 'Marca', e.Marca, GETDATE()
FROM dbo.Tab_EQ_Componentes e
JOIN (SELECT IdTipodeComponente, Clave, MIN(IdPlantilla) AS IdPlantilla
      FROM dbo.Tab_Componente_PlantillaCaracteristicas
      WHERE Clave = 'Marca'
      GROUP BY IdTipodeComponente, Clave) p
  ON p.IdTipodeComponente = e.IdTipodeComponente
WHERE e.Marca IS NOT NULL AND LTRIM(RTRIM(e.Marca)) <> ''
  AND NOT EXISTS (SELECT 1 FROM dbo.Tab_Componente_Caracteristicas cc
                  WHERE cc.IdComponente = e.IdComponente AND cc.Clave = 'Marca');
GO

-- 2) Respaldo: Modelo
INSERT INTO dbo.Tab_Componente_Caracteristicas (IdComponente, IdPlantilla, Clave, Valor, FecRegistro)
SELECT e.IdComponente, p.IdPlantilla, 'Modelo', e.Modelo, GETDATE()
FROM dbo.Tab_EQ_Componentes e
JOIN (SELECT IdTipodeComponente, Clave, MIN(IdPlantilla) AS IdPlantilla
      FROM dbo.Tab_Componente_PlantillaCaracteristicas
      WHERE Clave = 'Modelo'
      GROUP BY IdTipodeComponente, Clave) p
  ON p.IdTipodeComponente = e.IdTipodeComponente
WHERE e.Modelo IS NOT NULL AND LTRIM(RTRIM(e.Modelo)) <> ''
  AND NOT EXISTS (SELECT 1 FROM dbo.Tab_Componente_Caracteristicas cc
                  WHERE cc.IdComponente = e.IdComponente AND cc.Clave = 'Modelo');
GO

-- 3) Respaldo: Capacidad
INSERT INTO dbo.Tab_Componente_Caracteristicas (IdComponente, IdPlantilla, Clave, Valor, FecRegistro)
SELECT e.IdComponente, p.IdPlantilla, 'Capacidad', e.Capacidad, GETDATE()
FROM dbo.Tab_EQ_Componentes e
JOIN (SELECT IdTipodeComponente, Clave, MIN(IdPlantilla) AS IdPlantilla
      FROM dbo.Tab_Componente_PlantillaCaracteristicas
      WHERE Clave = 'Capacidad'
      GROUP BY IdTipodeComponente, Clave) p
  ON p.IdTipodeComponente = e.IdTipodeComponente
WHERE e.Capacidad IS NOT NULL AND LTRIM(RTRIM(e.Capacidad)) <> ''
  AND NOT EXISTS (SELECT 1 FROM dbo.Tab_Componente_Caracteristicas cc
                  WHERE cc.IdComponente = e.IdComponente AND cc.Clave = 'Capacidad');
GO

-- 4) Eliminar columnas legacy (sin indice ni constraint que las referencie)
ALTER TABLE dbo.Tab_EQ_Componentes DROP COLUMN
    Marca, Modelo, Serie, Lote, Capacidad, FecInventario, FecCompra;
GO

-- 5) Verificacion
SELECT COUNT(*) AS SinFechaRegistro FROM dbo.Tab_EQ_Componentes WHERE FechaRegistro IS NULL;
GO