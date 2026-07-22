import fs from 'fs';
import path from 'path';
import { ActasRepository } from '../repositories/actas.repository.js';
import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { EquiposRepository } from '../repositories/equipos.repository.js';
import { TrabajadoresRepository } from '../repositories/trabajadores.repository.js';
import { generarToken, hashSHA256, hashFile } from '../utils/crypto.js';
import { generarActaPdf, incrustarFirma } from '../utils/actas-pdf.js';
import { actasConfig } from '../config/actas.js';
import { getLayout } from '../config/actas-layouts.js';

function escapeJsonValue(v) {
  if (v === null || v === undefined) return null;
  return String(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function buildSnapshot({ asignacion, trabajador, equipo, caracteristicas, accesorios, tipoActa, plantilla }) {
  const eq = {
    id: equipo.IdMaeEquipo,
    codigo: equipo.CodEquipo || '',
    marca: '',
    modelo: '',
    color: '',
    ram: '',
    capacidad: '',
    serie: equipo.SerieFabricante || equipo.CodBarra || '',
  };

  if (caracteristicas?.length) {
    const mapCarac = {};
    caracteristicas.forEach(c => { mapCarac[c.Clave?.toLowerCase()] = c.Valor; });
    eq.marca = mapCarac['marca'] || equipo.Marca || '';
    eq.modelo = mapCarac['modelo'] || equipo.Modelo || '';
    eq.color = mapCarac['color'] || '';
    eq.ram = mapCarac['ram'] || mapCarac['memoria ram'] || '';
    eq.capacidad = mapCarac['capacidad'] || mapCarac['disco duro'] || mapCarac['almacenamiento'] || '';
    eq.serie = mapCarac['serie'] || mapCarac['numero de serie'] || equipo.SerieFabricante || equipo.CodBarra || '';
  }

  const accs = (accesorios || []).map(a => ({
    idComponente: a.IdComponente,
    codigo: a.CodComponente || '',
    descripcion: a.DesComponente || a.DesTipodeComponente || '',
    marca: a.Marca || '',
    modelo: a.Modelo || '',
  }));

  return {
    version: 1,
    tipoActa,
    idMovEquipoAsignacion: asignacion.IdMovEquipoAsignacion,
    fechaDocumento: new Date().toISOString(),
    trabajador: {
      id: trabajador.IdTrabajador,
      nombre: escapeJsonValue(trabajador.Trabajador),
      dni: escapeJsonValue(trabajador.DOI),
    },
    equipo: {
      id: eq.id,
      codigo: escapeJsonValue(eq.codigo),
      marca: escapeJsonValue(eq.marca),
      modelo: escapeJsonValue(eq.modelo),
      color: escapeJsonValue(eq.color),
      ram: escapeJsonValue(eq.ram),
      capacidad: escapeJsonValue(eq.capacidad),
      serie: escapeJsonValue(eq.serie),
    },
    accesorios: accs.map(a => ({
      idComponente: a.idComponente,
      codigo: escapeJsonValue(a.codigo),
      descripcion: escapeJsonValue(a.descripcion),
      marca: escapeJsonValue(a.marca),
      modelo: escapeJsonValue(a.modelo),
    })),
    plantilla: plantilla || (tipoActa === 'ENTREGA' ? 'ENTREGA_LAPTOP_V1' : 'DEVOLUCION_LAPTOP_V1'),
  };
}

function generarCodigoActa(tipoActa, idMovEquipoAsignacion) {
  const prefijo = tipoActa === 'ENTREGA' ? 'ACT-ENT-' : 'ACT-DEV-';
  return prefijo + String(idMovEquipoAsignacion).padStart(6, '0');
}

function generarFechaExpiracion() {
  const d = new Date();
  d.setHours(d.getHours() + actasConfig.linkTtlHours);
  return d;
}

function buildFilePath(tipoActa, subfolder, nombre) {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const tipoDir = tipoActa === 'ENTREGA' ? 'entrega' : 'devolucion';
  const dir = path.join(actasConfig.storagePath, year, month, tipoDir, subfolder || '');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, nombre);
}

export const ActasService = {
  async generarAutomatica({ idMovEquipoAsignacion, tipoActa, idUsuarioGenera }) {
    try {
      const asignacion = await AsignacionesRepository.getById(idMovEquipoAsignacion);
      if (!asignacion) throw new Error(`Asignación ${idMovEquipoAsignacion} no encontrada`);

      const trabajador = await TrabajadoresRepository.getById(asignacion.IdReferente);
      if (!trabajador) throw new Error(`Trabajador ${asignacion.IdReferente} no encontrado`);

      const equipo = await EquiposRepository.getById(asignacion.IdMaeEquipo);
      if (!equipo) throw new Error(`Equipo ${asignacion.IdMaeEquipo} no encontrado`);

      let caracteristicas = [];
      try {
        caracteristicas = await EquiposRepository.getCaracteristicas?.(asignacion.IdMaeEquipo) || [];
      } catch {}

      let accesorios = [];
      try {
        accesorios = await AsignacionesRepository.getAccsByAsignacion(idMovEquipoAsignacion) || [];
      } catch {}

      const snapshot = buildSnapshot({
        asignacion, trabajador, equipo, caracteristicas, accesorios, tipoActa,
      });

      const codigoActa = generarCodigoActa(tipoActa, idMovEquipoAsignacion);
      const token = generarToken();
      const tokenHash = hashSHA256(token);
      const fechaExpiracion = generarFechaExpiracion();

      const pdfBytes = await generarActaPdf(snapshot);
      const fileName = `${codigoActa}.pdf`;
      const pdfRuta = buildFilePath(tipoActa, '', fileName);
      fs.writeFileSync(pdfRuta, pdfBytes);
      const pdfHash = await hashFile(pdfRuta);

      const snapshotJson = JSON.stringify(snapshot);

      const idActa = await ActasRepository.insert({
        IdMovEquipoAsignacion: idMovEquipoAsignacion,
        TipoActa: tipoActa,
        CodigoActa: codigoActa,
        EstadoActa: 'PENDIENTE_FIRMA',
        SnapshotJson: snapshotJson,
        TokenHash: tokenHash,
        FechaExpiracion: fechaExpiracion.toISOString(),
        PdfOriginalRuta: pdfRuta,
        PdfOriginalHash: pdfHash,
        IdUsuarioGenera: idUsuarioGenera,
      });

      const urlFirma = `${actasConfig.publicUrl}/firmar-acta#token=${token}`;

      return {
        success: true,
        acta: {
          IdActa: idActa,
          CodigoActa: codigoActa,
          EstadoActa: 'PENDIENTE_FIRMA',
          urlFirma,
          FechaExpiracion: fechaExpiracion.toISOString(),
        },
      };
    } catch (error) {
      console.error(`[Actas] Error al generar acta automática para asignación ${idMovEquipoAsignacion}:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  async list(filtros) {
    await ActasRepository.updateExpired();
    return ActasRepository.list(filtros);
  },

  async getById(id) {
    const acta = await ActasRepository.getById(id);
    if (!acta) return null;

    if (acta.EstadoActa === 'PENDIENTE_FIRMA' && acta.FechaExpiracion) {
      const exp = new Date(acta.FechaExpiracion);
      if (exp < new Date()) {
        await ActasRepository.updateVencida(acta.IdActa);
        acta.EstadoActa = 'VENCIDA';
      }
    }

    return acta;
  },

  async getPdf(id) {
    const acta = await ActasRepository.getById(id);
    if (!acta) return null;
    const ruta = acta.PdfFirmadoRuta || acta.PdfOriginalRuta;
    if (!ruta || !fs.existsSync(ruta)) return null;
    return { ruta, nombre: `${acta.CodigoActa}.pdf` };
  },

  async getStatusByAsignacion(idMovEquipoAsignacion) {
    const actas = await ActasRepository.getStatus(idMovEquipoAsignacion);
    return actas;
  },

  async reintentar(idMovEquipoAsignacion, idUsuarioGenera) {
    const asig = await AsignacionesRepository.getById(idMovEquipoAsignacion);
    if (!asig) throw Object.assign(new Error('Asignación no encontrada'), { statusCode: 404 });

    const tipoActa = asig.Estado === 'CESADO' ? 'DEVOLUCION' : 'ENTREGA';
    return this.generarAutomatica({ idMovEquipoAsignacion, tipoActa, idUsuarioGenera });
  },

  async regenerarEnlace(idActa, idUsuarioGenera) {
    const acta = await ActasRepository.getById(idActa);
    if (!acta) throw Object.assign(new Error('Acta no encontrada'), { statusCode: 404 });
    if (acta.EstadoActa === 'ANULADA') {
      throw Object.assign(new Error('No se puede regenerar el enlace de un acta anulada'), { statusCode: 422 });
    }
    if (acta.EstadoActa === 'FIRMADA') {
      throw Object.assign(new Error('No se puede regenerar el enlace de un acta ya firmada'), { statusCode: 422 });
    }

    const token = generarToken();
    const tokenHash = hashSHA256(token);
    const fechaExpiracion = generarFechaExpiracion();

    const affected = await ActasRepository.regenerateToken(idActa, tokenHash, fechaExpiracion.toISOString());
    if (affected !== 1) {
      throw Object.assign(new Error('No se pudo regenerar el enlace'), { statusCode: 409 });
    }

    return {
      urlFirma: `${actasConfig.publicUrl}/firmar-acta#token=${token}`,
      FechaExpiracion: fechaExpiracion.toISOString(),
    };
  },

  async anular(idActa, motivo, idUsuario) {
    const acta = await ActasRepository.getById(idActa);
    if (!acta) throw Object.assign(new Error('Acta no encontrada'), { statusCode: 404 });
    if (acta.EstadoActa === 'ANULADA') {
      throw Object.assign(new Error('El acta ya está anulada'), { statusCode: 422 });
    }

    const affected = await ActasRepository.annul(idActa, motivo);
    if (affected !== 1) {
      throw Object.assign(new Error('No se pudo anular el acta'), { statusCode: 409 });
    }

    return { message: 'Acta anulada correctamente' };
  },

  async validarEnlace(token, ultimosCuatroDni) {
    const tokenHash = hashSHA256(token);
    const acta = await ActasRepository.getByTokenHash(tokenHash);
    if (!acta) {
      throw Object.assign(new Error('Enlace inválido'), { statusCode: 404 });
    }

    if (acta.EstadoActa === 'PENDIENTE_FIRMA' && acta.FechaExpiracion) {
      const exp = new Date(acta.FechaExpiracion);
      if (exp < new Date()) {
        await ActasRepository.updateVencida(acta.IdActa);
        acta.EstadoActa = 'VENCIDA';
      }
    }

    if (acta.EstadoActa === 'VENCIDA') {
      throw Object.assign(new Error('El enlace ha vencido. Solicita un nuevo enlace al área de sistemas.'), { statusCode: 410 });
    }
    if (acta.EstadoActa === 'FIRMADA') {
      throw Object.assign(new Error('Este documento ya fue firmado'), { statusCode: 422 });
    }
    if (acta.EstadoActa === 'ANULADA') {
      throw Object.assign(new Error('Este documento fue anulado'), { statusCode: 422 });
    }

    let snapshot;
    try {
      snapshot = JSON.parse(acta.SnapshotJson);
    } catch {
      throw Object.assign(new Error('Error al leer los datos del acta'), { statusCode: 500 });
    }

    const dniCompleto = snapshot.trabajador?.dni || '';
    const ultimosCuatro = dniCompleto.slice(-4);
    if (ultimosCuatro !== ultimosCuatroDni) {
      throw Object.assign(new Error('Los últimos 4 dígitos del DNI no coinciden'), { statusCode: 422 });
    }

    return {
      valida: true,
      acta: {
        codigo: acta.CodigoActa,
        tipo: acta.TipoActa,
        estado: acta.EstadoActa,
        trabajador: snapshot.trabajador?.nombre || '',
        equipo: snapshot.equipo || {},
        accesorios: snapshot.accesorios || [],
        fechaExpiracion: acta.FechaExpiracion,
      },
    };
  },

  async firmar(token, ultimosCuatroDni, firmaBase64) {
    const tokenHash = hashSHA256(token);
    const acta = await ActasRepository.getByTokenHash(tokenHash);
    if (!acta) {
      throw Object.assign(new Error('Enlace inválido'), { statusCode: 404 });
    }

    if (acta.EstadoActa !== 'PENDIENTE_FIRMA') {
      if (acta.EstadoActa === 'FIRMADA') {
        throw Object.assign(new Error('Este documento ya fue firmado'), { statusCode: 409 });
      }
      if (acta.EstadoActa === 'VENCIDA') {
        throw Object.assign(new Error('El enlace ha vencido'), { statusCode: 410 });
      }
      throw Object.assign(new Error('El acta no está pendiente de firma'), { statusCode: 422 });
    }

    if (acta.FechaExpiracion) {
      const exp = new Date(acta.FechaExpiracion);
      if (exp < new Date()) {
        await ActasRepository.updateVencida(acta.IdActa);
        throw Object.assign(new Error('El enlace ha vencido'), { statusCode: 410 });
      }
    }

    let snapshot;
    try {
      snapshot = JSON.parse(acta.SnapshotJson);
    } catch {
      throw Object.assign(new Error('Error al leer los datos del acta'), { statusCode: 500 });
    }

    const dniCompleto = snapshot.trabajador?.dni || '';
    const ultimosCuatro = dniCompleto.slice(-4);
    if (ultimosCuatro !== ultimosCuatroDni) {
      throw Object.assign(new Error('Los últimos 4 dígitos del DNI no coinciden'), { statusCode: 422 });
    }

    if (!firmaBase64 || firmaBase64.length < 100) {
      throw Object.assign(new Error('La firma está vacía o es inválida'), { statusCode: 422 });
    }

    const firmaBuffer = Buffer.from(firmaBase64.replace(/^data:image\/png;base64,/, ''), 'base64');
    if (firmaBuffer.length > actasConfig.signatureMaxBytes) {
      throw Object.assign(new Error('La imagen de firma excede el tamaño máximo'), { statusCode: 422 });
    }

    if (firmaBuffer[0] !== 0x89 || firmaBuffer[1] !== 0x50 || firmaBuffer[2] !== 0x4E || firmaBuffer[3] !== 0x47) {
      throw Object.assign(new Error('La firma debe ser una imagen PNG válida'), { statusCode: 422 });
    }

    const pdfOriginalBytes = fs.readFileSync(acta.PdfOriginalRuta);
    const layout = getLayout(acta.TipoActa, snapshot.plantilla);

    const pdfFirmadoBytes = await incrustarFirma(pdfOriginalBytes, firmaBase64, layout);

    const now = new Date();
    const fechaFirma = now.toISOString();

    const firmaFileName = `firma-${acta.CodigoActa}-${Date.now()}.png`;
    const firmaRuta = buildFilePath(acta.TipoActa, 'firmas', firmaFileName);
    fs.writeFileSync(firmaRuta, firmaBuffer);
    const firmaHash = await hashFile(firmaRuta);

    const pdfFileName = `${acta.CodigoActa}-FIRMADO.pdf`;
    const pdfFirmadoRuta = buildFilePath(acta.TipoActa, 'firmados', pdfFileName);
    fs.writeFileSync(pdfFirmadoRuta, pdfFirmadoBytes);
    const pdfFirmadoHash = await hashFile(pdfFirmadoRuta);

    const affected = await ActasRepository.updateSigned(acta.IdActa, {
      TokenHash: tokenHash,
      FechaFirma: fechaFirma,
      FirmaRuta: firmaRuta,
      FirmaHash: firmaHash,
      PdfFirmadoRuta: pdfFirmadoRuta,
      PdfFirmadoHash: pdfFirmadoHash,
    });

    if (affected !== 1) {
      try { fs.unlinkSync(firmaRuta); } catch {}
      try { fs.unlinkSync(pdfFirmadoRuta); } catch {}
      throw Object.assign(new Error('El documento ya fue firmado por otro usuario'), { statusCode: 409 });
    }

    return {
      message: 'Documento firmado correctamente',
      acta: {
        codigo: acta.CodigoActa,
        fechaFirma,
      },
    };
  },
};
