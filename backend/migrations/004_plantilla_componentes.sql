-- Plantilla de caracteristicas para tipos de componente
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tab_Componente_PlantillaCaracteristicas' AND xtype='U')
BEGIN
  CREATE TABLE Tab_Componente_PlantillaCaracteristicas (
    IdPlantilla INT IDENTITY(1,1) PRIMARY KEY,
    IdTipodeComponente INT NOT NULL,
    Clave VARCHAR(100) NOT NULL,
    Etiqueta VARCHAR(200) NOT NULL,
    TipoDato VARCHAR(50) DEFAULT 'texto',
    Requerido BIT DEFAULT 0,
    Orden INT DEFAULT 1,
    Activo BIT DEFAULT 1,
    FecRegistro DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_PlantillaComp_Tipo FOREIGN KEY (IdTipodeComponente) REFERENCES Tab_EQ_TipodeComponentes(IdTipodeComponente)
  );
END

-- Valores de caracteristicas por componente
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tab_Componente_Caracteristicas' AND xtype='U')
BEGIN
  CREATE TABLE Tab_Componente_Caracteristicas (
    IdCaracteristica INT IDENTITY(1,1) PRIMARY KEY,
    IdComponente INT NOT NULL,
    IdPlantilla INT NOT NULL,
    Clave VARCHAR(100) NOT NULL,
    Valor VARCHAR(500) NULL,
    IdUsuarioCrea INT NULL,
    FecRegistro DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_CaracComp_Componente FOREIGN KEY (IdComponente) REFERENCES Tab_EQ_Componentes(IdComponente),
    CONSTRAINT FK_CaracComp_Plantilla FOREIGN KEY (IdPlantilla) REFERENCES Tab_Componente_PlantillaCaracteristicas(IdPlantilla)
  );
END

-- Ejemplos de plantilla para tipos existentes (ajusta los IdTipodeComponente segun tu DB)
-- INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
-- (1, 'Socket', 'Socket', 0, 1),       -- PLACA MADRE
-- (1, 'Chipset', 'Chipset', 0, 2),
-- (1, 'FactorForma', 'Factor Forma', 0, 3),
-- (1, 'SlotsRAM', 'Slots RAM', 0, 4);
