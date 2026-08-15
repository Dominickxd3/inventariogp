import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ActasRepository } from '../repositories/actas.repository.js';
import { AsignacionesRepository } from '../repositories/asignaciones.repository.js';
import { EquiposRepository } from '../repositories/equipos.repository.js';
import { TrabajadoresRepository } from '../repositories/trabajadores.repository.js';
import { generarToken, hashSHA256, hashFile } from '../utils/crypto.js';
import { generarActaPdf, incrustarFirma } from '../documents/index.js';
import { actasConfig } from '../config/actas.js';
import { EventsService } from './events.service.js';

function escapeJsonValue(v) {
  if (v === null || v === undefined) return null;
  return String(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

function normalizarClave(clave) {
  if (!clave) return '';
  const alias = {
    'marca': 'marca',
    'modelo': 'modelo',
    'color': 'color',
    'ram': 'ram',
    'memoria': 'ram',
    'memoria ram': 'ram',
    'memoria principal': 'ram',
    'capacidad': 'capacidad',
    'almacenamiento': 'capacidad',
    'disco': 'capacidad',
    'disco duro': 'capacidad',
    'ssd': 'capacidad',
    'nvme': 'capacidad',
    'capacidad de disco': 'capacidad',
    'serie': 'serie',
    'numero de serie': 'serie',
    'número de serie': 'serie',
    'serial': 'serie',
    's/n': 'serie',
    'tipo': 'tipo',
    'tipo equipo': 'tipo',
    'tipo de equipo': 'tipo',
    'imei': 'imei',
    'imei 1': 'imei',
    'imei1': 'imei',
    'celular': 'nroCelular',
    'nro celular': 'nroCelular',
    'numero celular': 'nroCelular',
    'número celular': 'nroCelular',
    'telefono': 'nroCelular',
    'telefono celular': 'nroCelular',
  };
  const limpia = clave
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return alias[limpia] || '';
}

function buildSnapshot({ asignacion, trabajador, equipo, caracteristicas, accesorios, tipoActa, plantilla, estadoFisicoDevolucion, observacionesDevolucion }) {
  const eq = {
    id: equipo.IdMaeEquipo,
    codigo: equipo.CodEquipo || '',
    tipoEquipo: equipo.DesTipodeEquipo || '',
    marca: equipo.Marca || '',
    modelo: equipo.Modelo || '',
    color: '',
    ram: '',
    capacidad: '',
    serie: equipo.SerieFabricante || equipo.CodBarra || '',
    imei: '',
    nroCelular: '',
  };

  const reconocidas = new Set();
  if (caracteristicas?.length) {
    const mapCarac = {};
    for (const c of caracteristicas) {
      const key = normalizarClave(c.Clave);
      if (key) {
        mapCarac[key] = c.Valor;
        reconocidas.add(c.Clave);
      } else if (process.env.NODE_ENV === 'development') {
        console.log(`[Actas] Característica no reconocida: "${c.Clave}" = "${c.Valor}"`);
      }
    }
    if (mapCarac['marca']) eq.marca = mapCarac['marca'];
    if (mapCarac['modelo']) eq.modelo = mapCarac['modelo'];
    if (mapCarac['color']) eq.color = mapCarac['color'];
    if (mapCarac['ram']) eq.ram = mapCarac['ram'];
    if (mapCarac['capacidad']) eq.capacidad = mapCarac['capacidad'];
    if (mapCarac['serie']) eq.serie = mapCarac['serie'];
    if (mapCarac['tipo']) eq.tipoEquipo = mapCarac['tipo'];
    if (mapCarac['imei']) eq.imei = mapCarac['imei'];
    if (mapCarac['nroCelular']) eq.nroCelular = mapCarac['nroCelular'];
  }

  if (process.env.NODE_ENV === 'development' && caracteristicas?.length) {
    const noReconocidas = caracteristicas.filter(c => !reconocidas.has(c.Clave));
    if (noReconocidas.length) {
      console.log(`[Actas] Características no mapeadas (${noReconocidas.length}):`, noReconocidas.map(c => `${c.Clave}=${c.Valor}`).join(', '));
    }
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
      tipoEquipo: escapeJsonValue(eq.tipoEquipo),
      marca: escapeJsonValue(eq.marca),
      modelo: escapeJsonValue(eq.modelo),
      color: escapeJsonValue(eq.color),
      ram: escapeJsonValue(eq.ram),
      capacidad: escapeJsonValue(eq.capacidad),
      serie: escapeJsonValue(eq.serie),
      imei: escapeJsonValue(eq.imei),
      nroCelular: escapeJsonValue(eq.nroCelular),
    },
    accesorios: accs.map(a => ({
      idComponente: a.idComponente,
      codigo: escapeJsonValue(a.codigo),
      descripcion: escapeJsonValue(a.descripcion),
      marca: escapeJsonValue(a.marca),
      modelo: escapeJsonValue(a.modelo),
    })),
    plantilla: plantilla || (tipoActa === 'ENTREGA' ? 'ENTREGA_LAPTOP_V1' : 'DEVOLUCION_LAPTOP_V1'),
    ...(tipoActa === 'DEVOLUCION' ? {
      estadoFisicoDevolucion: estadoFisicoDevolucion || null,
      observacionesDevolucion: observacionesDevolucion || null,
    } : {}),
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

function buildFilePath(tipoActa, subfolder, nombre, fechaBase) {
  const base = fechaBase && !isNaN(new Date(fechaBase).getTime()) ? new Date(fechaBase) : new Date();
  const year = String(base.getFullYear());
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const tipoDir = tipoActa === 'ENTREGA' ? 'entrega' : 'devolucion';
  const dir = path.join(actasConfig.storagePath, year, month, tipoDir, subfolder || '');
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, nombre);
}

function fechaLocalCompacta() {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10).replace(/-/g, '');
}

function sanitizarNombreArchivo(nombre) {
  return String(nombre || '')
    .toUpperCase()
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function siguienteSecuencia(dir, prefijo) {
  let max = 0;
  try {
    const nombres = fs.readdirSync(dir) || [];
    const re = new RegExp(`^${prefijo} (\\d{2}) `);
    for (const n of nombres) {
      const m = n.match(re);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
  } catch {}
  return String(max + 1).padStart(2, '0');
}

function nombrePdfFirmado(tipoActa, snapshot, dir) {
  const fecha = fechaLocalCompacta();
  const tipo = sanitizarNombreArchivo(snapshot?.equipo?.tipoEquipo || 'EQUIPO');
  const colaborador = sanitizarNombreArchivo(snapshot?.trabajador?.nombre) || 'SIN NOMBRE';
  const prefijoDoc = tipoActa === 'ENTREGA' ? 'CARGO DE ENTREGA DE EQUIPO' : 'CARGO DE DEVOLUCION DE EQUIPO';
  const sec = siguienteSecuencia(dir, fecha);
  return `${fecha} ${sec} ${prefijoDoc} ${tipo} - ${colaborador}.pdf`;
}

function normalizarTipoEquipo(tipo) {
  return String(tipo || '').toUpperCase().trim();
}

function obtenerRutaExterna(tipoActa, tipoEquipo) {
  const map = tipoActa === 'ENTREGA' ? actasConfig.firmaPdfEntregaRuta : actasConfig.firmaPdfDevolucionRuta;
  const directa = map[normalizarTipoEquipo(tipoEquipo)];
  return directa || map.default || '';
}

function destinoPdfFirmado(tipoActa, nombreBase, snapshot, fechaBase) {
  const externa = obtenerRutaExterna(tipoActa, snapshot?.equipo?.tipoEquipo);
  if (externa) {
    fs.mkdirSync(externa, { recursive: true });
    const nombre = nombrePdfFirmado(tipoActa, snapshot, externa);
    return path.join(externa, nombre);
  }
  return buildFilePath(tipoActa, 'firmados', nombreBase, fechaBase);
}

function rutasPermitidas() {
  const rutas = [actasConfig.storagePath];
  const collect = (map) => {
    if (!map) return;
    if (typeof map === 'string') {
      if (map) rutas.push(map);
      return;
    }
    for (const v of Object.values(map)) if (v) rutas.push(v);
  };
  collect(actasConfig.firmaPdfEntregaRuta);
  collect(actasConfig.firmaPdfDevolucionRuta);
  return rutas.map(p => path.resolve(p));
}

function esRutaPermitida(ruta) {
  const resuelta = path.resolve(ruta);
  return rutasPermitidas().some(base => resuelta === base || resuelta.startsWith(base + path.sep));
}

export const ActasService = {
  async generarAutomatica({ idMovEquipoAsignacion, tipoActa, idUsuarioGenera, estadoFisicoDevolucion, observacionesDevolucion }) {
    let pdfRuta = null;
    try {
      const asignacion = await AsignacionesRepository.getById(idMovEquipoAsignacion);
      if (!asignacion) throw new Error(`Asignación ${idMovEquipoAsignacion} no encontrada`);

      const trabajador = await TrabajadoresRepository.getById(asignacion.IdReferente);
      if (!trabajador) throw new Error(`Trabajador ${asignacion.IdReferente} no encontrado`);

      const equipo = await EquiposRepository.getById(asignacion.IdMaeEquipo);
      if (!equipo) throw new Error(`Equipo ${asignacion.IdMaeEquipo} no encontrado`);

      const tipoEquipo = await EquiposRepository.getTipoById(equipo.IdTipodeEquipo);
      if (tipoEquipo && tipoEquipo.GeneraActa === false) {
        return {
          success: true,
          skipped: true,
          reason: `El tipo de equipo ${tipoEquipo.DesTipodeEquipo} se asigna internamente sin acta`,
        };
      }

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
        estadoFisicoDevolucion, observacionesDevolucion,
      });

      const datosActa = {
        tipoActa,
        fecha: new Date(),
        trabajador: {
          nombre: trabajador.Trabajador,
          dni: trabajador.DOI,
        },
        equipo: {
          marca: snapshot.equipo.marca,
          modelo: snapshot.equipo.modelo,
          color: snapshot.equipo.color,
          ram: snapshot.equipo.ram,
          capacidad: snapshot.equipo.capacidad,
          serie: snapshot.equipo.serie,
        },
        accesorios: snapshot.accesorios,
      };

      const codigoActa = generarCodigoActa(tipoActa, idMovEquipoAsignacion);
      const token = generarToken();
      const tokenHash = hashSHA256(token);
      const fechaExpiracion = generarFechaExpiracion();

      if (process.env.NODE_ENV === 'development') {
        console.log('[Actas] datosActa.equipo:', JSON.stringify(datosActa.equipo, null, 2));
        console.log('[Actas] datosActa.trabajador:', JSON.stringify(datosActa.trabajador, null, 2));
      }

      const pdfBytes = await generarActaPdf({ ...datosActa, snapshot });
      const fileName = `${codigoActa}-${crypto.randomUUID()}.pdf`;
      pdfRuta = buildFilePath(tipoActa, '', fileName, asignacion.FecRegistro || asignacion.FecAsignacion);
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

      EventsService.emit('acta.generada', { IdActa: idActa, CodigoActa: codigoActa, TipoActa: tipoActa, IdMovEquipoAsignacion: idMovEquipoAsignacion });

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
      if (pdfRuta && fs.existsSync(pdfRuta)) {
        try { fs.unlinkSync(pdfRuta); } catch {}
      }
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
    if (acta.EstadoActa === 'ANULADA') {
      throw Object.assign(new Error('El acta está anulada y no puede descargarse'), { statusCode: 422 });
    }
    const ruta = acta.PdfFirmadoRuta || acta.PdfOriginalRuta;
    if (!ruta || !fs.existsSync(ruta)) return null;
    if (!esRutaPermitida(ruta)) {
      throw Object.assign(new Error('Ruta de archivo inválida'), { statusCode: 400 });
    }
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

    EventsService.emit('acta.enlace-regenerado', { IdActa: idActa, CodigoActa: acta.CodigoActa, TipoActa: acta.TipoActa });

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

    EventsService.emit('acta.anulada', { IdActa: idActa, CodigoActa: acta.CodigoActa, TipoActa: acta.TipoActa });

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

  async firmar(token, ultimosCuatroDni, firmaBase64, posicionFirma) {
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

    const datosActa = {
      tipoActa: acta.TipoActa,
      fecha: new Date(),
      snapshot,
    };

    const pdfFirmadoBytes = await incrustarFirma(datosActa, firmaBase64, posicionFirma);

    const now = new Date();
    const fechaFirma = now.toISOString();

    const idUnico = crypto.randomUUID();
    const fechaBase = acta.FechaGeneracion;

    const firmaFileName = `firma-${acta.CodigoActa}-${idUnico}.png`;
    const firmaRuta = buildFilePath(acta.TipoActa, 'firmas', firmaFileName, fechaBase);
    const pdfFileName = `${acta.CodigoActa}-${idUnico}-FIRMADO.pdf`;
    const pdfFirmadoRuta = destinoPdfFirmado(acta.TipoActa, pdfFileName, snapshot, fechaBase);

    let firmaHash = null;
    let pdfFirmadoHash = null;
    try {
      fs.writeFileSync(firmaRuta, firmaBuffer);
      firmaHash = await hashFile(firmaRuta);
      fs.writeFileSync(pdfFirmadoRuta, pdfFirmadoBytes);
      pdfFirmadoHash = await hashFile(pdfFirmadoRuta);
    } catch (error) {
      try { fs.unlinkSync(firmaRuta); } catch {}
      try { fs.unlinkSync(pdfFirmadoRuta); } catch {}
      throw Object.assign(new Error('Error al guardar el documento firmado'), { statusCode: 500 });
    }

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

    EventsService.emit('acta.firmada', { IdActa: acta.IdActa, CodigoActa: acta.CodigoActa, TipoActa: acta.TipoActa });

    return {
      message: 'Documento firmado correctamente',
      acta: {
        codigo: acta.CodigoActa,
        fechaFirma,
      },
    };
  },

  async obtenerPreview(token, ultimosCuatroDni) {
    const tokenHash = hashSHA256(token);
    const acta = await ActasRepository.getByTokenHash(tokenHash);
    if (!acta) {
      throw Object.assign(new Error('Enlace inválido'), { statusCode: 404 });
    }

    if (acta.EstadoActa !== 'PENDIENTE_FIRMA') {
      throw Object.assign(new Error('El documento no está pendiente de firma'), { statusCode: 422 });
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

    if (!acta.PdfOriginalRuta || !fs.existsSync(acta.PdfOriginalRuta)) {
      throw Object.assign(new Error('No se encontró el archivo PDF'), { statusCode: 404 });
    }
    if (!esRutaPermitida(acta.PdfOriginalRuta)) {
      throw Object.assign(new Error('Ruta de archivo inválida'), { statusCode: 400 });
    }

    return acta.PdfOriginalRuta;
  },
};
