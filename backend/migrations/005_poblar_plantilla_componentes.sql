-- Plantilla de caracteristicas para todos los tipos de componente
-- Usa subconsultas para obtener los IdTipodeComponente automaticamente
-- Si no existe el tipo en tu BD, el INSERT simplemente no inserta nada

DECLARE @id INT

-- ============ COMPONENTES TECNICOS ============

-- PROCESADOR
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%PROCESADOR%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Socket', 'Socket', 0, 3),
(@id, 'Nucleos', 'Nucleos', 0, 4),
(@id, 'Frecuencia', 'Frecuencia', 0, 5),
(@id, 'Generacion', 'Generacion', 0, 6)

-- DISCO SSD
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%DISCO%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Capacidad', 'Capacidad', 1, 3),
(@id, 'TipoAlmacenamiento', 'Tipo almacenamiento', 0, 4),
(@id, 'Interfaz', 'Interfaz', 0, 5),
(@id, 'Velocidad', 'Velocidad', 0, 6),
(@id, 'Formato', 'Formato', 0, 7)

-- MEMORIA RAM
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%MEMORIA RAM%' OR DesTipodeComponente LIKE '%RAM%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Capacidad', 'Capacidad', 1, 2),
(@id, 'TipoMemoria', 'Tipo memoria', 0, 3),
(@id, 'Velocidad', 'Velocidad', 0, 4),
(@id, 'FactorForma', 'Factor forma', 0, 5)

-- PLACA MADRE
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%PLACA MADRE%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Socket', 'Socket', 0, 3),
(@id, 'Chipset', 'Chipset', 0, 4),
(@id, 'FactorForma', 'Factor forma', 0, 5),
(@id, 'RanurasRAM', 'Ranuras RAM', 0, 6)

-- FUENTE DE PODER
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%FUENTE%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Potencia', 'Potencia', 0, 3),
(@id, 'Certificacion', 'Certificacion', 0, 4),
(@id, 'FactorForma', 'Factor forma', 0, 5),
(@id, 'Modularidad', 'Modularidad', 0, 6)

-- MONITOR / PANTALLA
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%MONITOR%' OR DesTipodeComponente LIKE '%PANTALLA%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Pulgadas', 'Pulgadas', 0, 3),
(@id, 'Resolucion', 'Resolucion', 0, 4),
(@id, 'TipoPanel', 'Tipo panel', 0, 5),
(@id, 'TipoConexion', 'Tipo conexion', 0, 6)

-- IMPRESORA
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%IMPRESORA%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Tecnologia', 'Tecnologia', 0, 3),
(@id, 'TipoImpresion', 'Tipo impresion', 0, 4),
(@id, 'Color', 'Color', 0, 5),
(@id, 'Conexion', 'Conexion', 0, 6),
(@id, 'IP', 'IP', 0, 7)

-- SWITCH
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%SWITCH%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Puertos', 'Puertos', 0, 3),
(@id, 'Velocidad', 'Velocidad', 0, 4),
(@id, 'Administrable', 'Administrable', 0, 5),
(@id, 'MAC', 'MAC', 0, 6),
(@id, 'IP', 'IP', 0, 7)

-- ============ ACCESORIOS ============

-- CARGADOR
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%CARGADOR%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Potencia', 'Potencia', 0, 3),
(@id, 'Voltaje', 'Voltaje', 0, 4),
(@id, 'Amperaje', 'Amperaje', 0, 5),
(@id, 'Conector', 'Conector', 0, 6),
(@id, 'Compatibilidad', 'Compatibilidad', 0, 7)

-- MOUSE
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%MOUSE%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Conexion', 'Conexion', 0, 3),
(@id, 'Sensor', 'Sensor', 0, 4),
(@id, 'DPI', 'DPI', 0, 5)

-- TECLADO
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%TECLADO%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Conexion', 'Conexion', 0, 3),
(@id, 'Idioma', 'Idioma', 0, 4),
(@id, 'Distribucion', 'Distribucion', 0, 5)

-- MOCHILA
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%MOCHILA%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Tamano', 'Tamano', 0, 3),
(@id, 'Color', 'Color', 0, 4),
(@id, 'Material', 'Material', 0, 5)

-- BATERIA
SET @id = (SELECT TOP 1 IdTipodeComponente FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente LIKE '%BATERIA%')
IF @id IS NOT NULL
INSERT INTO Tab_Componente_PlantillaCaracteristicas (IdTipodeComponente, Clave, Etiqueta, Requerido, Orden) VALUES
(@id, 'Marca', 'Marca', 1, 1),
(@id, 'Modelo', 'Modelo', 1, 2),
(@id, 'Capacidad', 'Capacidad', 0, 3),
(@id, 'Voltaje', 'Voltaje', 0, 4),
(@id, 'Celdas', 'Celdas', 0, 5),
(@id, 'Compatibilidad', 'Compatibilidad', 0, 6)
