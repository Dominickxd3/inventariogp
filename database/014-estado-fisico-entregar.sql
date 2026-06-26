-- ===========================================================
-- Migration 014: Estado físico y motivo en asignaciones
-- Agrega columnas para registrar estado físico al entregar y devolver,
-- observaciones y motivo de cese en la tabla de asignaciones.
-- ===========================================================

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovEquiposAsignaciones') AND name = 'EstadoFisicoEntrega')
BEGIN
    ALTER TABLE Tab_EQ_MovEquiposAsignaciones ADD EstadoFisicoEntrega NVARCHAR(50) NULL;
    PRINT 'Columna EstadoFisicoEntrega agregada a Tab_EQ_MovEquiposAsignaciones';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovEquiposAsignaciones') AND name = 'ObservacionesEntrega')
BEGIN
    ALTER TABLE Tab_EQ_MovEquiposAsignaciones ADD ObservacionesEntrega NVARCHAR(500) NULL;
    PRINT 'Columna ObservacionesEntrega agregada a Tab_EQ_MovEquiposAsignaciones';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovEquiposAsignaciones') AND name = 'EstadoFisicoDevolucion')
BEGIN
    ALTER TABLE Tab_EQ_MovEquiposAsignaciones ADD EstadoFisicoDevolucion NVARCHAR(50) NULL;
    PRINT 'Columna EstadoFisicoDevolucion agregada a Tab_EQ_MovEquiposAsignaciones';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovEquiposAsignaciones') AND name = 'ObservacionesDevolucion')
BEGIN
    ALTER TABLE Tab_EQ_MovEquiposAsignaciones ADD ObservacionesDevolucion NVARCHAR(500) NULL;
    PRINT 'Columna ObservacionesDevolucion agregada a Tab_EQ_MovEquiposAsignaciones';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovEquiposAsignaciones') AND name = 'MotivoCese')
BEGIN
    ALTER TABLE Tab_EQ_MovEquiposAsignaciones ADD MotivoCese NVARCHAR(50) NULL;
    PRINT 'Columna MotivoCese agregada a Tab_EQ_MovEquiposAsignaciones';
END
