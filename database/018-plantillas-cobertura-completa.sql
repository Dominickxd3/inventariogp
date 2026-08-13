USE InventarioGP
GO

-- ==============================================================
-- Migration 018: Cobertura completa de tipos con plantilla
--
-- 1) IdUsuarioCrea en Tab_EQ_Componentes (usuario que registra)
-- 2) Catalogo VELOCIDAD_HDD (disco duro mecanico)
-- 3) Tipo MOCHILA (accesorio solicitado)
-- 4) Plantillas: DISCO DURO, TARJETA DE VIDEO, TONER, MOCHILA
--    -> todos los tipos pasan al esquema dinamico
--       (Tab_Componente_Caracteristicas), sin tablas por tipo.
-- ==============================================================

-- --------------------------------------------------------------
-- 1. Trazabilidad del registro: IdUsuarioCrea
-- --------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Tab_EQ_Componentes') AND name = 'IdUsuarioCrea')
    ALTER TABLE dbo.Tab_EQ_Componentes ADD IdUsuarioCrea INT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Componentes_UsuarioCrea')
    ALTER TABLE dbo.Tab_EQ_Componentes
    ADD CONSTRAINT FK_Componentes_UsuarioCrea
    FOREIGN KEY (IdUsuarioCrea) REFERENCES dbo.Tab_SYS_Usuarios(IdUsuario);
GO

PRINT 'IdUsuarioCrea agregado'
GO

-- --------------------------------------------------------------
-- 2. Catalogo VELOCIDAD_HDD
-- --------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'VELOCIDAD_HDD')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('VELOCIDAD_HDD', 'Velocidades de discos duros mecanicos (RPM)', 1);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('5400 RPM'),('7200 RPM'),('10000 RPM'),('15000 RPM')) v(NombreValor)
WHERE c.NombreCatalogo = 'VELOCIDAD_HDD'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

PRINT 'VELOCIDAD_HDD creado'
GO

-- --------------------------------------------------------------
-- 3. Tipo MOCHILA
-- --------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'MOCHILA')
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Categoria, Estado)
    VALUES ('MOC', N'MOCHILA', 'ACCESORIO', 'ACTIVO');
GO

PRINT 'MOCHILA creado'
GO

-- --------------------------------------------------------------
-- 4. Plantillas dinamicas
--    Metodo: insert idempotente por (tipo + Clave)
-- --------------------------------------------------------------
-- DISCO DURO
INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Marca', 'Marca', 'CATALOGO', 1, 1, 1, 1, 1, 1, c.IdCatalogo, NULL
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'MARCAS'
WHERE t.DesTipodeComponente = N'DISCO DURO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Marca');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Modelo', 'Modelo', 'TEXTO', 1, 2, 1, 1, 1, 2, NULL, NULL
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'DISCO DURO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Modelo');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Capacidad', 'Capacidad', 'CATALOGO', 1, 3, 1, 1, 1, 3, c.IdCatalogo, 'Ej: 1TB, 2TB'
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'CAPACIDADES_ALMACENAMIENTO'
WHERE t.DesTipodeComponente = N'DISCO DURO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Capacidad');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Interfaz', 'Interfaz', 'CATALOGO', 0, 4, 1, 1, 0, NULL, c.IdCatalogo, 'Ej: SATA, NVMe'
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'INTERFACES'
WHERE t.DesTipodeComponente = N'DISCO DURO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Interfaz');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Velocidad', 'Velocidad', 'CATALOGO', 0, 5, 1, 1, 0, NULL, c.IdCatalogo, 'Ej: 7200 RPM'
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'VELOCIDAD_HDD'
WHERE t.DesTipodeComponente = N'DISCO DURO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Velocidad');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Formato', 'Formato', 'CATALOGO', 0, 6, 1, 0, 0, NULL, c.IdCatalogo, 'Ej: 3.5 pulgadas'
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'FORMATOS_ALMACENAMIENTO'
WHERE t.DesTipodeComponente = N'DISCO DURO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Formato');
GO

-- TARJETA DE VIDEO
INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Marca', 'Marca', 'CATALOGO', 1, 1, 1, 1, 1, 1, c.IdCatalogo, NULL
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'MARCAS'
WHERE t.DesTipodeComponente = N'TARJETA DE VIDEO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Marca');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Modelo', 'Modelo', 'TEXTO', 1, 2, 1, 1, 1, 2, NULL, NULL
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'TARJETA DE VIDEO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Modelo');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Memoria', 'Memoria', 'TEXTO', 0, 3, 1, 1, 0, NULL, NULL, 'Ej: 6GB GDDR6'
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'TARJETA DE VIDEO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Memoria');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Conector', 'Conector', 'CATALOGO', 0, 4, 1, 1, 0, NULL, c.IdCatalogo, 'Ej: HDMI'
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'INTERFACES'
WHERE t.DesTipodeComponente = N'TARJETA DE VIDEO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Conector');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'FactorForma', 'Factor forma', 'TEXTO', 0, 5, 1, 0, 0, NULL, NULL, 'Ej: Low profile'
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'TARJETA DE VIDEO'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'FactorForma');
GO

-- TONER
INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Marca', 'Marca', 'CATALOGO', 1, 1, 1, 1, 1, 1, c.IdCatalogo, NULL
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'MARCAS'
WHERE t.DesTipodeComponente = N'TONER'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Marca');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Modelo', 'Modelo', 'TEXTO', 1, 2, 1, 1, 1, 2, NULL, NULL
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'TONER'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Modelo');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Color', 'Color', 'CATALOGO', 0, 3, 1, 1, 0, NULL, c.IdCatalogo, 'Ej: Negra'
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'COLORES'
WHERE t.DesTipodeComponente = N'TONER'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Color');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Rendimiento', 'Rendimiento', 'TEXTO', 0, 4, 1, 0, 0, NULL, NULL, 'Ej: 1200 paginas'
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'TONER'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Rendimiento');
GO

-- MOCHILA
INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Marca', 'Marca', 'CATALOGO', 1, 1, 1, 1, 1, 1, c.IdCatalogo, NULL
FROM Tab_EQ_TipodeComponentes t
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'MARCAS'
WHERE t.DesTipodeComponente = N'MOCHILA'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Marca');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Modelo', 'Modelo', 'TEXTO', 1, 2, 1, 1, 1, 2, NULL, NULL
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'MOCHILA'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Modelo');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Tamanho', 'Tamaño', 'TEXTO', 0, 3, 1, 1, 0, NULL, NULL, 'Ej: 15.6 pulgadas'
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'MOCHILA'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Tamanho');
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Activo,
     MostrarEnGrilla, MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Ejemplo)
SELECT t.IdTipodeComponente, 'Material', 'Material', 'TEXTO', 0, 4, 1, 1, 0, NULL, NULL, 'Ej: Poliester'
FROM Tab_EQ_TipodeComponentes t
WHERE t.DesTipodeComponente = N'MOCHILA'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = 'Material');
GO

PRINT 'Plantillas completadas: DISCO DURO, TARJETA DE VIDEO, TONER, MOCHILA'
GO