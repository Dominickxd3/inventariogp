-- Migración: plantillas de componentes de fábrica para registro por lote de PCs armadas

IF OBJECT_ID('Tab_EQ_PlantillaCompDetalle', 'U') IS NULL
BEGIN
    CREATE TABLE Tab_EQ_PlantillaCompDetalle (
        IdPlantillaCompDetalle INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        IdPlantillaComp       INT NOT NULL,
        IdTipodeComponente    INT NOT NULL,
        Marca                 NVARCHAR(120) NULL,
        Modelo                NVARCHAR(120) NULL,
        Capacidad             NVARCHAR(60) NULL,
        Orden                 INT DEFAULT 0
    );
    PRINT '-> Tabla Tab_EQ_PlantillaCompDetalle creada';
END
ELSE
    PRINT '-> Tab_EQ_PlantillaCompDetalle ya existía';

IF OBJECT_ID('Tab_EQ_PlantillaComponentes', 'U') IS NULL
BEGIN
    CREATE TABLE Tab_EQ_PlantillaComponentes (
        IdPlantillaComp INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Nombre          NVARCHAR(120) NOT NULL,
        Descripcion     NVARCHAR(255) NULL,
        Estado          NVARCHAR(20) DEFAULT 'ACTIVO',
        FechaRegistro   DATETIME DEFAULT GETDATE()
    );
    PRINT '-> Tabla Tab_EQ_PlantillaComponentes creada';
END
ELSE
    PRINT '-> Tab_EQ_PlantillaComponentes ya existía';

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PlantillaCompDetalle_IdPlantilla')
BEGIN
    CREATE NONCLUSTERED INDEX IX_PlantillaCompDetalle_IdPlantilla
        ON Tab_EQ_PlantillaCompDetalle (IdPlantillaComp);
    PRINT '-> Índice IX_PlantillaCompDetalle_IdPlantilla creado';
END

SELECT 'OK' AS Resultado;