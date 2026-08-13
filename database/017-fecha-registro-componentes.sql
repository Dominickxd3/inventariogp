-- ============================================================================
-- MIGRACIÓN 017 — Fecha de registro de componentes/accesorios
-- Proyecto: InventarioGP
-- Fecha:    2026-08-13
-- ============================================================================
-- Agrega FechaRegistro a Tab_EQ_Componentes (la fecha en que se registró la
-- fila en el inventario). Se llena en el INSERT al crear un componente.
-- Los registros existentes quedan NULL (no se fabrican fechas históricas).
-- ============================================================================

USE [InventarioGP];
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_Componentes') AND name = 'FechaRegistro')
    ALTER TABLE dbo.Tab_EQ_Componentes ADD FechaRegistro DATETIME NULL;
GO