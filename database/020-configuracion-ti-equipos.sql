-- ============================================================================
-- MIGRACIÓN 020 — Configuración TI de equipos (hostname / usuario Windows)
-- Proyecto: InventarioGP
-- Fecha:    2026-08-13
-- ============================================================================
-- 1. Amplía Tab_EQ_MovConfiguraciones para guardar el historial de cambios de
--    configuración con trazabilidad completa:
--    - IdMaeEquipo (equipo al que pertenece el cambio)
--    - FecRegistro / IdUsuarioCrea (quién y cuándo hizo el cambio)
--    - HostnameAnterior/HostnameNuevo/UsuarioWindowsAnterior/UsuarioWindowsNuevo
--      (valores exactos antes y después)
--    IdMovEquipoAsignacion se vuelve opcional (el cambio puede no estar
--    ligado a una asignación: edición en panel TI o por incidencia).
-- 2. Pobla Tab_EQ_TipodeConfiguraciones con los tipos de cambio de
--    configuración (la tabla estaba vacía).
-- 3. Amplía Tab_EQ_Incidencias con la categoría MANTENIMIENTO:
--    - Accion (Formateo, Reinstalación SO, Cambio hostname, Cambio usuario)
--    - NuevoHostname / NuevoUsuarioWindows (configuración final del equipo)
--    - IdUsuario (usr cuestion que registró la incidencia)
-- ============================================================================

USE [InventarioGP];
GO

-- ─── 1. Tab_EQ_MovConfiguraciones ────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones') AND name = 'IdMaeEquipo')
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones ADD IdMaeEquipo INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones') AND name = 'FecRegistro')
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones ADD FecRegistro DATETIME NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones') AND name = 'IdUsuarioCrea')
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones ADD IdUsuarioCrea INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones') AND name = 'HostnameAnterior')
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones ADD HostnameAnterior VARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones') AND name = 'HostnameNuevo')
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones ADD HostnameNuevo VARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones') AND name = 'UsuarioWindowsAnterior')
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones ADD UsuarioWindowsAnterior VARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones') AND name = 'UsuarioWindowsNuevo')
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones ADD UsuarioWindowsNuevo VARCHAR(100) NULL;
GO

-- IdMovEquipoAsignacion pasa a opcional (un cambio de configuración puede ser
-- independiente de una asignación: panel TI o incidencia de mantenimiento).
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones')
      AND name = 'IdMovEquipoAsignacion' AND is_nullable = 0
)
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones ALTER COLUMN IdMovEquipoAsignacion INT NULL;
GO

-- FK hacia el equipo (trazabilidad por activo)
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE parent_object_id = OBJECT_ID('dbo.Tab_EQ_MovConfiguraciones') AND name = 'FK_MovConfiguraciones_MaeEquipos'
)
    ALTER TABLE dbo.Tab_EQ_MovConfiguraciones
        ADD CONSTRAINT FK_MovConfiguraciones_MaeEquipos FOREIGN KEY (IdMaeEquipo) REFERENCES dbo.Tab_EQ_MaeEquipos(IdMaeEquipo);
GO

-- ─── 2. Tab_EQ_TipodeConfiguraciones (catálogo de tipos de cambio) ──────────
IF NOT EXISTS (SELECT 1 FROM dbo.Tab_EQ_TipodeConfiguraciones WHERE CodTipodeConfiguracion = 'ASIGNACION')
    INSERT INTO dbo.Tab_EQ_TipodeConfiguraciones (CodTipodeConfiguracion, DesTipodeConfiguracion, Estado)
    VALUES ('ASIGNACION', 'Configuracion inicial en asignacion', 'ACTIVO');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tab_EQ_TipodeConfiguraciones WHERE CodTipodeConfiguracion = 'CAMBIO_HOSTNAME')
    INSERT INTO dbo.Tab_EQ_TipodeConfiguraciones (CodTipodeConfiguracion, DesTipodeConfiguracion, Estado)
    VALUES ('CAMBIO_HOSTNAME', 'Cambio de hostname', 'ACTIVO');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tab_EQ_TipodeConfiguraciones WHERE CodTipodeConfiguracion = 'CAMBIO_USUARIO_WINDOWS')
    INSERT INTO dbo.Tab_EQ_TipodeConfiguraciones (CodTipodeConfiguracion, DesTipodeConfiguracion, Estado)
    VALUES ('CAMBIO_USUARIO_WINDOWS', 'Cambio de usuario Windows', 'ACTIVO');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tab_EQ_TipodeConfiguraciones WHERE CodTipodeConfiguracion = 'FORMATEO')
    INSERT INTO dbo.Tab_EQ_TipodeConfiguraciones (CodTipodeConfiguracion, DesTipodeConfiguracion, Estado)
    VALUES ('FORMATEO', 'Formateo de equipo', 'ACTIVO');
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Tab_EQ_TipodeConfiguraciones WHERE CodTipodeConfiguracion = 'REINSTALACION_SO')
    INSERT INTO dbo.Tab_EQ_TipodeConfiguraciones (CodTipodeConfiguracion, DesTipodeConfiguracion, Estado)
    VALUES ('REINSTALACION_SO', 'Reinstalacion de sistema operativo', 'ACTIVO');
GO

-- ─── 3. Tab_EQ_Incidencias (categoría MANTENIMIENTO) ────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_Incidencias') AND name = 'Accion')
    ALTER TABLE dbo.Tab_EQ_Incidencias ADD Accion VARCHAR(50) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_Incidencias') AND name = 'NuevoHostname')
    ALTER TABLE dbo.Tab_EQ_Incidencias ADD NuevoHostname VARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_Incidencias') AND name = 'NuevoUsuarioWindows')
    ALTER TABLE dbo.Tab_EQ_Incidencias ADD NuevoUsuarioWindows VARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_Incidencias') AND name = 'IdUsuario')
    ALTER TABLE dbo.Tab_EQ_Incidencias ADD IdUsuario INT NULL;
GO