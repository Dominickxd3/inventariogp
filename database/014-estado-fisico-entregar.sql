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
