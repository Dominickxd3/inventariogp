-- Migration 003: Agregar columna IdPlantilla a Tab_EQ_CaracteristicasEquipo
-- La columna ya existe en la base de datos pero no estaba en migration 001
-- Esta migración es idempotente (solo agrega si no existe)

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Tab_EQ_CaracteristicasEquipo'
    AND COLUMN_NAME = 'IdPlantilla'
)
BEGIN
    ALTER TABLE Tab_EQ_CaracteristicasEquipo
    ADD IdPlantilla INT NULL;

    PRINT 'Columna IdPlantilla agregada correctamente.';
END
ELSE
BEGIN
    PRINT 'La columna IdPlantilla ya existe.';
END
GO
