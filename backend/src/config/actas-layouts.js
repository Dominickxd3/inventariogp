import ENTREGA_LAPTOP_V1 from './layouts/entrega-laptop-layout.js';
import DEVOLUCION_LAPTOP_V1 from './layouts/devolucion-laptop-layout.js';

export const LAYOUTS = {
  ENTREGA_LAPTOP_V1,
  DEVOLUCION_LAPTOP_V1,
};

export function getLayout(tipoActa, plantilla) {
  const key = plantilla || (tipoActa === 'ENTREGA' ? 'ENTREGA_LAPTOP_V1' : 'DEVOLUCION_LAPTOP_V1');
  return LAYOUTS[key];
}
