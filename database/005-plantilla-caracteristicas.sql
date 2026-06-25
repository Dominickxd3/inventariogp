-- ============================================================
-- FASE 1: Plantillas de Características Técnicas
-- ============================================================
-- Crea la tabla de plantillas y agrega IdPlantilla a
-- Tab_EQ_CaracteristicasEquipo.
-- ============================================================

-- 1. Tabla de plantillas por tipo de equipo
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Tab_EQ_PlantillaCaracteristicas') AND type = 'U')
BEGIN
  CREATE TABLE Tab_EQ_PlantillaCaracteristicas (
    IdPlantilla INT IDENTITY(1,1) PRIMARY KEY,
    IdTipodeEquipo INT NOT NULL,
    Clave VARCHAR(100) NOT NULL,
    Etiqueta NVARCHAR(150) NOT NULL,
    TipoDato NVARCHAR(30) NOT NULL DEFAULT N'texto',
    Requerido BIT NOT NULL DEFAULT 0,
    Orden INT NOT NULL DEFAULT 0,
    Activo BIT NOT NULL DEFAULT 1,
    FecRegistro DATETIME NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (IdTipodeEquipo) REFERENCES Tab_EQ_TipodeEquipos(IdTipodeEquipo)
  );
END;

-- 2. Agregar IdPlantilla a la tabla de características existente
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'Tab_EQ_CaracteristicasEquipo') AND name = 'IdPlantilla')
BEGIN
  ALTER TABLE Tab_EQ_CaracteristicasEquipo
  ADD IdPlantilla INT NULL
    FOREIGN KEY REFERENCES Tab_EQ_PlantillaCaracteristicas(IdPlantilla);
END;

-- 3. Seed: Plantilla para LAPTOP
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'Marca',            N'Marca',              N'texto',  1, 1),
    (N'Modelo',           N'Modelo',             N'texto',  1, 2),
    (N'Procesador',       N'Procesador',         N'texto',  0, 3),
    (N'RAM',              N'RAM',                N'texto',  0, 4),
    (N'Almacenamiento',   N'Almacenamiento',     N'texto',  0, 5),
    (N'SistemaOperativo', N'Sistema Operativo',  N'texto',  0, 6),
    (N'CargadorIncluido', N'Cargador Incluido',  N'texto',  0, 7),
    (N'EstadoFisico',     N'Estado Físico',      N'texto',  0, 8)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo = N'LAPTOP'
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);

-- 4. Seed: Plantilla para CELULAR
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'Marca',            N'Marca',              N'texto',  1, 1),
    (N'Modelo',           N'Modelo',             N'texto',  1, 2),
    (N'IMEI',             N'IMEI',               N'texto',  0, 3),
    (N'RAM',              N'RAM',                N'texto',  0, 4),
    (N'Almacenamiento',   N'Almacenamiento',     N'texto',  0, 5),
    (N'Color',            N'Color',              N'texto',  0, 6),
    (N'CargadorIncluido', N'Cargador Incluido',  N'texto',  0, 7),
    (N'EstadoFisico',     N'Estado Físico',      N'texto',  0, 8)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo = N'CELULAR'
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);

-- 5. Seed: Plantilla para TABLET
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'Marca',            N'Marca',              N'texto',  1, 1),
    (N'Modelo',           N'Modelo',             N'texto',  1, 2),
    (N'IMEI',             N'IMEI',               N'texto',  0, 3),
    (N'Almacenamiento',   N'Almacenamiento',     N'texto',  0, 4),
    (N'Color',            N'Color',              N'texto',  0, 5),
    (N'EstadoFisico',     N'Estado Físico',      N'texto',  0, 6)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo = N'TABLET'
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);

-- 6. Seed: Plantilla para MONITOR
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'Marca',            N'Marca',              N'texto',  1, 1),
    (N'Modelo',           N'Modelo',             N'texto',  1, 2),
    (N'Serie',            N'Serie',              N'texto',  0, 3),
    (N'Pulgadas',         N'Pulgadas',           N'texto',  0, 4),
    (N'Resolucion',       N'Resolución',         N'texto',  0, 5),
    (N'TipoConexion',     N'Tipo de Conexión',   N'texto',  0, 6),
    (N'EstadoFisico',     N'Estado Físico',      N'texto',  0, 7)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo = N'MONITOR'
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);

-- 7. Seed: Plantilla para IMPRESORA
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'Marca',            N'Marca',              N'texto',  1, 1),
    (N'Modelo',           N'Modelo',             N'texto',  1, 2),
    (N'Serie',            N'Serie',              N'texto',  0, 3),
    (N'TipoImpresion',    N'Tipo de Impresión',  N'texto',  0, 4),
    (N'Conectividad',     N'Conectividad',       N'texto',  0, 5),
    (N'IP',               N'IP',                 N'texto',  0, 6),
    (N'EstadoFisico',     N'Estado Físico',      N'texto',  0, 7)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo = N'IMPRESORA'
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);

-- 8. Seed: Plantilla para SWITCH
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'Marca',            N'Marca',              N'texto',  1, 1),
    (N'Modelo',           N'Modelo',             N'texto',  1, 2),
    (N'Serie',            N'Serie',              N'texto',  0, 3),
    (N'Puertos',          N'Puertos',            N'texto',  0, 4),
    (N'MAC',              N'MAC',                N'texto',  0, 5),
    (N'IP',               N'IP',                 N'texto',  0, 6),
    (N'Ubicacion',        N'Ubicación',          N'texto',  0, 7)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo = N'SWITCH'
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);

-- 9. Seed: Plantilla para ACCESS POINT
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'Marca',            N'Marca',              N'texto',  1, 1),
    (N'Modelo',           N'Modelo',             N'texto',  1, 2),
    (N'Serie',            N'Serie',              N'texto',  0, 3),
    (N'MAC',              N'MAC',                N'texto',  0, 4),
    (N'IP',               N'IP',                 N'texto',  0, 5),
    (N'Ubicacion',        N'Ubicación',          N'texto',  0, 6)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo = N'ACCESS POINT'
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);

-- 10. Seed: Plantilla para PC ESCRITORIO (datos generales opcionales)
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'MarcaCase',        N'Marca / Case',       N'texto',  0, 1),
    (N'SistemaOperativo', N'Sistema Operativo',  N'texto',  0, 2),
    (N'EstadoFisico',     N'Estado Físico',      N'texto',  0, 3),
    (N'Ubicacion',        N'Ubicación',          N'texto',  0, 4)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo = N'PC ESCRITORIO'
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);

-- 11. Seed: Plantilla para TECLADO y MOUSE (como accesorios)
INSERT INTO Tab_EQ_PlantillaCaracteristicas (IdTipodeEquipo, Clave, Etiqueta, TipoDato, Requerido, Orden)
SELECT t.IdTipodeEquipo, v.*
FROM Tab_EQ_TipodeEquipos t
CROSS APPLY (
  VALUES
    (N'Marca',            N'Marca',              N'texto',  1, 1),
    (N'Modelo',           N'Modelo',             N'texto',  1, 2),
    (N'EstadoFisico',     N'Estado Físico',      N'texto',  0, 3)
) v(Clave, Etiqueta, TipoDato, Requerido, Orden)
WHERE t.DesTipodeEquipo IN (N'TECLADO', N'MOUSE')
  AND NOT EXISTS (SELECT 1 FROM Tab_EQ_PlantillaCaracteristicas p WHERE p.IdTipodeEquipo = t.IdTipodeEquipo AND p.Clave = v.Clave);
