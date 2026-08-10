import { NextRequest } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  generateCargoLaptopPdf,
  type CargoLaptopPdfInput,
} from "@/lib/pdf/generate-cargo-laptop-pdf";
import {
  generateCargoDevolucionLaptopPdf,
  type CargoDevolucionLaptopPdfInput,
} from "@/lib/pdf/generate-cargo-devolucion-laptop-pdf";
import {
  getBackendApiKey,
  getBackendSubmitUrl,
  getSubmitMode,
  type SignedDocumentPayload,
} from "@/lib/documentos/submit-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type EnviarBody = CargoLaptopPdfInput &
  CargoDevolucionLaptopPdfInput & {
    tipo?: "cargo-laptop" | "cargo-devolucion-laptop";
    documentoId?: string;
    token?: string;
    meta?: Record<string, string>;
  };

function stripDataUrl(dataUrl?: string): string | undefined {
  if (!dataUrl) return undefined;
  const i = dataUrl.indexOf("base64,");
  return i >= 0 ? dataUrl.slice(i + 7) : dataUrl;
}

function safeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
}

async function saveMockLocal(params: {
  documentoId: string;
  pdf: Buffer;
  payload: SignedDocumentPayload;
}) {
  const dir = path.join(process.cwd(), "storage", "firmados");
  await mkdir(dir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const base = `${safeId(params.documentoId)}_${stamp}`;
  const pdfPath = path.join(dir, `${base}.pdf`);
  const metaPath = path.join(dir, `${base}.json`);

  await writeFile(pdfPath, params.pdf);

  // No guardar base64 completo en JSON local (muy pesado); solo referencia
  const meta = {
    ...params.payload,
    pdfBase64: undefined,
    pdfFile: path.basename(pdfPath),
    pdfBytes: params.pdf.length,
    mock: true,
    savedAt: new Date().toISOString(),
  };
  await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");

  return {
    pdfPath: path.relative(process.cwd(), pdfPath).replace(/\\/g, "/"),
    metaPath: path.relative(process.cwd(), metaPath).replace(/\\/g, "/"),
  };
}

const RECORD_FILE = path.join(process.cwd(), "storage", "firmados", "enviados.json");

async function alreadySent(documentoId: string): Promise<boolean> {
  try {
    const raw = await readFile(RECORD_FILE, "utf8");
    const records = JSON.parse(raw) as Record<string, string>;
    return Boolean(records[documentoId]);
  } catch {
    return false;
  }
}

async function recordSent(documentoId: string, sentAt: string): Promise<void> {
  const dir = path.dirname(RECORD_FILE);
  await mkdir(dir, { recursive: true });

  let records: Record<string, string> = {};
  try {
    const raw = await readFile(RECORD_FILE, "utf8");
    records = JSON.parse(raw) as Record<string, string>;
  } catch {
    records = {};
  }

  records[documentoId] = sentAt;
  await writeFile(RECORD_FILE, JSON.stringify(records, null, 2), "utf8");
}

async function forwardToBackend(payload: SignedDocumentPayload) {
  const url = getBackendSubmitUrl();
  if (!url) {
    throw new Error(
      "DOCUMENT_SUBMIT_URL no configurado. Define la variable en .env.local",
    );
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const apiKey = getBackendApiKey();
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
    headers["X-Api-Key"] = apiKey;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      `Backend respondió ${res.status}: ${
        typeof json === "object" && json && "error" in json
          ? String((json as { error: unknown }).error)
          : text.slice(0, 200)
      }`,
    );
  }

  return json;
}

export async function POST(request: NextRequest) {
  let body: EnviarBody = {};
  try {
    body = (await request.json()) as EnviarBody;
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.firma) {
    return Response.json(
      { error: "Debe firmar el documento antes de enviar" },
      { status: 400 },
    );
  }

  if (!body.nombre || !body.dni) {
    return Response.json(
      { error: "Faltan datos del colaborador (nombre, dni)" },
      { status: 400 },
    );
  }

  const isDevolucion = body.tipo === "cargo-devolucion-laptop";

  const documentoId =
    body.documentoId?.trim() ||
    `${isDevolucion ? "cargo-devolucion" : "cargo-laptop"}_${safeId(body.dni ?? "desconocido")}_${safeId(body.fecha ?? "")}`;

  const mode = getSubmitMode();

  if (await alreadySent(documentoId)) {
    return Response.json(
      {
        error:
          "El documento ya fue enviado. Solo se permite un envío por documento.",
        documentoId,
        alreadySent: true,
      },
      { status: 409 },
    );
  }

  try {
    const pdf = isDevolucion
      ? await generateCargoDevolucionLaptopPdf(request.nextUrl.origin, body)
      : await generateCargoLaptopPdf(request.nextUrl.origin, body);

    const payload: SignedDocumentPayload = {
      documentoId,
      token: body.token,
      tipo: isDevolucion ? "cargo-devolucion-laptop" : "cargo-laptop",
      firmadoEn: new Date().toISOString(),
      empresa: {
        nombre: body.empresaNombre ?? "",
        ruc: body.empresaRuc ?? "",
        direccion: body.empresaDireccion ?? "",
        telefonos: body.empresaTelefonos ?? "",
        correo1: body.empresaCorreo1,
        correo2: body.empresaCorreo2,
      },
      empleado: {
        nombre: body.nombre ?? "",
        dni: body.dni ?? "",
      },
      responsable: isDevolucion
        ? {
            nombre: body.responsableNombre ?? "",
            dni: body.responsableDni ?? "",
          }
        : undefined,
      equipo: {
        marca: body.marca ?? "",
        modelo: body.modelo ?? "",
        color: body.color ?? "",
        ram: body.ram ?? "",
        capacidad: body.capacidad ?? "",
        serie: body.serie ?? "",
        accesorios: body.accesorios ?? "",
      },
      fecha: body.fecha ?? "",
      pdfBase64: pdf.toString("base64"),
      firmaPngBase64: stripDataUrl(body.firma),
      meta: body.meta,
    };

    const result: {
      ok: true;
      documentoId: string;
      mode: string;
      mock?: { pdfPath: string; metaPath: string };
      backend?: unknown;
    } = {
      ok: true,
      documentoId,
      mode,
    };

    if (mode === "mock" || mode === "both") {
      result.mock = await saveMockLocal({ documentoId, pdf, payload });
    }

    if (mode === "forward" || mode === "both") {
      result.backend = await forwardToBackend(payload);
    }

    await recordSent(documentoId, new Date().toISOString());

    return Response.json(result, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error al enviar documento";
    return Response.json({ error: message }, { status: 500 });
  }
}
