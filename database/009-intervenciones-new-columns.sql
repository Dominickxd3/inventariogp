-- Agrega columnas para tipos dinámicos de intervención técnica
ALTER TABLE Tab_EQ_IntervencionesTecnicas
  ADD PiezaAfectada NVARCHAR(50) NULL,
      ComponenteRetiradoNoInventariado BIT DEFAULT 0,
      Resultado NVARCHAR(50) NULL,
      RequiereReparacion BIT NULL,
      SoftwareInstalado NVARCHAR(200) NULL,
      Version NVARCHAR(50) NULL,
      MotivoBaja NVARCHAR(50) NULL;
