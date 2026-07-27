export const LAYOUTS = {
  ENTREGA_LAPTOP_V1: {
    asignado: { x: 142, y: 583, size: 10, maxWidth: 330 },
    marca: { x: 142, y: 565, size: 10, maxWidth: 330 },
    modelo: { x: 142, y: 547, size: 10, maxWidth: 330 },
    color: { x: 142, y: 529, size: 10, maxWidth: 330 },
    ram: { x: 142, y: 512, size: 10, maxWidth: 330 },
    capacidad: { x: 142, y: 494, size: 10, maxWidth: 330 },
    serie: { x: 142, y: 476, size: 10, maxWidth: 330 },

    accesorios: {
      x: 72,
      y: 444,
      size: 9,
      lineHeight: 12,
      maxWidth: 405,
      minY: 280,
    },

    fecha: { x: 145, y: 233, size: 10, maxWidth: 250 },
    nombreFirmante: { x: 120, y: 162, size: 10, maxWidth: 200 },
    dniFirmante: { x: 120, y: 145, size: 10, maxWidth: 120 },
  },

  DEVOLUCION_LAPTOP_V1: {
    recibiDe: { x: 124, y: 611, size: 10, maxWidth: 160 },

    asignado: { x: 155, y: 577, size: 10, maxWidth: 330 },
    marca: { x: 155, y: 559, size: 10, maxWidth: 330 },
    modelo: { x: 155, y: 541, size: 10, maxWidth: 330 },
    color: { x: 155, y: 523, size: 10, maxWidth: 330 },
    ram: { x: 155, y: 506, size: 10, maxWidth: 330 },
    capacidad: { x: 155, y: 488, size: 10, maxWidth: 330 },
    serie: { x: 155, y: 470, size: 10, maxWidth: 330 },

    accesorios: {
      x: 72,
      y: 438,
      size: 9,
      lineHeight: 12,
      maxWidth: 405,
      minY: 280,
    },

    fecha: { x: 145, y: 365, size: 10, maxWidth: 250 },
    nombreFirmante: { x: 405, y: 261, size: 10, maxWidth: 170 },
    dniFirmante: { x: 405, y: 249, size: 10, maxWidth: 120 },
  },
};

export function getLayout(tipoActa, plantilla) {
  const key = plantilla || (tipoActa === 'ENTREGA' ? 'ENTREGA_LAPTOP_V1' : 'DEVOLUCION_LAPTOP_V1');
  return LAYOUTS[key];
}
