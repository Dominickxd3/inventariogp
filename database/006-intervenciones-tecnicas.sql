-- ============================================================
-- FASE 3: Intervenciones Técnicas
-- ============================================================
-- Registra reparaciones, cambios, mantenimientos y reemplazos
-- realizados sobre un equipo.
-- ============================================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'Tab_EQ_IntervencionesTecnicas') AND type = 'U')
BEGIN
  CREATE TABLE Tab_EQ_IntervencionesTecnicas (
    IdIntervencion INT IDENTITY(1,1) PRIMARY KEY,
    IdMaeEquipo INT NOT NULL,
    IdIncidencia INT NULL,
    IdComponenteInstalado INT NULL,
    IdComponenteRetirado INT NULL,
    TipoIntervencion NVARCHAR(50) NOT NULL,
    Descripcion NVARCHAR(1000) NOT NULL,
    FecIntervencion DATETIME NOT NULL DEFAULT GETDATE(),
    IdUsuario INT NULL,
    Estado NVARCHAR(30) NOT NULL DEFAULT N'REGISTRADO',
    FOREIGN KEY (IdMaeEquipo) REFERENCES Tab_EQ_MaeEquipos(IdMaeEquipo),
    FOREIGN KEY (IdIncidencia) REFERENCES Tab_EQ_Incidencias(IdIncidencia),
    FOREIGN KEY (IdComponenteInstalado) REFERENCES Tab_EQ_Componentes(IdComponente),
    FOREIGN KEY (IdComponenteRetirado) REFERENCES Tab_EQ_Componentes(IdComponente),
    FOREIGN KEY (IdUsuario) REFERENCES Tab_SYS_Usuarios(IdUsuario)
  );
END;
