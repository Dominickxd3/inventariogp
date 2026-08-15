-- Migración: flag GeneraActa por tipo de equipo
-- Algunos tipos (p.ej. PC ESCRITORIO) se asignan internamente sin acta de entrega.

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Tab_EQ_TipodeEquipos') AND name = 'GeneraActa')
BEGIN
    ALTER TABLE Tab_EQ_TipodeEquipos ADD GeneraActa BIT NOT NULL CONSTRAINT DF_Tab_EQ_TipodeEquipos_GeneraActa DEFAULT (1);
    PRINT '-> Columna GeneraActa agregada a Tab_EQ_TipodeEquipos';
END
ELSE
    PRINT '-> GeneraActa ya existía en Tab_EQ_TipodeEquipos';

-- PC ESCRITORIO: se asigna internamente, NO genera acta
UPDATE Tab_EQ_TipodeEquipos SET GeneraActa = 0 WHERE UPPER(REPLACE(DesTipodeEquipo, ' ', '')) = 'PCESCRITORIO';

SELECT IdTipodeEquipo, DesTipodeEquipo, GeneraActa FROM Tab_EQ_TipodeEquipos ORDER BY DesTipodeEquipo;