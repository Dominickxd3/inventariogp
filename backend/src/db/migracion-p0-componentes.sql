-- ============================================================================
-- MIGRACIÓN P0 — Refactor completo del módulo Componentes
-- Proyecto: InventarioGP
-- Fecha:    2026-07-20
-- ============================================================================
-- Este script implementa los cambios de esquema necesarios para:
--   1. Trazabilidad completa (EQ_ComponentesEventos)
--   2. Intervenciones multi-componente (EQ_IntervencionesComponentes)
--   3. Baja completa de componentes (motivo, usuario, fecha, disposición)
--   4. Concurrencia (RowVersion)
--   5. Ubicación actual del componente (IdEquipoActual)
--   6. Índices, CHECK y UNIQUE constraints
--
-- USO: Ejecutar en una transacción. REVISAR antes de ejecutar en producción.
-- ============================================================================

USE [DB_INVENTARIOGP];
GO

BEGIN TRANSACTION;
GO

-- ============================================================================
-- 1. TAB_EQ_COMPONENTES — Modificar (agregar columnas de baja + RowVersion)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_Componentes') AND name = 'IdUsuarioBaja')
    ALTER TABLE Tab_EQ_Componentes ADD IdUsuarioBaja INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_Componentes') AND name = 'FechaBaja')
    ALTER TABLE Tab_EQ_Componentes ADD FechaBaja DATETIME NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_Componentes') AND name = 'MotivoBaja')
    ALTER TABLE Tab_EQ_Componentes ADD MotivoBaja VARCHAR(200) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_Componentes') AND name = 'DisposicionFinal')
    ALTER TABLE Tab_EQ_Componentes ADD DisposicionFinal VARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_Componentes') AND name = 'RowVersion')
    ALTER TABLE Tab_EQ_Componentes ADD RowVersion ROWVERSION NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_Componentes') AND name = 'IdEquipoActual')
    ALTER TABLE Tab_EQ_Componentes ADD IdEquipoActual INT NULL;
GO

-- FK: IdUsuarioBaja → Tab_SYS_Usuarios
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Componentes_UsuarioBaja')
    ALTER TABLE Tab_EQ_Componentes
    ADD CONSTRAINT FK_Componentes_UsuarioBaja
    FOREIGN KEY (IdUsuarioBaja) REFERENCES Tab_SYS_Usuarios(IdUsuario);
GO

-- FK: IdEquipoActual → Tab_EQ_MaeEquipos
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Componentes_EquipoActual')
    ALTER TABLE Tab_EQ_Componentes
    ADD CONSTRAINT FK_Componentes_EquipoActual
    FOREIGN KEY (IdEquipoActual) REFERENCES Tab_EQ_MaeEquipos(IdMaeEquipo);
GO

-- CHECK: DisposicionFinal valores controlados
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Componentes_DisposicionFinal')
    ALTER TABLE Tab_EQ_Componentes
    ADD CONSTRAINT CK_Componentes_DisposicionFinal
    CHECK (DisposicionFinal IS NULL OR DisposicionFinal IN ('RECICLAJE', 'DONACION', 'DESECHO', 'ALMACENADO'));
GO

-- CHECK: MotivoBaja no vacío si Estado = 'BAJA'
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Componentes_MotivoBaja')
    ALTER TABLE Tab_EQ_Componentes
    ADD CONSTRAINT CK_Componentes_MotivoBaja
    CHECK (Estado != 'BAJA' OR MotivoBaja IS NOT NULL);
GO

