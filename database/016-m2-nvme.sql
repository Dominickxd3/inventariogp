USE InventarioGP
GO

-- ==============================================================
-- Migration 016: Tipo "M.2 NVME" + plantilla de caracteristicas
-- ==============================================================

IF NOT EXISTS (SELECT 1 FROM Tab_EQ_TipodeComponentes WHERE DesTipodeComponente = N'M.2 NVME')
BEGIN
    INSERT INTO Tab_EQ_TipodeComponentes (CodTipodeComponente, DesTipodeComponente, Categoria, Estado)
    VALUES ('M2N', N'M.2 NVME', N'REPUESTO_TECNICO', 'ACTIVO')
    PRINT 'Tipo M.2 NVME creado'
END
GO

INSERT INTO Tab_Componente_PlantillaCaracteristicas
    (IdTipodeComponente, Clave, Etiqueta, TipoDato, Requerido, Orden, Ejemplo,
     MostrarEnDescripcion, OrdenDescripcion, IdCatalogo, Activo)
SELECT t.IdTipodeComponente, v.Clave, v.Etiqueta, v.TipoDato, v.Requerido, v.Orden, v.Ejemplo,
       v.MostrarEnDescripcion, v.OrdenDescripcion, c.IdCatalogo, 1
FROM Tab_EQ_TipodeComponentes t
CROSS APPLY (VALUES
    (N'Marca',            N'Marca',              'CATALOGO', 1, 1, N'Ej: Samsung',           1, 1, 'MARCAS'),
    (N'Modelo',           N'Modelo',             'TEXTO',    0, 2, N'Ej: 980 Pro',           1, 2, NULL),
    (N'Capacidad',        N'Capacidad',          'CATALOGO', 1, 3, N'Ej: 1TB',               1, 3, 'CAPACIDADES_ALMACENAMIENTO'),
    (N'Interfaz',         N'Interfaz',           'CATALOGO', 0, 4, N'Ej: NVMe',              0, NULL, 'INTERFACES'),
    (N'Velocidad',        N'Velocidad',          'CATALOGO', 0, 5, N'Ej: 7000 MB/s',         0, NULL, 'VELOCIDAD_SSD'),
    (N'Formato',          N'Formato',            'CATALOGO', 1, 6, N'Ej: M.2',               1, 4, 'FORMATOS_ALMACENAMIENTO')
) v(Clave, Etiqueta, TipoDato, Requerido, Orden, Ejemplo, MostrarEnDescripcion, OrdenDescripcion, CatalogoNombre)
LEFT JOIN Mae_Catalogos c ON c.NombreCatalogo = v.CatalogoNombre
WHERE t.DesTipodeComponente = N'M.2 NVME'
  AND NOT EXISTS (SELECT 1 FROM Tab_Componente_PlantillaCaracteristicas p
                  WHERE p.IdTipodeComponente = t.IdTipodeComponente AND p.Clave = v.Clave);
GO

PRINT 'Plantilla M.2 NVME creada'
GO

SELECT t.DesTipodeComponente, p.Orden, p.Clave, p.Etiqueta, p.TipoDato, c.NombreCatalogo
FROM Tab_EQ_TipodeComponentes t
JOIN Tab_Componente_PlantillaCaracteristicas p ON t.IdTipodeComponente = p.IdTipodeComponente
LEFT JOIN Mae_Catalogos c ON p.IdCatalogo = c.IdCatalogo
WHERE t.DesTipodeComponente = N'M.2 NVME' AND p.Activo = 1
ORDER BY p.Orden
GO
