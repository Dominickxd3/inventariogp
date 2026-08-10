/**
 * Configuración del envío del documento firmado.
 *
 * Flujo de negocio:
 * 1. Tu sistema genera una URL única para el colaborador.
 * 2. El colaborador firma (no inicia sesión).
 * 3. Al "Enviar", se genera el PDF y se entrega a tu backend.
 *
 * Variables de entorno (ver .env.example):
 * - DOCUMENT_SUBMIT_URL  → endpoint real de tu backend (opcional en simulación)
 * - DOCUMENT_SUBMIT_API_KEY → Bearer / API key opcional
 * - DOCUMENT_SUBMIT_MODE → "mock" | "forward" | "both" (default: mock)
 */

export type SubmitMode = "mock" | "forward" | "both";

export function getSubmitMode(): SubmitMode {
  const mode = (process.env.DOCUMENT_SUBMIT_MODE ?? "mock").toLowerCase();
  if (mode === "forward" || mode === "both" || mode === "mock") return mode;
  return "mock";
}

export function getBackendSubmitUrl(): string | null {
  const url = process.env.DOCUMENT_SUBMIT_URL?.trim();
  return url && url.length > 0 ? url : null;
}

export function getBackendApiKey(): string | null {
  const key = process.env.DOCUMENT_SUBMIT_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

/** Payload que recibirás en tu backend al conectar DOCUMENT_SUBMIT_URL */
export type SignedDocumentPayload = {
  documentoId: string;
  token?: string;
  tipo: "cargo-laptop" | "cargo-devolucion-laptop";
  firmadoEn: string;
  empresa: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefonos: string;
    correo1?: string;
    correo2?: string;
  };
  empleado: {
    nombre: string;
    dni: string;
  };
  responsable?: {
    nombre: string;
    dni: string;
  };
  equipo: {
    marca: string;
    modelo: string;
    color: string;
    ram: string;
    capacidad: string;
    serie: string;
    accesorios: string;
  };
  fecha: string;
  /** PDF firmado en base64 (sin prefijo data:) */
  pdfBase64: string;
  /** Firma PNG en base64 (sin prefijo data:), opcional */
  firmaPngBase64?: string;
  /** Metadatos libres que envíes en la URL (ej. idAsignacion) */
  meta?: Record<string, string>;
};
