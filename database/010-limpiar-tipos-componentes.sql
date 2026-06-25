USE InventarioGP
GO

-- ===========================================================
-- Migration 010: Limpiar Tab_EQ_TipodeComponentes
-- Elimina tipos de equipo que contaminaron el catálogo de
-- tipos de componente/accesorio.
-- ===========================================================

-- 1. Desactivar tipos de equipo que aparecieron erroneamente
--    en la tabla de componentes.
UPDATE Tab_EQ_TipodeComponentes
SET Estado = 'INACTIVO'
WHERE DesTipodeComponente IN (
    N'PC ESCRITORIO',
    N'LAPTOP',
    N'CELULAR',
    N'TABLET',
    N'MONITOR',
    N'IMPRESORA',
    N'ACCESS POINT',
    N'SWITCH',
    N'PC',
    N'LAP',
    N'CEL',
    N'TAB',
    N'MON',
    N'IMP',
    N'AP',
    N'SW'
)
PRINT 'Tipos de equipo desactivados en Tab_EQ_TipodeComponentes'

-- 2. Insertar tipos de componente faltantes (solo si no existen)
IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'DISCO SSD')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('SSD', N'DISCO SSD', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'BATERIA')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('BAT', N'BATERIA', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'PANTALLA')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('PAN', N'PANTALLA', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'MOUSE')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('MOU', N'MOUSE', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'TECLADO')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('TEC', N'TECLADO', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'FUENTE DE PODER')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('FNT', N'FUENTE DE PODER', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'PLACA MADRE')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('PLA', N'PLACA MADRE', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'PROCESADOR')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('CPU', N'PROCESADOR', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'TARJETA DE VIDEO')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('VID', N'TARJETA DE VIDEO', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'ADAPTADOR')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('ADP', N'ADAPTADOR', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'TONER')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('TON', N'TONER', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'DISCO DURO')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('HDD', N'DISCO DURO', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'CARGADOR')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('CAR', N'CARGADOR', 'ACTIVO')
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'CABLE')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado) VALUES ('CAB', N'CABLE', 'ACTIVO')
GO

-- 3. Unificar nombres que existen con variantes
-- FUENTE PODER -> FUENTE DE PODER
IF EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'FUENTE PODER')
   AND NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'FUENTE DE PODER')
BEGIN
    UPDATE Tab_EQ_TipodeComponentes SET DesTipodeComponente = N'FUENTE DE PODER'
    WHERE DesTipodeComponente = N'FUENTE PODER'
    PRINT 'FUENTE PODER renombrado a FUENTE DE PODER'
END
GO

-- TARJ MADRE -> PLACA MADRE
IF EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'TARJ MADRE')
   AND NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'PLACA MADRE')
BEGIN
    UPDATE Tab_EQ_TipodeComponentes SET DesTipodeComponente = N'PLACA MADRE'
    WHERE DesTipodeComponente = N'TARJ MADRE'
    PRINT 'TARJ MADRE renombrado a PLACA MADRE'
END
ELSE IF EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'TARJ MADRE')
BEGIN
    UPDATE Tab_EQ_TipodeComponentes SET Estado = 'INACTIVO'
    WHERE DesTipodeComponente = N'TARJ MADRE'
    PRINT 'TARJ MADRE desactivado (PLACA MADRE ya existe)'
END
GO

-- 4. Desactivar variantes de cable que no son necesarias si ya existe CABLE generico
IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'CABLE')
BEGIN
    DECLARE @cableCount INT
    SELECT @cableCount = COUNT(*) FROM Tab_EQ_TipodeComponentes
    WHERE DesTipodeComponente IN (N'CABLE RJ45', N'CABLE HDMI', N'CABLE VGA', N'CABLE USB')
      AND Estado = 'ACTIVO'

    IF @cableCount >= 2
    BEGIN
        INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Estado)
        VALUES ('CAB', N'CABLE', 'ACTIVO')
        UPDATE Tab_EQ_TipodeComponentes SET Estado = 'INACTIVO'
        WHERE DesTipodeComponente IN (N'CABLE RJ45', N'CABLE HDMI', N'CABLE VGA', N'CABLE USB')
        PRINT 'Cables específicos reemplazados por CABLE genérico'
    END
END
GO

PRINT 'Migración 010 completada: catálogo de tipos de componente limpio.'
GO
