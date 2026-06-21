USE InventarioGP
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tab_EQ_Incidencias' AND xtype='U')
BEGIN
    CREATE TABLE Tab_EQ_Incidencias (
        IdIncidencia INT IDENTITY(1,1) PRIMARY KEY,
        IdMaeEquipo INT NOT NULL REFERENCES Tab_EQ_MaeEquipos(IdMaeEquipo),
        IdReferente INT NULL,
        TipoIncidencia VARCHAR(30) NOT NULL DEFAULT 'ROBO',
        Descripcion VARCHAR(MAX) NULL,
        FecIncidencia DATE NULL DEFAULT GETDATE(),
        FecRegistro DATETIME NULL DEFAULT GETDATE(),
        FecCierre DATETIME NULL,
        Estado VARCHAR(20) NULL DEFAULT 'ABIERTO'
    )
    PRINT 'Tabla Tab_EQ_Incidencias creada'
END
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeEquipos)
BEGIN
    INSERT INTO Tab_EQ_TipodeEquipos (DesTipodeEquipo, Estado)
    VALUES
        ('PC ESCRITORIO', 1),
        ('LAPTOP', 1),
        ('CELULAR', 1),
        ('TABLET', 1),
        ('MONITOR', 1),
        ('TECLADO', 1),
        ('MOUSE', 1),
        ('IMPRESORA', 1),
        ('ACCESS POINT', 1),
        ('SWITCH', 1)
    PRINT 'Tipos de equipo insertados'
END
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeComponentes)
BEGIN
    INSERT INTO Tab_EQ_TipodeComponentes (DesTipodeComponente, Estado)
    VALUES
        ('MEMORIA RAM', 'ACTIVO'),
        ('DISCO DURO', 'ACTIVO'),
        ('FUENTE PODER', 'ACTIVO'),
        ('TARJ MADRE', 'ACTIVO'),
        ('CABLE RJ45', 'ACTIVO'),
        ('CABLE HDMI', 'ACTIVO'),
        ('CABLE VGA', 'ACTIVO'),
        ('CABLE USB', 'ACTIVO'),
        ('CARGADOR', 'ACTIVO'),
        ('CARCASA', 'ACTIVO'),
        ('PROTECTOR', 'ACTIVO'),
        ('BASE', 'ACTIVO'),
        ('AUDIFONOS', 'ACTIVO'),
        ('WEBCAM', 'ACTIVO')
    PRINT 'Tipos de componente insertados'
END
GO
