import { createElement as h } from 'react'

export default function CargoDevolucionLaptop({
  empresa,
  empleado,
  responsable,
  equipo,
  fecha,
  logoSrc = '/logo.png',
  firmaSrc,
  firmaResponsableSrc = '/firmasistemas.png',
}) {
  const rows = [
    ['ASIGNADO', empleado.nombre],
    ['MARCA', equipo.marca],
    ['MODELO', equipo.modelo],
    ['COLOR', equipo.color],
    ['RAM', equipo.ram],
    ['CAPACIDAD', equipo.capacidad],
    ['S/N', equipo.serie],
    ['ACCESORIOS', equipo.accesorios],
  ]

  const firmaCol = (nombre, dni, imgSrc) =>
    h('div', { className: 'w-[58mm] text-center' },
      h('div', { className: 'mx-auto flex h-[16mm] w-full items-end justify-center' },
        imgSrc
          ? h('img', { src: imgSrc, alt: `Firma ${nombre}`, className: 'max-h-[14mm] max-w-full object-contain' })
          : null
      ),
      h('div', { className: 'border-t border-black w-full pt-1.5 uppercase text-[11pt]' }, nombre),
      h('p', { className: 'mt-1 uppercase text-[11pt]' }, `DNI: ${dni}`),
    )

  return h('div', {
    id: 'cargo-devolucion-laptop-document',
    className: 'relative isolate w-[210mm] bg-white text-black mx-auto overflow-hidden',
    style: {
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '11pt',
      boxSizing: 'border-box',
      padding: '16mm 18mm 14mm 18mm',
    },
  },
    h('div', {
      'aria-hidden': true,
      className: 'pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden',
      style: { zIndex: 0 },
    },
      h('img', {
        src: logoSrc, alt: '', draggable: false, className: 'select-none object-contain',
        style: { width: '130mm', maxWidth: '70%', height: 'auto', opacity: 0.09 },
      })
    ),
    h('div', { className: 'relative flex flex-col', style: { zIndex: 1, isolation: 'isolate' } },
      h('header', { className: 'flex items-start gap-4 bg-transparent' },
        h('img', { src: logoSrc, alt: `Logo ${empresa.nombre}`, className: 'w-[22mm] h-auto object-contain shrink-0 mt-0.5' }),
        h('div', { className: 'leading-snug pt-0.5' },
          h('p', { className: 'font-normal text-[12pt]' }, empresa.nombre),
          h('p', { className: 'font-normal text-[11pt]' }, `RUC: ${empresa.ruc}`),
          h('p', { className: 'text-[10pt] mt-0.5' }, `${empresa.direccion} - ${empresa.telefonos}`),
        )
      ),
      h('hr', { className: 'my-3 border-0 border-t border-black' }),
      h('h1', { className: 'text-center font-bold underline uppercase text-[12pt] tracking-wide mb-4' },
        'Cargo de devolución de equipo laptop'
      ),
      h('p', { className: 'leading-relaxed text-justify uppercase text-[11pt]' },
        'Recibí de ', h('span', { className: 'font-bold' }, empleado.nombre),
        ', el equipo laptop asignado con las siguientes características:'
      ),
      h('table', {
        className: 'w-full mt-4 border-collapse text-[11pt]',
        style: { backgroundColor: 'transparent', border: '1px solid #000' },
      },
        h('tbody', null,
          rows.map(([label, value]) =>
            h('tr', { key: label, style: { backgroundColor: 'transparent' } },
              h('td', {
                className: 'px-2 py-1 font-normal w-[32%] uppercase',
                style: { backgroundColor: 'transparent', border: '1px solid #000', verticalAlign: 'middle' },
              }, label),
              h('td', {
                className: 'px-2 py-1 font-bold uppercase',
                style: { backgroundColor: 'transparent', border: '1px solid #000', verticalAlign: 'middle' },
              }, value),
            )
          )
        )
      ),
      h('p', { className: 'mt-4 uppercase text-[11pt] text-justify' }, 'El equipo se recibió en condiciones aceptables.'),
      h('p', { className: 'mt-4 uppercase text-[11pt]' }, `San Juan de Lurigancho, ${fecha}`),
      h('div', { className: 'mt-8 flex justify-between gap-8 items-start' },
        firmaCol(responsable.nombre, responsable.dni, firmaResponsableSrc),
        firmaCol(empleado.nombre, empleado.dni, firmaSrc),
      ),
      h('footer', { className: 'mt-8 pt-3' },
        h('div', { className: 'border-t border-black w-full mb-2' }),
        h('p', { className: 'text-center text-[9pt] leading-tight' }, `${empresa.direccion} - ${empresa.telefonos}`),
      )
    )
  )
}
