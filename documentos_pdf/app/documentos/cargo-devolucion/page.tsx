import CargoDevolucionLaptopSigner from "@/components/CargoDevolucionLaptopSigner";
import {
  DEFAULT_CARGO_DEVOLUCION_LAPTOP,
  DEVOLUCION_DEFAULT_EMPRESA,
  type CargoDevolucionLaptopData,
} from "@/lib/documentos/cargo-devolucion-laptop";

export default async function CargoDevolucionLaptopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const str = (key: string, fallback: string) => {
    const v = params[key];
    return typeof v === "string" && v.length > 0 ? v : fallback;
  };

  const d = DEFAULT_CARGO_DEVOLUCION_LAPTOP;

  const knownKeys = new Set([
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

  const data: CargoDevolucionLaptopData = {
    empresa: {
      nombre: str("empresaNombre", DEVOLUCION_DEFAULT_EMPRESA.nombre),
      ruc: str("empresaRuc", DEVOLUCION_DEFAULT_EMPRESA.ruc),
      direccion: str("empresaDireccion", DEVOLUCION_DEFAULT_EMPRESA.direccion),
      telefonos: str("empresaTelefonos", DEVOLUCION_DEFAULT_EMPRESA.telefonos),
      correo1: str("empresaCorreo1", DEVOLUCION_DEFAULT_EMPRESA.correo1),
      correo2: str("empresaCorreo2", DEVOLUCION_DEFAULT_EMPRESA.correo2),
    },
    empleado: {
      nombre: str("nombre", d.empleado.nombre),
      dni: str("dni", d.empleado.dni),
    },
    responsable: {
      nombre: str("responsableNombre", d.responsable.nombre),
      dni: str("responsableDni", d.responsable.dni),
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
    firmaResponsableSrc: str(
      "firmaResponsableSrc",
      d.firmaResponsableSrc ?? "/firmasistemas.png",
    ),
    signatureField: d.signatureField,
  };

  return (
    <main className="min-h-screen bg-neutral-200 py-6 print:bg-white print:py-0">
      <CargoDevolucionLaptopSigner
        data={data}
        documentoId={str("documentoId", "")}
        token={str("token", "")}
        meta={Object.keys(meta).length > 0 ? meta : undefined}
      />
    </main>
  );
}
