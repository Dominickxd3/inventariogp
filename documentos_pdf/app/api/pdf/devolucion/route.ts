import { NextRequest } from "next/server";
import { CARGO_DEVOLUCION_SIGNATURE_FIELD } from "@/lib/documentos/cargo-devolucion-laptop";
import {
  generateCargoDevolucionLaptopPdf,
  type CargoDevolucionLaptopPdfInput,
} from "@/lib/pdf/generate-cargo-devolucion-laptop-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PdfBody = CargoDevolucionLaptopPdfInput;

const QUERY_KEYS: (keyof PdfBody)[] = [
  "empresaNombre",
  "empresaRuc",
  "empresaDireccion",
  "empresaTelefonos",
  "empresaCorreo1",
  "empresaCorreo2",
  "nombre",
  "dni",
  "responsableNombre",
  "responsableDni",
  "marca",
  "modelo",
  "color",
  "ram",
  "capacidad",
  "serie",
  "accesorios",
  "fecha",
  "logoSrc",
  "firmaResponsableSrc",
];

function bodyFromSearchParams(searchParams: URLSearchParams): PdfBody {
  const body: PdfBody = {};
  for (const key of QUERY_KEYS) {
    const value = searchParams.get(key);
    if (value) body[key] = value;
  }
  return body;
}

export async function POST(request: NextRequest) {
  let body: PdfBody = {};
  try {
    body = (await request.json()) as PdfBody;
  } catch {
    body = {};
  }

  try {
    const pdf = await generateCargoDevolucionLaptopPdf(
      request.nextUrl.origin,
      body,
    );
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="cargo-devolucion-laptop.pdf"',
        "Cache-Control": "no-store",
        "X-Signature-Field": JSON.stringify(CARGO_DEVOLUCION_SIGNATURE_FIELD),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error generando PDF";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const body = bodyFromSearchParams(request.nextUrl.searchParams);

  try {
    const pdf = await generateCargoDevolucionLaptopPdf(
      request.nextUrl.origin,
      body,
    );
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'inline; filename="cargo-devolucion-laptop.pdf"',
        "Cache-Control": "no-store",
        "X-Signature-Field": JSON.stringify(CARGO_DEVOLUCION_SIGNATURE_FIELD),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error generando PDF";
    return Response.json({ error: message }, { status: 500 });
  }
}
