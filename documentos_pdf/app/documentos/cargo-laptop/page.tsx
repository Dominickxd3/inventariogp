import CargoLaptopSigner from "@/components/CargoLaptopSigner";
import {
  DEFAULT_CARGO_LAPTOP,
  DEFAULT_EMPRESA,
  type CargoLaptopData,
} from "@/lib/documentos/cargo-laptop";

export default async function CargoLaptopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const str = (key: string, fallback: string) => {
    const v = params[key];
    return typeof v === "string" && v.length > 0 ? v : fallback;
  };

  const d = DEFAULT_CARGO_LAPTOP;

  const knownKeys = new Set([
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
    "documentoId",
    "token",
    "mode",
  ]);

  const meta: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && !knownKeys.has(key)) {
      meta[key] = value;
    }
  }

  const data: CargoLaptopData = {
    empresa: {
      nombre: str("empresaNombre", DEFAULT_EMPRESA.nombre),
      ruc: str("empresaRuc", DEFAULT_EMPRESA.ruc),
      direccion: str("empresaDireccion", DEFAULT_EMPRESA.direccion),
      telefonos: str("empresaTelefonos", DEFAULT_EMPRESA.telefonos),
    },
    empleado: {
      nombre: str("nombre", d.empleado.nombre),
      dni: str("dni", d.empleado.dni),
    },
    equipo: {
      marca: str("marca", d.equipo.marca),
      modelo: str("modelo", d.equipo.modelo),
      color: str("color", d.equipo.color),
      ram: str("ram", d.equipo.ram),
      capacidad: str("capacidad", d.equipo.capacidad),
      serie: str("serie", d.equipo.serie),
      accesorios: str("accesorios", d.equipo.accesorios),
    },
    fecha: str("fecha", d.fecha),
    logoSrc: str("logoSrc", d.logoSrc ?? "/logo.png"),
    signatureField: d.signatureField,
  };

  return (
    <main className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <CargoLaptopSigner
        data={data}
        documentoId={str("documentoId", "")}
        token={str("token", "")}
        meta={Object.keys(meta).length > 0 ? meta : undefined}
      />
    </main>
  );
}
