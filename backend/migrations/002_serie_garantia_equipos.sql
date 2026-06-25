-- Migration: Agregar soporte para serie del fabricante y garantía a Tab_EQ_MaeEquipos

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_MaeEquipos') AND name = 'SerieFabricante')
BEGIN
  ALTER TABLE Tab_EQ_MaeEquipos ADD
    SerieFabricante VARCHAR(100) NULL,
    SinSerieVisible BIT NOT NULL DEFAULT 0,
    EsNuevo BIT NULL,
    FecCompra DATE NULL,
    GarantiaMeses INT NULL,
    FecFinGarantia DATE NULL,
    Proveedor VARCHAR(150) NULL,
    DocumentoCompra VARCHAR(100) NULL;

  CREATE UNIQUE INDEX UQ_Tab_EQ_MaeEquipos_SerieFabricante
    ON Tab_EQ_MaeEquipos(SerieFabricante)
    WHERE SerieFabricante IS NOT NULL;

  PRINT 'Columnas de serie y garantía agregadas a Tab_EQ_MaeEquipos.';
END
ELSE
BEGIN
  PRINT 'Las columnas de serie y garantía ya existen.';
END
