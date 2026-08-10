export default function cargoLaptopHtml(data) {
  const rows = [
    { label: 'ASIGNADO', value: data.empleado.nombre },
    { label: 'MARCA', value: data.equipo.marca },
    { label: 'MODELO', value: data.equipo.modelo },
    { label: 'COLOR', value: data.equipo.color },
    { label: 'RAM', value: data.equipo.ram },
    { label: 'CAPACIDAD', value: data.equipo.capacidad },
    { label: 'S/N', value: data.equipo.serie },
    { label: 'ACCESORIOS', value: data.equipo.accesorios },
  ]

  const firmaImg = data.firma
    ? `<img src="${data.firma}" alt="Firma" style="max-height:16mm;max-width:100%;object-fit:contain;margin:0 auto;display:block;" />`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 210mm; min-height: 297mm;
    background: white; color: black;
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    padding: 16mm 18mm 14mm 18mm;
    overflow: hidden;
  }
  .page { position: relative; height: 100%; display: flex; flex-direction: column; }
  .watermark {
    position: absolute; inset: 0; z-index: 0;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; pointer-events: none;
  }
  .watermark img { width: 130mm; max-width: 70%; height: auto; opacity: 0.09; mix-blend-mode: multiply; }
  .content { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; }
  header { display: flex; align-items: flex-start; gap: 16px; background: transparent; }
  header img { width: 22mm; height: auto; object-fit: contain; flex-shrink: 0; margin-top: 2px; }
  .company { line-height: 1.375; padding-top: 2px; }
  .company-name { font-size: 12pt; font-weight: normal; }
  .company-ruc { font-size: 11pt; }
  .company-addr { font-size: 10pt; margin-top: 2px; }
  hr { margin: 16px 0; border: none; border-top: 1px solid #000; }
  h1 {
    text-align: center; font-weight: bold; text-decoration: underline;
    text-transform: uppercase; font-size: 12pt; letter-spacing: 0.025em;
    margin-bottom: 24px;
  }
  .intro { text-align: justify; text-transform: uppercase; line-height: 1.625; }
  .intro span { font-weight: bold; }
  table {
    width: 100%; margin-top: 20px; border-collapse: collapse;
    font-size: 11pt; background: transparent;
  }
  table td {
    padding: 6px 8px; border: 1px solid #000;
    text-transform: uppercase; vertical-align: top;
    background: transparent;
  }
  .label { font-weight: normal; width: 32%; }
  .value { font-weight: bold; }
  .legal { margin-top: 24px; text-align: justify; line-height: 1.625; text-transform: uppercase; }
  .legal p { margin-bottom: 12px; }
  .fecha { margin-top: 28px; text-transform: uppercase; }
  .firma-block { margin-top: 56px; width: 58mm; text-align: center; }
  .firma-field { margin: 0 auto; display: flex; height: 18mm; width: 100%; align-items: flex-end; justify-content: center; }
  .firma-line { border-top: 1px solid #000; width: 100%; padding-top: 8px; min-height: 1.5rem; text-transform: uppercase; }
  .dni-text { margin-top: 8px; text-transform: uppercase; }
  footer { margin-top: auto; padding-top: 32px; }
  footer .foot-line { border-top: 1px solid #000; width: 100%; margin-bottom: 8px; }
  footer p { text-align: center; font-size: 9.5pt; line-height: 1.25; }
</style>
</head>
<body>
<div class="page">
  <div class="watermark" aria-hidden="true">
    <img src="${data.logoSrc || ''}" alt="" draggable="false" />
  </div>
  <div class="content">
    <header>
      <img src="${data.logoSrc || ''}" alt="Logo ${data.empresa.nombre}" />
      <div class="company">
        <p class="company-name">${data.empresa.nombre}</p>
        <p class="company-ruc">RUC: ${data.empresa.ruc}</p>
        <p class="company-addr">${data.empresa.direccion} - ${data.empresa.telefonos}</p>
      </div>
    </header>
    <hr />
    <h1>Cargo de entrega de equipo laptop</h1>
    <p class="intro">Recibí de <span>${data.empresa.nombre}</span> un equipo laptop con las siguientes características:</p>
    <table>
      <tbody>
        ${rows.map(r => `<tr>
          <td class="label">${r.label}</td>
          <td class="value">${r.value}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="legal">
      <p>Considero que este equipo debe ser usado exclusivamente para trabajo, es mi obligación responder cada vez que me llamen por asuntos laborales.</p>
      <p>Asimismo, está prohibido compartir el equipo e instalar aplicaciones que no se usan dentro del trabajo, caso contrario se le aplicará un memorandum por incumplimiento.</p>
      <p>Es mi responsabilidad ante cualquier siniestro (robo o hurto), la reposicion del equipo en el menor tiempo posible y razonable. Ademas de comunicar de forma inmediata al area de sistemas (922386045).</p>
    </div>
    <p class="fecha">San Juan de Lurigancho, ${data.fecha}</p>
    <div class="firma-block">
      <div class="firma-field">${firmaImg}</div>
      <div class="firma-line">${data.empleado.nombre}</div>
      <p class="dni-text">DNI: ${data.empleado.dni}</p>
    </div>
    <footer>
      <div class="foot-line"></div>
      <p>${data.empresa.direccion} - ${data.empresa.telefonos}</p>
    </footer>
  </div>
</div>
</body>
</html>`
}
