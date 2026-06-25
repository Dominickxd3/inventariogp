-- ============================================================
-- Corrección de codificación UTF-8 / NVARCHAR
-- ============================================================
-- Corrige datos corruptos insertados sin prefijo N
-- antes de que la tabla usara NVARCHAR.
-- ============================================================

-- 1. Corregir Tab_EQ_PlantillaCaracteristicas (datos existentes corruptos)
UPDATE Tab_EQ_PlantillaCaracteristicas
SET Etiqueta = N'Estado Físico'
WHERE Etiqueta LIKE N'%FÃ­sico%' OR Etiqueta LIKE N'%F?sico%' OR Etiqueta LIKE N'%FÃ­sico%';

UPDATE Tab_EQ_PlantillaCaracteristicas
SET Etiqueta = N'Tipo de Impresión'
WHERE Etiqueta LIKE N'%ImpresiÃ³n%' OR Etiqueta LIKE N'%Impresi?n%';

UPDATE Tab_EQ_PlantillaCaracteristicas
SET Etiqueta = N'Resolución'
WHERE Etiqueta LIKE N'%ResoluciÃ³n%' OR Etiqueta LIKE N'%Resoluci?n%';

UPDATE Tab_EQ_PlantillaCaracteristicas
SET Etiqueta = N'Tipo de Conexión'
WHERE Etiqueta LIKE N'%ConexiÃ³n%' OR Etiqueta LIKE N'%Conexi?n%';

UPDATE Tab_EQ_PlantillaCaracteristicas
SET Etiqueta = N'Ubicación'
WHERE Etiqueta LIKE N'%UbicaciÃ³n%' OR Etiqueta LIKE N'%Ubicaci?n%';

UPDATE Tab_EQ_PlantillaCaracteristicas
SET Etiqueta = N'Cargador Incluido'
WHERE Etiqueta LIKE N'%Cargador%' AND (Etiqueta LIKE N'%IncluÃ­do%' OR Etiqueta LIKE N'%Inclu?do%');

UPDATE Tab_EQ_PlantillaCaracteristicas
SET Etiqueta = N'Sistema Operativo'
WHERE Etiqueta LIKE N'%Sistema%' AND (Etiqueta LIKE N'%OperatÃ­vo%' OR Etiqueta LIKE N'%Operat?vo%');

-- 2. Si hay datos en Tab_EQ_CaracteristicasEquipo con Clave corrupta, corregir
UPDATE Tab_EQ_CaracteristicasEquipo
SET Clave = N'EstadoFisico'
WHERE Clave LIKE N'%FÃ­sico%' OR Clave LIKE N'%F?sico%';

UPDATE Tab_EQ_CaracteristicasEquipo
SET Valor = N'Estado Físico'
WHERE Valor LIKE N'%FÃ­sico%' OR Valor LIKE N'%F?sico%';

UPDATE Tab_EQ_CaracteristicasEquipo
SET Valor = N'Resolución'
WHERE Valor LIKE N'%ResoluciÃ³n%' OR Valor LIKE N'%Resoluci?n%';

UPDATE Tab_EQ_CaracteristicasEquipo
SET Valor = N'Tipo de Conexión'
WHERE Valor LIKE N'%ConexiÃ³n%' OR Valor LIKE N'%Conexi?n%';

UPDATE Tab_EQ_CaracteristicasEquipo
SET Valor = N'Ubicación'
WHERE Valor LIKE N'%UbicaciÃ³n%' OR Valor LIKE N'%Ubicaci?n%';
