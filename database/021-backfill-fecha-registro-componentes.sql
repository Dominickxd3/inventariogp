-- ============================================================================
-- MIGRACION 021 - Backfill FechaRegistro de componentes/accesorios
-- Proyecto: InventarioGP
-- Fecha:    2026-08-13
-- ============================================================================
-- Los componentes/accesorios existentes quedaron con FechaRegistro NULL cuando
-- se agrego la columna (021... en realidad 017). Para que la grilla del modulo
-- Componentes muestre la fecha de registro:
--   1) Se usa FecInventario si existe.
--   2) Si no, FecCompra.
--   3) Si no, se usa la fecha definida (2026-08-13, misma fecha en que se
--      introdujo la columna FechaRegistro).
-- Los registros nuevos ya se graban con GETDATE() en el INSERT.
-- ============================================================================

USE [InventarioGP];
GO

UPDATE dbo.Tab_EQ_Componentes
SET FechaRegistro = FecInventario
WHERE FechaRegistro IS NULL AND FecInventario IS NOT NULL;
GO

UPDATE dbo.Tab_EQ_Componentes
SET FechaRegistro = FecCompra
WHERE FechaRegistro IS NULL AND FecCompra IS NOT NULL;
GO

UPDATE dbo.Tab_EQ_Componentes
SET FechaRegistro = '2026-08-13'
WHERE FechaRegistro IS NULL;
GO

SELECT COUNT(*) AS SinFecha FROM dbo.Tab_EQ_Componentes WHERE FechaRegistro IS NULL;
GO