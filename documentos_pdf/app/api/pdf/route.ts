import { NextRequest } from "next/server";
import { CARGO_LAPTOP_SIGNATURE_FIELD } from "@/lib/documentos/cargo-laptop";
import {
  generateCargoLaptopPdf,
  type CargoLaptopPdfInput,
} from "@/lib/pdf/generate-cargo-laptop-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type PdfBody = CargoLaptopPdfInput;

const QUERY_KEYS: (keyof PdfBody)[] = [
  "empresaNombre",
  "empresaRuc",
  "empresaDireccion",
  "empresaTelefonos",
  "nombre",
  "dni",
  "marca",
  "modelo",
  "color",
  "ram",
  "capacidad",
  "serie",
  "accesorios",
  "fecha",
  "logoSrc",
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
    const pdf = await generateCargoLaptopPdf(request.nextUrl.origin, body);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="cargo-entrega-laptop.pdf"',
        "Cache-Control": "no-store",
        "X-Signature-Field": JSON.stringify(CARGO_LAPTOP_SIGNATURE_FIELD),
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
    const pdf = await generateCargoLaptopPdf(request.nextUrl.origin, body);
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'inline; filename="cargo-entrega-laptop.pdf"',
        "Cache-Control": "no-store",
        "X-Signature-Field": JSON.stringify(CARGO_LAPTOP_SIGNATURE_FIELD),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error generando PDF";
    return Response.json({ error: message }, { status: 500 });
  }
}
