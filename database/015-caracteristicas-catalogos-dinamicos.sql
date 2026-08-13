USE InventarioGP
GO

-- ==============================================================
-- Migration 015: Caracteristicas dinamicas - Catalogos contextuales
--
-- 1) Crea catalogos especificos por contexto (sin mezclar datos)
-- 2) Carga valores recomendados
-- 3) Normaliza TipoDato de la plantilla (CATALOGO / TEXTO / NUMERO)
-- 4) Mapea cada caracteristica de plantilla a su catalogo
-- ==============================================================

-- --------------------------------------------------------------
-- 1. Crear catalogos (idempotente por nombre)
-- --------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'TIPOS_MEMORIA')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('TIPOS_MEMORIA', 'Tipos de memoria RAM', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'CAPACIDADES_RAM')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('CAPACIDADES_RAM', 'Capacidades de memoria RAM', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'CAPACIDADES_ALMACENAMIENTO')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('CAPACIDADES_ALMACENAMIENTO', 'Capacidades de discos/almacenamiento', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'FORMATOS_ALMACENAMIENTO')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('FORMATOS_ALMACENAMIENTO', 'Formatos de discos/almacenamiento', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'TECNOLOGIAS_ALMACENAMIENTO')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('TECNOLOGIAS_ALMACENAMIENTO', 'Tecnologia de discos (SSD/HDD/eMMC)', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'INTERFACES')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('INTERFACES', 'Interfaces de conexion', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'SOCKETS')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('SOCKETS', 'Sockets de CPU', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'CONECTORES')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('CONECTORES', 'Conectores y puertos', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'POTENCIAS')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('POTENCIAS', 'Potencias en watts', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'VOLTAJES')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('VOLTAJES', 'Voltajes en V', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'VELOCIDAD_RAM')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('VELOCIDAD_RAM', 'Velocidades de memoria RAM (MHz)', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'VELOCIDAD_SSD')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('VELOCIDAD_SSD', 'Velocidades de unidades SSD (MB/s)', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'VELOCIDAD_SWITCH')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('VELOCIDAD_SWITCH', 'Velocidades de switches', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'FACTOR_FORMA')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('FACTOR_FORMA', 'Factor de forma de memoria RAM', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'PUERTOS_SWITCH')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('PUERTOS_SWITCH', 'Cantidad de puertos en switches', 1);
GO

IF NOT EXISTS (SELECT 1 FROM Mae_Catalogos WHERE NombreCatalogo = 'SI_NO')
    INSERT INTO Mae_Catalogos (NombreCatalogo, Descripcion, Activo)
    VALUES ('SI_NO', 'Valores booleanos SI / NO', 1);
GO

PRINT 'Catalogos creados/validados'
GO

