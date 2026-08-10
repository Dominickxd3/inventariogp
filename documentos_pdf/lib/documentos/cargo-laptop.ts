export type EmpresaData = {
  nombre: string;
  ruc: string;
  direccion: string;
  telefonos: string;
};

export type EmpleadoData = {
  nombre: string;
  dni: string;
};

export type EquipoData = {
  marca: string;
  modelo: string;
  color: string;
  ram: string;
  capacidad: string;
  serie: string;
  accesorios: string;
};

/** Coordenadas en mm desde la esquina superior izquierda de la página A4 */
export type SignatureField = {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CargoLaptopData = {
  empresa: EmpresaData;
  empleado: EmpleadoData;
  equipo: EquipoData;
  fecha: string;
  logoSrc?: string;
  /** Imagen de firma (data URL PNG/JPEG) colocada sobre la línea de firma */
  firmaSrc?: string;
  signatureField?: SignatureField;
};

/** Campo de firma invisible para integración posterior (mm, página A4) */
export const CARGO_LAPTOP_SIGNATURE_FIELD: SignatureField = {
  page: 1,
  x: 30,
  y: 220,
  width: 150,
  height: 50,
};

export const DEFAULT_EMPRESA: EmpresaData = {
  nombre: "Grupo Pecuario S.A.C.",
  ruc: "20513967234",
  direccion: "Av. Canto Bello 200 Urb. Canto Bello Lima 36",
  telefonos: "Telf.3872967 - 922386045",
};

export const DEFAULT_CARGO_LAPTOP: CargoLaptopData = {
  empresa: DEFAULT_EMPRESA,
  empleado: {
    nombre: "JUAN PÉREZ GARCÍA",
    dni: "12345678",
  },
  equipo: {
    marca: "Lenovo",
    modelo: "ThinkPad E14",
    color: "Negro",
    ram: "16 GB",
    capacidad: "512 GB SSD",
    serie: "PF3ABCDE",
    accesorios: "Cargador, maletín",
  },
  fecha: "08 de agosto de 2026",
  logoSrc: "/logo.png",
  signatureField: CARGO_LAPTOP_SIGNATURE_FIELD,
};