-- ============================================================================
-- 2. TAB_EQ_COMPONENTESEVENTOS — Crear tabla de trazabilidad
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('Tab_EQ_ComponentesEventos'))
BEGIN
    CREATE TABLE Tab_EQ_ComponentesEventos (
        IdEvento        INT            IDENTITY(1,1) NOT NULL,
        IdComponente    INT            NOT NULL,
        EstadoAnterior  VARCHAR(20)    NULL,
        EstadoNuevo     VARCHAR(20)    NOT NULL,
        IdUsuario       INT            NOT NULL,
        FechaEvento     DATETIME       NOT NULL DEFAULT GETDATE(),
        Motivo          VARCHAR(200)   NULL,
        IdReferencia    INT            NULL,
        TablaReferencia VARCHAR(50)    NULL,
        Detalle         NVARCHAR(MAX)  NULL,

        CONSTRAINT PK_ComponentesEventos PRIMARY KEY CLUSTERED (IdEvento),

        CONSTRAINT FK_ComponentesEventos_Componente
            FOREIGN KEY (IdComponente) REFERENCES Tab_EQ_Componentes(IdComponente),

        CONSTRAINT FK_ComponentesEventos_Usuario
            FOREIGN KEY (IdUsuario) REFERENCES Tab_SYS_Usuarios(IdUsuario),

        CONSTRAINT CK_ComponentesEventos_EstadoNuevo
            CHECK (EstadoNuevo IN ('DISPONIBLE','INSTALADO','ASIGNADO','MANTENIMIENTO','BAJA')),

        CONSTRAINT CK_ComponentesEventos_TablaReferencia
            CHECK (TablaReferencia IS NULL OR TablaReferencia IN (
                'Tab_EQ_Asignaciones',
                'Tab_EQ_IntervencionesTecnicas',
                'Tab_EQ_MovEquiposComponentes',
                'Tab_EQ_MovAccesoriosTrabajador',
                'Tab_EQ_Componentes'
            ))
    );

    -- Índices
    CREATE NONCLUSTERED INDEX IX_ComponentesEventos_IdComponente
        ON Tab_EQ_ComponentesEventos (IdComponente)
        INCLUDE (FechaEvento, EstadoAnterior, EstadoNuevo, Motivo);

    CREATE NONCLUSTERED INDEX IX_ComponentesEventos_Fecha
        ON Tab_EQ_ComponentesEventos (FechaEvento DESC);

    CREATE NONCLUSTERED INDEX IX_ComponentesEventos_EstadoNuevo
        ON Tab_EQ_ComponentesEventos (EstadoNuevo)
        WHERE EstadoNuevo IN ('INSTALADO', 'ASIGNADO');
END
GO

-- ============================================================================
-- 3. TAB_EQ_INTERVENCIONESCOMPONENTES — Crear tabla separada multi-componente
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('Tab_EQ_IntervencionesComponentes'))
BEGIN
    CREATE TABLE Tab_EQ_IntervencionesComponentes (
        IdIntervencionComp INT            IDENTITY(1,1) NOT NULL,
        IdIntervencion     INT            NOT NULL,
        IdComponente       INT            NOT NULL,
        Accion             VARCHAR(20)    NOT NULL,
        Observacion        VARCHAR(500)   NULL,
        FechaRegistro      DATETIME       NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_IntervencionesComponentes PRIMARY KEY CLUSTERED (IdIntervencionComp),

        CONSTRAINT FK_IntervencionesComp_Intervencion
            FOREIGN KEY (IdIntervencion) REFERENCES Tab_EQ_IntervencionesTecnicas(IdIntervencion),

        CONSTRAINT FK_IntervencionesComp_Componente
            FOREIGN KEY (IdComponente) REFERENCES Tab_EQ_Componentes(IdComponente),

        CONSTRAINT CK_IntervencionesComp_Accion
            CHECK (Accion IN ('INSTALAR','RETIRAR','REEMPLAZAR','REVISAR','REPARAR'))
    );

    CREATE NONCLUSTERED INDEX IX_IntervencionesComponentes_IdIntervencion
        ON Tab_EQ_IntervencionesComponentes (IdIntervencion)
        INCLUDE (IdComponente, Accion);

    CREATE NONCLUSTERED INDEX IX_IntervencionesComponentes_IdComponente
        ON Tab_EQ_IntervencionesComponentes (IdComponente)
        INCLUDE (IdIntervencion, Accion);
END
GO

-- ============================================================================
-- 4. TAB_EQ_MOVEQUIPOSCOMPONENTES — Modificar (agregar trazabilidad + RowVersion)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovEquiposComponentes') AND name = 'IdIntervencionInstalacion')
    ALTER TABLE Tab_EQ_MovEquiposComponentes ADD IdIntervencionInstalacion INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovEquiposComponentes') AND name = 'IdIntervencionRetiro')
    ALTER TABLE Tab_EQ_MovEquiposComponentes ADD IdIntervencionRetiro INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovEquiposComponentes') AND name = 'RowVersion')
    ALTER TABLE Tab_EQ_MovEquiposComponentes ADD RowVersion ROWVERSION NOT NULL;
GO

-- FK hacia intervenciones (evitar ciclo, no crear si ya existen)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_MovEquiposComp_IntervencionInst')
    ALTER TABLE Tab_EQ_MovEquiposComponentes
    ADD CONSTRAINT FK_MovEquiposComp_IntervencionInst
    FOREIGN KEY (IdIntervencionInstalacion) REFERENCES Tab_EQ_IntervencionesTecnicas(IdIntervencion);
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_MovEquiposComp_IntervencionRet')
    ALTER TABLE Tab_EQ_MovEquiposComponentes
    ADD CONSTRAINT FK_MovEquiposComp_IntervencionRet
    FOREIGN KEY (IdIntervencionRetiro) REFERENCES Tab_EQ_IntervencionesTecnicas(IdIntervencion);