-- --------------------------------------------------------------
-- 2. Cargar valores recomendados (idempotente)
-- --------------------------------------------------------------
INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('DDR3'),('DDR4'),('DDR5'),('LPDDR4'),('LPDDR5')) v(NombreValor)
WHERE c.NombreCatalogo = 'TIPOS_MEMORIA'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('4GB'),('8GB'),('16GB'),('32GB'),('64GB')) v(NombreValor)
WHERE c.NombreCatalogo = 'CAPACIDADES_RAM'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('128GB'),('256GB'),('512GB'),('1TB'),('2TB')) v(NombreValor)
WHERE c.NombreCatalogo = 'CAPACIDADES_ALMACENAMIENTO'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('2.5 pulgadas'),('3.5 pulgadas'),('M.2'),('USB'),('MicroSD')) v(NombreValor)
WHERE c.NombreCatalogo = 'FORMATOS_ALMACENAMIENTO'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('SSD'),('HDD'),('eMMC')) v(NombreValor)
WHERE c.NombreCatalogo = 'TECNOLOGIAS_ALMACENAMIENTO'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('SATA'),('NVMe'),('USB'),('HDMI'),('DisplayPort')) v(NombreValor)
WHERE c.NombreCatalogo = 'INTERFACES'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('LGA1700'),('LGA1200'),('AM4'),('AM5')) v(NombreValor)
WHERE c.NombreCatalogo = 'SOCKETS'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('USB-C'),('USB-A'),('HDMI'),('RJ45'),('DC Jack')) v(NombreValor)
WHERE c.NombreCatalogo = 'CONECTORES'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('45W'),('65W'),('90W'),('120W')) v(NombreValor)
WHERE c.NombreCatalogo = 'POTENCIAS'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('5V'),('12V'),('19V'),('20V')) v(NombreValor)
WHERE c.NombreCatalogo = 'VOLTAJES'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('2133 MHz'),('2400 MHz'),('3200 MHz'),('3600 MHz'),('4800 MHz'),('5600 MHz')) v(NombreValor)
WHERE c.NombreCatalogo = 'VELOCIDAD_RAM'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('3500 MB/s'),('5000 MB/s'),('7000 MB/s')) v(NombreValor)
WHERE c.NombreCatalogo = 'VELOCIDAD_SSD'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('10/100'),('10/100/1000'),('10Gbps')) v(NombreValor)
WHERE c.NombreCatalogo = 'VELOCIDAD_SWITCH'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('DIMM'),('SODIMM')) v(NombreValor)
WHERE c.NombreCatalogo = 'FACTOR_FORMA'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('8'),('16'),('24'),('48')) v(NombreValor)
WHERE c.NombreCatalogo = 'PUERTOS_SWITCH'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('SI'),('NO')) v(NombreValor)
WHERE c.NombreCatalogo = 'SI_NO'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

-- CERTIFICACIONES (catalogo existente, se le cargan valores)
INSERT INTO Mae_CatalogoValores (IdCatalogo, NombreValor)
SELECT c.IdCatalogo, v.NombreValor
FROM Mae_Catalogos c
CROSS APPLY (VALUES ('80 PLUS'),('80 PLUS Bronze'),('80 PLUS Silver'),('80 PLUS Gold'),('80 PLUS Platinum'),('80 PLUS Titanium')) v(NombreValor)
WHERE c.NombreCatalogo = 'CERTIFICACIONES'
  AND NOT EXISTS (SELECT 1 FROM Mae_CatalogoValores x WHERE x.IdCatalogo = c.IdCatalogo AND x.NombreValor = v.NombreValor);
GO

PRINT 'Valores de catalogos cargados'
GO

-- --------------------------------------------------------------
-- 3. Normalizar TipoDato de la plantilla
--    Solo se permiten: CATALOGO, TEXTO, NUMERO
-- --------------------------------------------------------------
UPDATE Tab_Componente_PlantillaCaracteristicas
SET TipoDato = UPPER(LTRIM(RTRIM(ISNULL(TipoDato, ''))))
WHERE Activo = 1;
GO

UPDATE Tab_Componente_PlantillaCaracteristicas
SET TipoDato = 'TEXTO'
WHERE Activo = 1 AND TipoDato NOT IN ('CATALOGO', 'TEXTO', 'NUMERO');
GO

PRINT 'TipoDato normalizado'
GO

-- --------------------------------------------------------------
-- 4. Mapear caracteristicas de plantilla a catalogos
-- --------------------------------------------------------------
-- MEMORIA RAM
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'CAPACIDADES_RAM'
WHERE tc.DesTipodeComponente = N'MEMORIA RAM' AND pc.Clave = 'Capacidad';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'TIPOS_MEMORIA'
WHERE tc.DesTipodeComponente = N'MEMORIA RAM' AND pc.Clave = 'TipoMemoria';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'VELOCIDAD_RAM'
WHERE tc.DesTipodeComponente = N'MEMORIA RAM' AND pc.Clave = 'Velocidad';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'FACTOR_FORMA'
WHERE tc.DesTipodeComponente = N'MEMORIA RAM' AND pc.Clave = 'FactorForma';
GO

