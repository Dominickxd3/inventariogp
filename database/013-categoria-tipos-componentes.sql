USE InventarioGP
GO

-- ===========================================================
-- Migration 013: Agregar Categoria a Tab_EQ_TipodeComponentes
-- Clasifica cada tipo como REPUESTO_TECNICO, ACCESORIO, CONSUMIBLE
-- ===========================================================

IF COL_LENGTH('Tab_EQ_TipodeComponentes', 'Categoria') IS NULL
BEGIN
    ALTER TABLE Tab_EQ_TipodeComponentes
    ADD Categoria NVARCHAR(30) NULL
    PRINT 'Columna Categoria agregada a Tab_EQ_TipodeComponentes'
END
GO

-- REPUESTOS TECNICOS (van en detalle equipo o intervenciones, NO en asignaciones)
UPDATE Tab_EQ_TipodeComponentes SET Categoria = N'REPUESTO_TECNICO'
WHERE DesTipodeComponente IN (
    N'MEMORIA RAM', N'DISCO SSD', N'DISCO DURO', N'PLACA MADRE',
    N'PROCESADOR', N'TARJETA DE VIDEO', N'BATERIA', N'PANTALLA',
    N'FUENTE DE PODER', N'FUENTE PODER'
)
GO

-- ACCESORIOS (entregables al trabajador, aparecen en wizard asignacion)
UPDATE Tab_EQ_TipodeComponentes SET Categoria = N'ACCESORIO'
WHERE DesTipodeComponente IN (
    N'CARGADOR', N'MOUSE', N'TECLADO', N'ADAPTADOR', N'CABLE',
    N'CABLE RJ45', N'CABLE HDMI', N'CABLE VGA', N'CABLE USB',
    N'MOCHILA', N'AUDIFONOS', N'CARCASA', N'PROTECTOR', N'BASE',
    N'WEBCAM'
)
GO

-- CONSUMIBLES (no aparecen como accesorios normales)
UPDATE Tab_EQ_TipodeComponentes SET Categoria = N'CONSUMIBLE'
WHERE DesTipodeComponente IN (
    N'TONER', N'TINTA', N'CARTUCHO'
)
GO

PRINT 'Categorias actualizadas en Tab_EQ_TipodeComponentes'
GO

SELECT DesTipodeComponente, Categoria, Estado
FROM Tab_EQ_TipodeComponentes
WHERE Estado = 'ACTIVO'
ORDER BY Categoria, DesTipodeComponente
GO
