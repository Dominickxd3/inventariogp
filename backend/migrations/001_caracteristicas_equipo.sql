-- Migration: Tabla de características técnicas por equipo
-- Crea la tabla Tab_EQ_CaracteristicasEquipo para almacenar
-- fichas técnicas flexibles por tipo de equipo

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tab_EQ_CaracteristicasEquipo')
BEGIN
  CREATE TABLE Tab_EQ_CaracteristicasEquipo (
    IdCaracteristica INT IDENTITY(1,1) PRIMARY KEY,
    IdMaeEquipo INT NOT NULL,
    Clave VARCHAR(100) NOT NULL,
    Valor VARCHAR(500) NULL,
    FecRegistro DATETIME DEFAULT GETDATE(),
    IdUsuarioCrea INT NULL,
    IdUsuarioModifica INT NULL,
    FecModificacion DATETIME NULL,
    CONSTRAINT FK_Caracteristicas_Equipo
      FOREIGN KEY (IdMaeEquipo) REFERENCES Tab_EQ_MaeEquipos(IdMaeEquipo)
  );

  CREATE INDEX IX_Caracteristicas_IdMaeEquipo
    ON Tab_EQ_CaracteristicasEquipo(IdMaeEquipo);

  PRINT 'Tabla Tab_EQ_CaracteristicasEquipo creada correctamente.';
END
ELSE
BEGIN
  PRINT 'La tabla Tab_EQ_CaracteristicasEquipo ya existe.';
END
