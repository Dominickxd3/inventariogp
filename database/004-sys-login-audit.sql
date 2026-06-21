USE InventarioGP
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tab_SYS_LoginAudit' AND xtype='U')
BEGIN
    CREATE TABLE Tab_SYS_LoginAudit (
        IdAudit INT IDENTITY(1,1) PRIMARY KEY,
        IdUsuario INT NULL REFERENCES Tab_SYS_Usuarios(IdUsuario),
        NombreUsuario VARCHAR(50) NOT NULL,
        FechaIntento DATETIME NOT NULL DEFAULT GETDATE(),
        Exitoso BIT NOT NULL DEFAULT 0,
        DireccionIP VARCHAR(50) NULL,
        UserAgent VARCHAR(500) NULL,
        Mensaje VARCHAR(255) NULL
    )

    CREATE INDEX IX_LoginAudit_Fecha ON Tab_SYS_LoginAudit(FechaIntento DESC)
    CREATE INDEX IX_LoginAudit_IdUsuario ON Tab_SYS_LoginAudit(IdUsuario)

    PRINT 'Tabla Tab_SYS_LoginAudit creada'
END
GO
