-- Agrega columnas de origen, motivo e intervención a Tab_EQ_MovEquiposComponentes
ALTER TABLE Tab_EQ_MovEquiposComponentes
  ADD OrigenVinculo NVARCHAR(30) NULL,
      Motivo NVARCHAR(500) NULL,
      FecInstalacion DATETIME NULL,
      IdIntervencion INT NULL;
