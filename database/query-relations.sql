USE InventarioGP
GO

SELECT 
    OBJECT_NAME(fk.parent_object_id) as TablaHija,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) as ColumnaHija,
    OBJECT_NAME(fk.referenced_object_id) as TablaPadre,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) as ColumnaPadre
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
ORDER BY TablaHija
GO

PRINT '---'
GO

SELECT 
    TABLE_NAME, 
    COLUMN_NAME, 
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_CATALOG = 'InventarioGP'
ORDER BY TABLE_NAME, ORDINAL_POSITION
GO
