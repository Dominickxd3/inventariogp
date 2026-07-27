export const LAYOUTS = {
  ENTREGA_LAPTOP_V1: {
    asignado: { x: 150, y: 510, size: 10, maxWidth: 330 },
    marca: { x: 150, y: 492, size: 10, maxWidth: 330 },
    modelo: { x: 150, y: 474, size: 10, maxWidth: 330 },
    color: { x: 150, y: 456, size: 10, maxWidth: 330 },
    ram: { x: 150, y: 438, size: 10, maxWidth: 330 },
    capacidad: { x: 150, y: 420, size: 10, maxWidth: 330 },
    serie: { x: 150, y: 402, size: 10, maxWidth: 330 },

    accesorios: {
      x: 72,
      y: 370,
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
    recibiDe: { x: 124, y: 538, size: 10, maxWidth: 160 },

    asignado: { x: 150, y: 504, size: 10, maxWidth: 330 },
    marca: { x: 150, y: 486, size: 10, maxWidth: 330 },
    modelo: { x: 150, y: 468, size: 10, maxWidth: 330 },
    color: { x: 150, y: 450, size: 10, maxWidth: 330 },
    ram: { x: 150, y: 433, size: 10, maxWidth: 330 },
    capacidad: { x: 150, y: 415, size: 10, maxWidth: 330 },
    serie: { x: 150, y: 397, size: 10, maxWidth: 330 },

    accesorios: {
      x: 72,
      y: 365,
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
