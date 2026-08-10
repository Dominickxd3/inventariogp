import type { SignatureField } from "@/lib/documentos/cargo-laptop";

export type DevolucionEmpresaData = {
  nombre: string;
  ruc: string;
  direccion: string;
  telefonos: string;
  correo1: string;
  correo2: string;
};

export type DevolucionEmpleadoData = {
  nombre: string;
  dni: string;
};

export type DevolucionResponsableData = {
  nombre: string;
  dni: string;
};

export type DevolucionEquipoData = {
  marca: string;
  modelo: string;
  color: string;
  ram: string;
  capacidad: string;
  serie: string;
  accesorios: string;
};

export type CargoDevolucionLaptopData = {
  empresa: DevolucionEmpresaData;
  empleado: DevolucionEmpleadoData;
  responsable: DevolucionResponsableData;
  equipo: DevolucionEquipoData;
  fecha: string;
  logoSrc?: string;
  firmaSrc?: string;
  /** Firma precargada del responsable (imagen) */
  firmaResponsableSrc?: string;
  signatureField?: SignatureField;
};

/** Campo de firma invisible para integración posterior (mm, página A4) */
export const CARGO_DEVOLUCION_SIGNATURE_FIELD: SignatureField = {
  page: 1,
  x: 30,
  y: 220,
  width: 150,
  height: 50,
};

export const DEVOLUCION_DEFAULT_EMPRESA: DevolucionEmpresaData = {
  nombre: "Grupo Pecuario S.A.C.",
  ruc: "20513967234",
  direccion: "Av. Canto Bello 200 Urb. Canto Bello Lima 36",
  telefonos: "Telf.3872967 - 922386045",
  correo1: "grupecsac@hotmail.com",
  correo2: "ventas@grupecsac.pe",
};

export const DEFAULT_CARGO_DEVOLUCION_LAPTOP: CargoDevolucionLaptopData = {
  empresa: DEVOLUCION_DEFAULT_EMPRESA,
  empleado: {
    nombre: "JUAN PÉREZ GARCÍA",
    dni: "12345678",
  },
  responsable: {
    nombre: "EDWYN ANTONIO MONTORO MARREROS",
    dni: "87654321",
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
  firmaResponsableSrc: "/firmasistemas.png",
  signatureField: CARGO_DEVOLUCION_SIGNATURE_FIELD,
};
