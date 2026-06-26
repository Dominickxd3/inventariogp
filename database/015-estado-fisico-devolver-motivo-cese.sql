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
