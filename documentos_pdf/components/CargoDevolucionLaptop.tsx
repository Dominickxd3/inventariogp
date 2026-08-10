import React from "react";
import {
  CARGO_DEVOLUCION_SIGNATURE_FIELD,
  type CargoDevolucionLaptopData,
} from "@/lib/documentos/cargo-devolucion-laptop";

export type { CargoDevolucionLaptopData };

type Props = CargoDevolucionLaptopData & {
  /** Si se pasa, el área de firma es interactiva (cliente) */
  signatureSlot?: React.ReactNode;
};

export default function CargoDevolucionLaptop({
  empresa,
  empleado,
  responsable,
  equipo,
  fecha,
  logoSrc = "/logo.png",
  firmaSrc,
  firmaResponsableSrc = "/firmasistemas.png",
  signatureField = CARGO_DEVOLUCION_SIGNATURE_FIELD,
  signatureSlot,
}: Props) {
  const rows: { label: string; value: string }[] = [
    { label: "ASIGNADO", value: empleado.nombre },
    { label: "MARCA", value: equipo.marca },
    { label: "MODELO", value: equipo.modelo },
    { label: "COLOR", value: equipo.color },
    { label: "RAM", value: equipo.ram },
    { label: "CAPACIDAD", value: equipo.capacidad },
    { label: "S/N", value: equipo.serie },
    { label: "ACCESORIOS", value: equipo.accesorios },
  ];

  return (
    <div
      id="cargo-devolucion-laptop-document"
      className="relative isolate w-[210mm] h-[297mm] bg-white text-black mx-auto overflow-hidden shadow-sm print:shadow-none"
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "11pt",
        boxSizing: "border-box",
        padding: "16mm 18mm 14mm 18mm",
      }}
      data-signature-page={signatureField.page}
      data-signature-x={signatureField.x}
      data-signature-y={signatureField.y}
      data-signature-width={signatureField.width}
      data-signature-height={signatureField.height}
    >
      {/* NIVEL 0 — marca de agua */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          alt=""
          draggable={false}
          className="select-none object-contain"
          style={{
            width: "130mm",
            maxWidth: "70%",
            height: "auto",
            opacity: 0.09,
            mixBlendMode: "multiply",
          }}
        />
      </div>

      <div
        className="relative flex h-full flex-col"
        style={{ zIndex: 10, isolation: "isolate" }}
      >
        <header className="flex items-start gap-4 bg-transparent">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoSrc}
            alt={`Logo ${empresa.nombre}`}
            className="w-[22mm] h-auto object-contain shrink-0 mt-0.5"
          />
          <div className="leading-snug pt-0.5">
            <p className="font-normal text-[12pt]">{empresa.nombre}</p>
            <p className="font-normal text-[11pt]">RUC: {empresa.ruc}</p>
            <p className="text-[10pt] mt-0.5">
              {empresa.direccion}
              {empresa.telefonos ? ` - ${empresa.telefonos}` : ""}
            </p>
          </div>
        </header>

        <hr className="my-4 border-0 border-t border-black" />

        <h1 className="text-center font-bold underline uppercase text-[12pt] tracking-wide mb-6">
          Cargo de devolución de equipo laptop
        </h1>

        <p className="leading-relaxed text-justify uppercase text-[11pt]">
          Recibí de{" "}
          <span className="font-bold">{empleado.nombre}</span>, el equipo laptop
          asignado con las siguientes características:
        </p>

        <table
          className="relative w-full mt-5 border-collapse text-[11pt]"
          style={{
            zIndex: 2,
            backgroundColor: "transparent",
            border: "1px solid #000",
          }}
        >
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={{ backgroundColor: "transparent" }}>
                <td
                  className="px-2 py-1.5 font-normal w-[32%] uppercase align-top"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #000",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {row.label}
                </td>
                <td
                  className="px-2 py-1.5 font-bold uppercase align-top"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #000",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-6 uppercase text-[11pt] text-justify">
          El equipo se recibió en condiciones aceptables.
        </p>

        <p className="mt-6 uppercase text-[11pt]">
          San Juan de Lurigancho, {fecha}
        </p>

        {/* Firmas */}
        <div className="mt-12 flex justify-between gap-8">
          {/* Firma responsable (izquierda) */}
          <div className="w-[58mm] text-center relative">
            <div className="mx-auto flex h-[18mm] w-full items-end justify-center">
              {firmaResponsableSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firmaResponsableSrc}
                  alt={`Firma ${responsable.nombre}`}
                  className="max-h-[16mm] max-w-full object-contain"
                />
              )}
            </div>
            <div className="border-t border-black w-full pt-2 min-h-[1.5rem]">
              <span className="uppercase text-[11pt]">
                {responsable.nombre}
              </span>
            </div>
            <p className="mt-2 uppercase text-[11pt]">DNI: {responsable.dni}</p>
          </div>

          {/* Firma usuario que devuelve (derecha) */}
          <div
            id="signature-block"
            className="w-[58mm] text-center relative"
          >
            <div
              id="signature-field"
              data-field="signature"
              data-page={signatureField.page}
              data-x-mm={signatureField.x}
              data-y-mm={signatureField.y}
              data-width-mm={signatureField.width}
              data-height-mm={signatureField.height}
              className="relative mx-auto flex h-[18mm] w-full items-end justify-center"
            >
              {signatureSlot ? (
                signatureSlot
              ) : firmaSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  id="signature-image"
                  src={firmaSrc}
                  alt="Firma"
                  className="max-h-[16mm] max-w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  id="signature-image"
                  alt=""
                  className="hidden max-h-[16mm] max-w-full object-contain"
                />
              )}
            </div>
            <div className="border-t border-black w-full pt-2 min-h-[1.5rem]">
              <span className="uppercase text-[11pt]">{empleado.nombre}</span>
            </div>
            <p className="mt-2 uppercase text-[11pt]">DNI: {empleado.dni}</p>
          </div>
        </div>

        <footer className="mt-auto pt-8">
          <div className="border-t border-black w-full mb-2" />
          <p className="text-center text-[9.5pt] leading-tight">
            {empresa.direccion} - {empresa.telefonos}
          </p>
        </footer>
      </div>
    </div>
  );
}