GO

-- ============================================================================
-- 5. TAB_EQ_MOVACCESORIOSTRABAJADOR — Modificar (agregar estado anterior)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MovAccesoriosTrabajador') AND name = 'EstadoAnteriorComponente')
    ALTER TABLE Tab_EQ_MovAccesoriosTrabajador ADD EstadoAnteriorComponente VARCHAR(20) NULL;
GO

-- ============================================================================
-- 6. NUEVOS ÍNDICES ADICIONALES
-- ============================================================================

-- EQ_Componentes: búsqueda por estado
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Componentes_Estado')
    CREATE NONCLUSTERED INDEX IX_Componentes_Estado
        ON Tab_EQ_Componentes (Estado)
        INCLUDE (IdTipodeComponente, IdEquipoActual);
GO

-- EQ_Componentes: búsqueda por tipo
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Componentes_IdTipodeComponente')
    CREATE NONCLUSTERED INDEX IX_Componentes_IdTipodeComponente
        ON Tab_EQ_Componentes (IdTipodeComponente)
        INCLUDE (Estado, IdEquipoActual);
GO

-- EQ_MovEquiposComponentes: búsqueda por componente
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MovEquiposComponentes_IdComponente')
    CREATE NONCLUSTERED INDEX IX_MovEquiposComponentes_IdComponente
        ON Tab_EQ_MovEquiposComponentes (IdComponente)
        INCLUDE (IdMaeEquipo, Estado, FecAsigComponente);
GO

-- EQ_MovAccesoriosTrabajador: búsqueda por componente
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MovAccesoriosTrabajador_IdComponente')
    CREATE NONCLUSTERED INDEX IX_MovAccesoriosTrabajador_IdComponente
        ON Tab_EQ_MovAccesoriosTrabajador (IdComponente)
        INCLUDE (IdReferente, Estado, FecAsignacion);
GO

-- EQ_IntervencionesTecnicas: búsqueda por equipo
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_IntervencionesTecnicas_IdEquipo')
    CREATE NONCLUSTERED INDEX IX_IntervencionesTecnicas_IdEquipo
        ON Tab_EQ_IntervencionesTecnicas (IdMaeEquipo)
        INCLUDE (FecIntervencion, TipoIntervencion, Resultado);
GO

-- ============================================================================
-- 7. UNIQUE CONSTRAINT — Serie normalizada
-- ============================================================================
-- Nota: Si ya existe un UNIQUE INDEX sobre Serie con TRIM, omitir.
-- Si no, crear uno (requiere limpieza previa de duplicados).
-- Este paso debe verificarse manualmente.
/*
-- Ejemplo (comentado — verificar duplicados antes de ejecutar):
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UQ_Componentes_SerieNormalizada')
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Componentes_SerieNormalizada
        ON Tab_EQ_Componentes (Serie)
        WHERE Serie IS NOT NULL AND LTRIM(RTRIM(Serie)) != '';
*/

-- ============================================================================
-- 8. ACTUALIZAR ESTADOS EXISTENTES (migración de datos)
-- ============================================================================
-- Asegurar que componentes en estado 'DISPONIBLE' no tengan IdEquipoActual
UPDATE Tab_EQ_Componentes
SET IdEquipoActual = NULL
WHERE Estado = 'DISPONIBLE' AND IdEquipoActual IS NOT NULL;
GO

-- Sincronizar IdEquipoActual para componentes INSTALADOS (ASIGNADO en código actual)
-- basados en vinculaciones vigentes en MovEquiposComponentes
UPDATE c
SET c.IdEquipoActual = m.IdMaeEquipo
FROM Tab_EQ_Componentes c
JOIN Tab_EQ_MovEquiposComponentes m ON c.IdComponente = m.IdComponente
WHERE m.Estado = 'VIGENTE'
  AND c.Estado = 'ASIGNADO'
  AND c.IdEquipoActual IS NULL;
GO

-- ============================================================================
-- COMMIT
-- ============================================================================
COMMIT TRANSACTION;
GO

PRINT 'Migración P0 completada exitosamente.';
PRINT '-> Tab_EQ_Componentes modificada (baja, RowVersion, IdEquipoActual)';
PRINT '-> Tab_EQ_ComponentesEventos creada';
PRINT '-> Tab_EQ_IntervencionesComponentes creada';
PRINT '-> Tab_EQ_MovEquiposComponentes modificada (trazabilidad + RowVersion)';
PRINT '-> Tab_EQ_MovAccesoriosTrabajador modificada (EstadoAnteriorComponente)';
PRINT '-> Índices adicionales creados';
GO
