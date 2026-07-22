const BASE = {
  pageSize: { width: 595.276, height: 841.890 },
  trabajador: { x: 130, y: 645, size: 10 },
  dni: { x: 260, y: 645, size: 10 },
  tabla: {
    row1Y: 518,
    rowHeight: 18,
  },
  accesorios: {
    x: 68,
    startY: 300,
    lineHeight: 14,
    minY: 200,
  },
  fecha: { x: 68, y: 350, size: 9 },
  firmaLinea: { x: 120, y: 160, width: 200, yLine: 155 },
  nombreFirma: { x: 120, y: 140, size: 10 },
  dniFirma: { x: 120, y: 125, size: 10 },
};

export const LAYOUTS = {
  ENTREGA_LAPTOP_V1: { ...BASE },
  DEVOLUCION_LAPTOP_V1: { ...BASE },
};

export function getLayout(tipoActa, plantilla) {
  const key = plantilla || (tipoActa === 'ENTREGA' ? 'ENTREGA_LAPTOP_V1' : 'DEVOLUCION_LAPTOP_V1');
  return LAYOUTS[key];
}