-- DISCO SSD
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'CAPACIDADES_ALMACENAMIENTO'
WHERE tc.DesTipodeComponente = N'DISCO SSD' AND pc.Clave = 'Capacidad';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'TECNOLOGIAS_ALMACENAMIENTO'
WHERE tc.DesTipodeComponente = N'DISCO SSD' AND pc.Clave = 'TipoAlmacenamiento';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'INTERFACES'
WHERE tc.DesTipodeComponente = N'DISCO SSD' AND pc.Clave = 'Interfaz';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'VELOCIDAD_SSD'
WHERE tc.DesTipodeComponente = N'DISCO SSD' AND pc.Clave = 'Velocidad';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'FORMATOS_ALMACENAMIENTO'
WHERE tc.DesTipodeComponente = N'DISCO SSD' AND pc.Clave = 'Formato';
GO

-- CARGADOR
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'POTENCIAS'
WHERE tc.DesTipodeComponente = N'CARGADOR' AND pc.Clave = 'Potencia';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'VOLTAJES'
WHERE tc.DesTipodeComponente = N'CARGADOR' AND pc.Clave = 'Voltaje';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'CONECTORES'
WHERE tc.DesTipodeComponente = N'CARGADOR' AND pc.Clave = 'Conector';
GO

-- FUENTE DE PODER
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'POTENCIAS'
WHERE tc.DesTipodeComponente = N'FUENTE DE PODER' AND pc.Clave = 'Potencia';
GO
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'CERTIFICACIONES'
WHERE tc.DesTipodeComponente = N'FUENTE DE PODER' AND pc.Clave = 'Certificacion';
GO

-- PROCESADOR
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'SOCKETS'
WHERE tc.DesTipodeComponente = N'PROCESADOR' AND pc.Clave = 'Socket';
GO

-- PLACA MADRE
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'SOCKETS'
WHERE tc.DesTipodeComponente = N'PLACA MADRE' AND pc.Clave = 'Socket';
GO

-- Conexiones / conectores
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'CONECTORES'
WHERE tc.DesTipodeComponente IN (N'ADAPTADOR', N'CABLE', N'MOUSE', N'TECLADO', N'PANTALLA', N'CARGADOR')
  AND pc.Clave IN ('Entrada', 'Salida', 'TipoConexion', 'Conexion', 'Conector', 'TipoConexion');
GO

-- BATERIA: Voltaje -> VOLTAJES
UPDATE pc SET pc.TipoDato = 'CATALOGO', pc.IdCatalogo = c.IdCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
JOIN Mae_Catalogos c ON c.NombreCatalogo = 'VOLTAJES'
WHERE tc.DesTipodeComponente = N'BATERIA' AND pc.Clave = 'Voltaje';
GO

-- --------------------------------------------------------------
-- 5. Campos NUMERO (opcional, solo los que aplican)
-- --------------------------------------------------------------
UPDATE pc SET pc.TipoDato = 'NUMERO'
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
WHERE (tc.DesTipodeComponente = N'PROCESADOR' AND pc.Clave = 'Nucleos')
   OR (tc.DesTipodeComponente = N'MOUSE' AND pc.Clave = 'DPI')
   OR (tc.DesTipodeComponente = N'BATERIA' AND pc.Clave = 'Celdas')
   OR (tc.DesTipodeComponente = N'PLACA MADRE' AND pc.Clave = 'RanurasRAM');
GO

PRINT 'Plantillas mapeadas a catalogos'
GO

SELECT tc.DesTipodeComponente, pc.Clave, pc.Etiqueta, pc.TipoDato, c.NombreCatalogo
FROM Tab_Componente_PlantillaCaracteristicas pc
JOIN Tab_EQ_TipodeComponentes tc ON pc.IdTipodeComponente = tc.IdTipodeComponente
LEFT JOIN Mae_Catalogos c ON pc.IdCatalogo = c.IdCatalogo
WHERE pc.Activo = 1
ORDER BY tc.DesTipodeComponente, pc.Orden
GO
