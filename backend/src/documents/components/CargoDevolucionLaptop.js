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
  signatureField,
  signatureSlot,
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

  const estilo = {
    fontFamily: '"Times New Roman", Times, serif',
    fontSize: '11pt',
    boxSizing: 'border-box',
    padding: '16mm 18mm 14mm 18mm',
  }

  return h('div', {
    id: 'cargo-devolucion-laptop-document',
    className: 'relative isolate w-[210mm] h-[297mm] bg-white text-black mx-auto overflow-hidden shadow-sm print:shadow-none',
    style: estilo,
  },
    h('div', { 'aria-hidden': true, className: 'pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden',
      style: { zIndex: 0 } },
      h('img', { src: logoSrc, alt: '', draggable: false, className: 'select-none object-contain',
        style: { width: '130mm', maxWidth: '70%', height: 'auto', opacity: 0.09, mixBlendMode: 'multiply' } })
    ),
    h('div', { className: 'relative flex h-full flex-col', style: { zIndex: 10, isolation: 'isolate' } },
      h('header', { className: 'flex items-start gap-4 bg-transparent' },
        h('img', { src: logoSrc, alt: `Logo ${empresa.nombre}`, className: 'w-[22mm] h-auto object-contain shrink-0 mt-0.5' }),
        h('div', { className: 'leading-snug pt-0.5' },
          h('p', { className: 'font-normal text-[12pt]' }, empresa.nombre),
          h('p', { className: 'font-normal text-[11pt]' }, `RUC: ${empresa.ruc}`),
          h('p', { className: 'text-[10pt] mt-0.5' }, `${empresa.direccion} - ${empresa.telefonos}`),
        )
      ),
      h('hr', { className: 'my-4 border-0 border-t border-black' }),
      h('h1', { className: 'text-center font-bold underline uppercase text-[12pt] tracking-wide mb-6' },
        'Cargo de devolución de equipo laptop'
      ),
      h('p', { className: 'leading-relaxed text-justify uppercase text-[11pt]' },
        'Recibí de ', h('span', { className: 'font-bold' }, empleado.nombre),
        ', el equipo laptop asignado con las siguientes características:'
      ),
      h('table', { className: 'relative w-full mt-5 border-collapse text-[11pt]', style: { zIndex: 2, backgroundColor: 'transparent', border: '1px solid #000' } },
        h('tbody', null,
          rows.map(([label, value]) =>
            h('tr', { key: label, style: { backgroundColor: 'transparent' } },
              h('td', { className: 'px-2 py-1.5 font-normal w-[32%] uppercase align-top',
                style: { backgroundColor: 'transparent', border: '1px solid #000', position: 'relative', zIndex: 2 } }, label),
              h('td', { className: 'px-2 py-1.5 font-bold uppercase align-top',
                style: { backgroundColor: 'transparent', border: '1px solid #000', position: 'relative', zIndex: 2 } }, value),
            )
          )
        )
      ),
      h('p', { className: 'mt-6 uppercase text-[11pt] text-justify' }, 'El equipo se recibió en condiciones aceptables.'),
      h('p', { className: 'mt-6 uppercase text-[11pt]' }, `San Juan de Lurigancho, ${fecha}`),
      h('div', { className: 'mt-12 flex justify-between gap-8' },
        // Firma responsable
        h('div', { className: 'w-[58mm] text-center relative' },
          h('div', { className: 'mx-auto flex h-[18mm] w-full items-end justify-center' },
            firmaResponsableSrc && h('img', { src: firmaResponsableSrc, alt: `Firma ${responsable.nombre}`, className: 'max-h-[16mm] max-w-full object-contain' })
          ),
          h('div', { className: 'border-t border-black w-full pt-2 min-h-[1.5rem]' },
            h('span', { className: 'uppercase text-[11pt]' }, responsable.nombre)
          ),
          h('p', { className: 'mt-2 uppercase text-[11pt]' }, `DNI: ${responsable.dni}`),
        ),
        // Firma usuario
        h('div', { id: 'signature-block', className: 'w-[58mm] text-center relative' },
          h('div', { id: 'signature-field', 'data-field': 'signature', className: 'relative mx-auto flex h-[18mm] w-full items-end justify-center' },
            signatureSlot ||
            (firmaSrc ? h('img', { id: 'signature-image', src: firmaSrc, alt: 'Firma', className: 'max-h-[16mm] max-w-full object-contain' }) : null)
          ),
          h('div', { className: 'border-t border-black w-full pt-2 min-h-[1.5rem]' },
            h('span', { className: 'uppercase text-[11pt]' }, empleado.nombre)
          ),
          h('p', { className: 'mt-2 uppercase text-[11pt]' }, `DNI: ${empleado.dni}`),
        )
      ),
      h('footer', { className: 'mt-auto pt-8' },
        h('div', { className: 'border-t border-black w-full mb-2' }),
        h('p', { className: 'text-center text-[9.5pt] leading-tight' }, `${empresa.direccion} - ${empresa.telefonos}`),
      )
    )
  )
}
