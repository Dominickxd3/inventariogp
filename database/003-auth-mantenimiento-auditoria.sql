USE InventarioGP
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tab_SYS_Usuarios' AND xtype='U')
BEGIN
    CREATE TABLE Tab_SYS_Usuarios (
        IdUsuario INT IDENTITY(1,1) PRIMARY KEY,
        NombreUsuario VARCHAR(50) NOT NULL UNIQUE,
        Correo VARCHAR(100) NULL,
        PasswordHash VARCHAR(255) NOT NULL,
        Rol VARCHAR(20) NOT NULL DEFAULT 'TECNICO',
        IdPersonal INT NULL,
        Estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        FecCreacion DATETIME NOT NULL DEFAULT GETDATE(),
        FecUltimoAcceso DATETIME NULL
    )
    PRINT 'Tabla Tab_SYS_Usuarios creada'

    INSERT INTO Tab_SYS_Usuarios (NombreUsuario, Correo, PasswordHash, Rol)
    VALUES ('admin', 'admin@grupecsac.com', '$2b$10$NB4bKCYHTsRr/yfJs/6RNOV.WYDp0vGJ/wynTAXjhoticFX58ak..', 'ADMIN')
    PRINT 'Usuario admin creado (password: admin123)'
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tab_EQ_MovAccesoriosTrabajador' AND xtype='U')
BEGIN
    CREATE TABLE Tab_EQ_MovAccesoriosTrabajador (
        IdMovAccesorio INT IDENTITY(1,1) PRIMARY KEY,
        IdComponente INT NOT NULL REFERENCES Tab_EQ_Componentes(IdComponente),
        IdReferente INT NOT NULL,
        FecAsignacion DATE NOT NULL DEFAULT GETDATE(),
        FecCese DATE NULL,
        Obs VARCHAR(MAX) NULL,
        Estado VARCHAR(20) NOT NULL DEFAULT 'VIGENTE',
        IdUsuarioCrea INT NULL REFERENCES Tab_SYS_Usuarios(IdUsuario)
    )
    PRINT 'Tabla Tab_EQ_MovAccesoriosTrabajador creada'
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tab_EQ_MovEstadosEquipos' AND xtype='U')
BEGIN
    CREATE TABLE Tab_EQ_MovEstadosEquipos (
        IdMovEstado INT IDENTITY(1,1) PRIMARY KEY,
        IdMaeEquipo INT NOT NULL REFERENCES Tab_EQ_MaeEquipos(IdMaeEquipo),
        EstadoAnterior VARCHAR(20) NULL,
        EstadoNuevo VARCHAR(20) NOT NULL,
        IdUsuario INT NULL REFERENCES Tab_SYS_Usuarios(IdUsuario),
        Obs VARCHAR(MAX) NULL,
        FecCambio DATETIME NOT NULL DEFAULT GETDATE()
    )
    PRINT 'Tabla Tab_EQ_MovEstadosEquipos creada'
END
GO
