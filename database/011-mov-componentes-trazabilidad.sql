USE InventarioGP
GO

IF COL_LENGTH('dbo.Tab_EQ_MovEquiposComponentes', 'IdIntervencion') IS NULL
BEGIN
    ALTER TABLE dbo.Tab_EQ_MovEquiposComponentes
    ADD IdIntervencion INT NULL;
END;
GO

IF COL_LENGTH('dbo.Tab_EQ_MovEquiposComponentes', 'OrigenVinculo') IS NULL
BEGIN
    ALTER TABLE dbo.Tab_EQ_MovEquiposComponentes
    ADD OrigenVinculo NVARCHAR(30) NULL;
END;
GO

IF COL_LENGTH('dbo.Tab_EQ_MovEquiposComponentes', 'Motivo') IS NULL
BEGIN
    ALTER TABLE dbo.Tab_EQ_MovEquiposComponentes
    ADD Motivo NVARCHAR(500) NULL;
END;
GO

IF COL_LENGTH('dbo.Tab_EQ_MovEquiposComponentes', 'FecInstalacion') IS NULL
BEGIN
    ALTER TABLE dbo.Tab_EQ_MovEquiposComponentes
    ADD FecInstalacion DATETIME NULL
        CONSTRAINT DF_Tab_EQ_MovEquiposComponentes_FecInstalacion DEFAULT GETDATE();
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Tab_EQ_MovEquiposComponentes_IdIntervencion'
)
AND COL_LENGTH('dbo.Tab_EQ_MovEquiposComponentes', 'IdIntervencion') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Tab_EQ_MovEquiposComponentes
    ADD CONSTRAINT FK_Tab_EQ_MovEquiposComponentes_IdIntervencion
        FOREIGN KEY (IdIntervencion) REFERENCES Tab_EQ_IntervencionesTecnicas(IdIntervencion);
END;
GO
