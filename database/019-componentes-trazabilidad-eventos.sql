USE InventarioGP
GO

-- ==============================================================
-- Migration 019: Tabla de trazabilidad de componentes
-- ==============================================================
-- Registro de eventos de estado de cada componente
-- (creacion, asignacion, instalacion, baja, etc.)
-- ==============================================================

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.Tab_EQ_ComponentesEventos'))
BEGIN
    CREATE TABLE dbo.Tab_EQ_ComponentesEventos (
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
            FOREIGN KEY (IdComponente) REFERENCES dbo.Tab_EQ_Componentes(IdComponente),
        CONSTRAINT FK_ComponentesEventos_Usuario
            FOREIGN KEY (IdUsuario) REFERENCES dbo.Tab_SYS_Usuarios(IdUsuario),
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

    CREATE NONCLUSTERED INDEX IX_ComponentesEventos_IdComponente
        ON dbo.Tab_EQ_ComponentesEventos (IdComponente)
        INCLUDE (FechaEvento, EstadoAnterior, EstadoNuevo, Motivo);

    CREATE NONCLUSTERED INDEX IX_ComponentesEventos_Fecha
        ON dbo.Tab_EQ_ComponentesEventos (FechaEvento DESC);
END
GO

PRINT 'Tab_EQ_ComponentesEventos creada'
GO