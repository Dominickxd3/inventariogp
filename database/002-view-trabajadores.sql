USE InventarioGP
GO

IF EXISTS (SELECT * FROM sysobjects WHERE name='VW_TrabajadoresActivos' AND xtype='V')
    DROP VIEW VW_TrabajadoresActivos
GO

CREATE VIEW VW_TrabajadoresActivos
AS
    SELECT
        PersonalId,
        DNI,
        CodEmpleado,
        APaterno,
        AMaterno,
        Nombres,
        APaterno + ' ' + AMaterno + ', ' + Nombres as NombreCompleto,
        FIngreso,
        IdCargo,
        NomCargo,
        AreaName,
        NomGerencia,
        Correo,
        Direccion,
        Telefono1
    FROM SIGA_ASISTENCIA.dbo.Personal_periodo
    WHERE Cesado IS NULL
GO
