USE InventarioGP
GO

IF NOT EXISTS (SELECT * FROM Tab_EQ_TipodeEquipos)
BEGIN
    INSERT INTO Tab_EQ_TipodeEquipos (CodTipodeEquipo, DesTipodeEquipo, RefTipodeEquipo, Estado)
    VALUES
        ('PC', 'PC ESCRITORIO', 'PC', 'ACTIVO'),
        ('LAP', 'LAPTOP', 'LAP', 'ACTIVO'),
        ('CEL', 'CELULAR', 'CEL', 'ACTIVO'),
        ('TAB', 'TABLET', 'TAB', 'ACTIVO'),
        ('MON', 'MONITOR', 'MON', 'ACTIVO'),
        ('TEC', 'TECLADO', 'TEC', 'ACTIVO'),
        ('MOU', 'MOUSE', 'MOU', 'ACTIVO'),
        ('IMP', 'IMPRESORA', 'IMP', 'ACTIVO'),
        ('AP', 'ACCESS POINT', 'AP', 'ACTIVO'),
        ('SW', 'SWITCH', 'SW', 'ACTIVO')
    PRINT 'Tipos de equipo insertados'
END
GO
