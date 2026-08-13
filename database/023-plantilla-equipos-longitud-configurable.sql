-- ============================================================================
-- MIGRACION 023 - Longitud min/max configurable en plantilla de caracteristicas
-- Proyecto: InventarioGP
-- Fecha:    2026-08-13
-- ============================================================================
-- Permite limitar la cantidad de caracteres por campo de la plantilla de
-- equipos (ej. Serie de MONITOR / IMPRESORA / ACCESS POINT / SWITCH entre
-- 8 y 12 caracteres). El frontend la aplica con maxLength y validacion.
-- ============================================================================

USE [InventarioGP];
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Tab_EQ_PlantillaCaracteristicas') AND name = 'LongitudMin')
    ALTER TABLE dbo.Tab_EQ_PlantillaCaracteristicas ADD LongitudMin int NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Tab_EQ_PlantillaCaracteristicas') AND name = 'LongitudMax')
    ALTER TABLE dbo.Tab_EQ_PlantillaCaracteristicas ADD LongitudMax int NULL;
GO

-- Serie: minimo 8, maximo 12 caracteres
UPDATE dbo.Tab_EQ_PlantillaCaracteristicas
SET LongitudMin = 8, LongitudMax = 12
WHERE Clave = 'Serie';
GO