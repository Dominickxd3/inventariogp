export const LAYOUTS = {
  ENTREGA_LAPTOP_V1: {
    pageSize: { width: 595.276, height: 841.890 },
    trabajador: { x: 70, y: 610, size: 11 },
    dni: { x: 70, y: 590, size: 11 },
    marca: { x: 70, y: 530, size: 11 },
    modelo: { x: 300, y: 530, size: 11 },
    color: { x: 70, y: 510, size: 11 },
    ram: { x: 300, y: 510, size: 11 },
    capacidad: { x: 70, y: 490, size: 11 },
    serie: { x: 300, y: 490, size: 11 },
    accesorios: { x: 70, y: 420, width: 455, lineHeight: 14, size: 10 },
    fecha: { x: 70, y: 250, size: 11 },
    firmaLinea: { x: 120, y: 160, width: 200, yLine: 155 },
    nombreFirma: { x: 120, y: 140, size: 10 },
    dniFirma: { x: 120, y: 125, size: 10 },
    watermark: { x: 200, y: 400, size: 40, opacity: 0.08 },
    footerText: 'Av. Canto Bello 200 Urb. Canto Bello Lima 36 - Telf. 3872967 - 922386045',
    footerY: 50,
  },
  DEVOLUCION_LAPTOP_V1: {
    pageSize: { width: 595.276, height: 841.890 },
    trabajador: { x: 70, y: 610, size: 11 },
    dni: { x: 70, y: 590, size: 11 },
    marca: { x: 70, y: 530, size: 11 },
    modelo: { x: 300, y: 530, size: 11 },
    color: { x: 70, y: 510, size: 11 },
    ram: { x: 300, y: 510, size: 11 },
    capacidad: { x: 70, y: 490, size: 11 },
    serie: { x: 300, y: 490, size: 11 },
    accesorios: { x: 70, y: 420, width: 455, lineHeight: 14, size: 10 },
    fecha: { x: 70, y: 250, size: 11 },
    firmaLinea: { x: 120, y: 160, width: 200, yLine: 155 },
    nombreFirma: { x: 120, y: 140, size: 10 },
    dniFirma: { x: 120, y: 125, size: 10 },
    watermark: { x: 200, y: 400, size: 40, opacity: 0.08 },
    footerText: 'Av. Canto Bello 200 Urb. Canto Bello Lima 36 - Telf. 3872967 - 922386045',
    footerY: 50,
  },
};

export function getLayout(tipoActa, plantilla) {
  const key = plantilla || (tipoActa === 'ENTREGA' ? 'ENTREGA_LAPTOP_V1' : 'DEVOLUCION_LAPTOP_V1');
  return LAYOUTS[key];
}
