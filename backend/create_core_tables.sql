USE InventarioGP
GO

-- ═══════════════════════════════════════════════
-- CORE TABLES — InventarioGP
-- Schema inferred from repositories & scripts
-- ═══════════════════════════════════════════════

-- 1. Tipo de Equipos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tab_EQ_TipodeEquipos')
BEGIN
    CREATE TABLE Tab_EQ_TipodeEquipos (
        IdTipodeEquipo INT IDENTITY(1,1) PRIMARY KEY,
        CodTipodeEquipo VARCHAR(10) NULL,
        DesTipodeEquipo VARCHAR(100) NOT NULL,
        Estado VARCHAR(20) NULL DEFAULT 'ACTIVO',
        FecCreacion DATETIME NULL DEFAULT GETDATE()
    )
    PRINT 'Tab_EQ_TipodeEquipos created'
END
GO

-- 2. MaeEquipos
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tab_EQ_MaeEquipos')
BEGIN
    CREATE TABLE Tab_EQ_MaeEquipos (
        IdMaeEquipo INT IDENTITY(1,1) PRIMARY KEY,
        CodEquipo VARCHAR(50) NULL,
        IdTipodeEquipo INT NULL REFERENCES Tab_EQ_TipodeEquipos(IdTipodeEquipo),
        NombreEquipo VARCHAR(200) NULL,
        Marca VARCHAR(100) NULL,
        Modelo VARCHAR(100) NULL,
        Serie VARCHAR(100) NULL,
        CodBarra VARCHAR(100) NULL,
        Estado VARCHAR(30) NULL DEFAULT 'DISPONIBLE',
        Obs VARCHAR(MAX) NULL,
        FecCreacion DATETIME NULL DEFAULT GETDATE(),
        IdUsuarioCrea INT NULL,
        FecModificacion DATETIME NULL,
        IdUsuarioModifica INT NULL,
        SerieFabricante VARCHAR(100) NULL,
        SinSerieVisible BIT NULL DEFAULT 0,
        EsNuevo BIT NULL,
        FecCompra DATE NULL,
        GarantiaMeses INT NULL,
        FecFinGarantia DATE NULL,
        Proveedor VARCHAR(150) NULL,
        DocumentoCompra VARCHAR(100) NULL
    )
    PRINT 'Tab_EQ_MaeEquipos created'
END
GO

-- 3. Tipo de Componentes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tab_EQ_TipodeComponentes')
BEGIN
    CREATE TABLE Tab_EQ_TipodeComponentes (
        IdTipodeComponente INT IDENTITY(1,1) PRIMARY KEY,
        CodTipodeComponente VARCHAR(10) NULL,
        DesTipodeComponente VARCHAR(100) NOT NULL,
        Categoria VARCHAR(50) NULL,
        Estado VARCHAR(20) NULL DEFAULT 'ACTIVO',
        FecCreacion DATETIME NULL DEFAULT GETDATE()
    )
    PRINT 'Tab_EQ_TipodeComponentes created'
END
GO

-- 4. Componentes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tab_EQ_Componentes')
BEGIN
    CREATE TABLE Tab_EQ_Componentes (
        IdComponente INT IDENTITY(1,1) PRIMARY KEY,
        IdTipodeComponente INT NULL REFERENCES Tab_EQ_TipodeComponentes(IdTipodeComponente),
        CodComponente VARCHAR(50) NULL,
        DesComponente VARCHAR(200) NULL,
        Marca VARCHAR(100) NULL,
        Modelo VARCHAR(100) NULL,
        Serie VARCHAR(100) NULL,
        Lote VARCHAR(100) NULL,
        Capacidad VARCHAR(100) NULL,
        Obs VARCHAR(MAX) NULL,
        Estado VARCHAR(20) NULL DEFAULT 'DISPONIBLE',
        IdUsuarioCrea INT NULL,
        FecCreacion DATETIME NULL DEFAULT GETDATE()
    )
    PRINT 'Tab_EQ_Componentes created'
END
GO

-- 5. Trabajadores
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tab_EQ_Trabajadores')
BEGIN
    CREATE TABLE Tab_EQ_Trabajadores (
        IdTrabajador INT IDENTITY(1,1) PRIMARY KEY,
        PersonalId INT NULL,
        DNI VARCHAR(20) NULL,
        Trabajador VARCHAR(200) NULL,
        Area VARCHAR(100) NULL,
        Ocupacion VARCHAR(100) NULL,
        Estado VARCHAR(20) NULL DEFAULT 'ACTIVO'
    )
    PRINT 'Tab_EQ_Trabajadores created'
END
GO

-- 6. MovEquiposAsignaciones
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tab_EQ_MovEquiposAsignaciones')
BEGIN
    CREATE TABLE Tab_EQ_MovEquiposAsignaciones (
        IdMovEquipoAsignacion INT IDENTITY(1,1) PRIMARY KEY,
        IdMaeEquipo INT NULL REFERENCES Tab_EQ_MaeEquipos(IdMaeEquipo),
        IdTrabajador INT NULL REFERENCES Tab_EQ_Trabajadores(IdTrabajador),
        FecAsignacion DATE NULL DEFAULT GETDATE(),
        FecCese DATE NULL,
        Estado VARCHAR(20) NULL DEFAULT 'VIGENTE',
        Obs VARCHAR(MAX) NULL,
        IdUsuarioCrea INT NULL,
        FecCreacion DATETIME NULL DEFAULT GETDATE()
    )
    PRINT 'Tab_EQ_MovEquiposAsignaciones created'
END
GO

-- 7. MovEquiposComponentes
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tab_EQ_MovEquiposComponentes')
BEGIN
    CREATE TABLE Tab_EQ_MovEquiposComponentes (
        IdMovComponente INT IDENTITY(1,1) PRIMARY KEY,
        IdMaeEquipo INT NULL REFERENCES Tab_EQ_MaeEquipos(IdMaeEquipo),
        IdComponente INT NULL REFERENCES Tab_EQ_Componentes(IdComponente),
        FecAsigComponente DATE NULL DEFAULT GETDATE(),cua
        FecBajaComponente DATE NULL,
        Estado VARCHAR(20) NULL DEFAULT 'ACTIVO',
        OrigenVinculo VARCHAR(50) NULL,
        Motivo VARCHAR(MAX) NULL,
        FecInstalacion DATE NULL,
        IdIntervencion INT NULL,
        Obs VARCHAR(MAX) NULL,
        IdUsuarioCrea INT NULL
    )
    PRINT 'Tab_EQ_MovEquiposComponentes created'
END
GO

PRINT 'All core tables created successfully'
GO
