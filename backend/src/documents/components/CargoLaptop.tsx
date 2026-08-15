/// <reference types="react" />
import React from "react"

const CARGO_LAPTOP_SIGNATURE_FIELD = { page: 1, x: 30, y: 220, width: 150, height: 50 }

export default function CargoLaptop({
  empresa,
  empleado,
  equipo,
  fecha,
  logoSrc = "/logo.png",
  firmaSrc,
  firmaPosicion,
  signatureField = CARGO_LAPTOP_SIGNATURE_FIELD,
}: any) {
  const rows: { label: string; value: string }[] = [
    { label: "ASIGNADO", value: empleado.nombre },
    ...(equipo.caracteristicas || []).map((c: any) => ({ label: c.clave, value: c.valor })),
    { label: "S/N", value: equipo.serie },
  ]

  const accs = equipo.accesoriosDetalle || []

  const tipoEquipo = (equipo.tipo || 'laptop').toLowerCase()
  const titulo = `Cargo de entrega de equipo ${tipoEquipo}`

  return (
    <div id="cargo-laptop-document"
      className="relative isolate w-[210mm] bg-white text-black mx-auto shadow-sm print:shadow-none"
      style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: "11pt", boxSizing: "border-box", padding: "16mm 18mm 14mm 18mm", height: "297mm" }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 0 }}>
        <img src={logoSrc} alt="" draggable={false} className="select-none object-contain"
          style={{ width: "130mm", maxWidth: "70%", height: "auto", opacity: 0.09, mixBlendMode: "multiply" }} />
      </div>
      <div className="relative flex h-full flex-col" style={{ zIndex: 1, isolation: "isolate" }}>
        <header className="flex items-start gap-4 bg-transparent">
          <img src={logoSrc} alt={`Logo ${empresa.nombre}`} className="w-[22mm] h-auto object-contain shrink-0 mt-0.5" />
          <div className="leading-snug pt-0.5">
            <p className="font-normal text-[12pt]">{empresa.nombre}</p>
            <p className="font-normal text-[11pt]">RUC: {empresa.ruc}</p>
            <p className="text-[10pt] mt-0.5">{empresa.direccion}{empresa.telefonos ? ` - ${empresa.telefonos}` : ""}</p>
          </div>
        </header>
        <hr className="my-4 border-0 border-t border-black" />
        <h1 className="text-center font-bold underline uppercase text-[12pt] tracking-wide mb-6">{titulo}</h1>
        <p className="leading-relaxed text-justify uppercase text-[11pt]">Recibí de <span className="font-bold">{empresa.nombre}</span> un equipo laptop con las siguientes características:</p>
        <table className="relative w-full mt-5 border-collapse text-[11pt]" style={{ zIndex: 2, backgroundColor: "transparent", border: "1px solid #000" }}>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} style={{ backgroundColor: "transparent" }}>
                <td className="px-2 py-1.5 font-normal w-[32%] uppercase align-top" style={{ backgroundColor: "transparent", border: "1px solid #000", position: "relative", zIndex: 2 }}>{row.label}</td>
                <td className="px-2 py-1.5 font-bold uppercase align-top" style={{ backgroundColor: "transparent", border: "1px solid #000", position: "relative", zIndex: 2 }}>{row.value}</td>
              </tr>
            ))}
            <tr style={{ backgroundColor: "transparent" }}>
              <td className="px-2 py-1.5 font-normal w-[32%] uppercase align-top" style={{ backgroundColor: "transparent", border: "1px solid #000", position: "relative", zIndex: 2 }}>ACCESORIOS ENTREGADOS</td>
              <td className="px-2 py-1.5 font-bold uppercase align-top" style={{ backgroundColor: "transparent", border: "1px solid #000", position: "relative", zIndex: 2 }}>
                {accs.length > 0
                  ? accs.map((a: any, i: number) => (
                      <div key={i} style={{ marginBottom: i === accs.length - 1 ? 0 : "3px" }}>• {a.nombre}{a.marca ? ` ${a.marca}` : ''}{a.modelo ? ` ${a.modelo}` : ''}</div>
                    ))
                  : 'No se entregó accesorios'}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="text-justify leading-relaxed text-[11pt] uppercase" style={{ marginTop: "20px" }}>
          <p style={{ marginBottom: "14px" }}>Considero que este equipo debe ser usado exclusivamente para trabajo, es mi obligación responder cada vez que me llamen por asuntos laborales.</p>
          <p style={{ marginBottom: "14px" }}>Asimismo, está prohibido compartir el equipo e instalar aplicaciones que no se usan dentro del trabajo, caso contrario se le aplicará un memorandum por incumplimiento.</p>
          <p>Es mi responsabilidad ante cualquier siniestro (robo o hurto), la reposicion del equipo en el menor tiempo posible y razonable. Ademas de comunicar de forma inmediata al area de sistemas (922386045).</p>
        </div>
        <p className="mt-6 uppercase text-[11pt]" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>San Juan de Lurigancho, {fecha}</p>
        <div id="signature-block" className="w-[58mm] text-center relative" style={{ marginTop: "28px", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <div id="signature-field" data-field="signature" className="relative mx-auto flex w-full items-end justify-center" style={{ height: "16mm" }}>
            {firmaSrc && !firmaPosicion ? (
              <img id="signature-image" src={firmaSrc} alt="Firma" className="max-h-[16mm] max-w-full object-contain" />
            ) : (
              <img id="signature-image" alt="" className="hidden max-h-[16mm] max-w-full object-contain" />
            )}
          </div>
          <div className="border-t border-black w-full pt-2 min-h-[1.5rem]">
            <span className="uppercase text-[11pt]">{empleado.nombre}</span>
          </div>
          <p className="mt-2 uppercase text-[11pt]">DNI: {empleado.dni}</p>
        </div>
        <footer className="mt-auto" style={{ paddingTop: "20px", marginBottom: "16px", breakInside: "avoid", pageBreakInside: "avoid" }}>
          <div className="border-t border-black w-full mb-2" />
          <p className="text-center text-[9.5pt] leading-tight">{empresa.direccion}{empresa.telefonos ? ` - ${empresa.telefonos}` : ""}</p>
        </footer>
      </div>
      {firmaSrc && firmaPosicion ? (
        <img id="signature-overlay" src={firmaSrc} alt="Firma"
          style={{
            position: "absolute",
            left: `${firmaPosicion.left}%`,
            top: `${firmaPosicion.top}%`,
            width: `${firmaPosicion.width}%`,
            height: `${firmaPosicion.height}%`,
            objectFit: "contain",
            zIndex: 20,
          }} />
      ) : null}
    </div>
  )
}

