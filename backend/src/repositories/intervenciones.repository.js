import { query } from '../config/db.js';

const DB = 'InventarioGP';

export const IntervencionesRepository = {
  async getByEquipo(idEquipo) {
    return query(DB, `
      SELECT i.*,
             u.User_Fullname AS NombreUsuario,
             cInst.CodComponente AS CodComponenteInstalado,
             cInst.DesComponente AS DesComponenteInstalado,
             cRet.CodComponente AS CodComponenteRetirado,
             cRet.DesComponente AS DesComponenteRetirado,
             inc.TipoIncidencia AS IncidenciaTipo,
             inc.Descripcion AS IncidenciaDescripcion
      FROM Tab_EQ_IntervencionesTecnicas i
      LEFT JOIN Tab_SYS_Usuarios u ON i.IdUsuario = u.IdUsuario
      LEFT JOIN Tab_EQ_Componentes cInst ON i.IdComponenteInstalado = cInst.IdComponente
      LEFT JOIN Tab_EQ_Componentes cRet ON i.IdComponenteRetirado = cRet.IdComponente
      LEFT JOIN Tab_EQ_Incidencias inc ON i.IdIncidencia = inc.IdIncidencia
      WHERE i.IdMaeEquipo = @id
      ORDER BY i.FecIntervencion DESC
    `, { id: idEquipo });
  },

  async create(data) {
    const result = await query(DB, `
      INSERT INTO Tab_EQ_IntervencionesTecnicas
        (IdMaeEquipo, IdIncidencia, IdComponenteInstalado, IdComponenteRetirado,
         TipoIntervencion, Descripcion, IdUsuario, Estado,
         PiezaAfectada, ComponenteRetiradoNoInventariado, Resultado,
         RequiereReparacion, SoftwareInstalado, Version, MotivoBaja)
      OUTPUT INSERTED.IdIntervencion
      VALUES (@idEquipo, @idIncidencia, @idCompInst, @idCompRet,
              @tipo, @descripcion, @idUsuario, 'REGISTRADO',
              @piezaAfectada, @compRetNoInv, @resultado,
              @requiereRep, @software, @version, @motivoBaja)
    `, {
      idEquipo: data.IdMaeEquipo,
      idIncidencia: data.IdIncidencia || null,
      idCompInst: data.IdComponenteInstalado || null,
      idCompRet: data.IdComponenteRetirado || null,
      tipo: data.TipoIntervencion,
      descripcion: data.Descripcion,
      idUsuario: data.IdUsuario || null,
      piezaAfectada: data.PiezaAfectada || null,
      compRetNoInv: data.ComponenteRetiradoNoInventariado ? 1 : 0,
      resultado: data.Resultado || null,
      requiereRep: data.RequiereReparacion != null ? (data.RequiereReparacion ? 1 : 0) : null,
      software: data.SoftwareInstalado || null,
      version: data.Version || null,
      motivoBaja: data.MotivoBaja || null,
    });
    return result[0]?.IdIntervencion;
  },
};
