USE InventarioGP
GO

-- ===========================================================
-- Migration 012: Vincular accesorios con asignación
-- Agrega IdMovEquipoAsignacion a Tab_EQ_MovAccesoriosTrabajador
-- para ligar los accesorios entregados a una asignación específica.
-- ===========================================================

IF NOT EXISTS (
    SELECT * FROM syscolumns WHERE id = OBJECT_ID('Tab_EQ_MovAccesoriosTrabajador')
    AND name = 'IdMovEquipoAsignacion'
)
BEGIN
    ALTER TABLE Tab_EQ_MovAccesoriosTrabajador
    ADD IdMovEquipoAsignacion INT NULL
        REFERENCES Tab_EQ_MovEquiposAsignaciones(IdMovEquipoAsignacion)

    PRINT 'Columna IdMovEquipoAsignacion agregada a Tab_EQ_MovAccesoriosTrabajador'
END
GO
