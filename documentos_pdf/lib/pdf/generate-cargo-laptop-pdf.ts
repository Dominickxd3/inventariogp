import puppeteer from "puppeteer";

export type CargoLaptopPdfInput = {
  empresaNombre?: string;
  empresaRuc?: string;
  empresaDireccion?: string;
  empresaTelefonos?: string;
  nombre?: string;
  dni?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  ram?: string;
  capacidad?: string;
  serie?: string;
  accesorios?: string;
  fecha?: string;
  logoSrc?: string;
  firma?: string;
};

const QUERY_KEYS: (keyof CargoLaptopPdfInput)[] = [
  "empresaNombre",
  "empresaRuc",
  "empresaDireccion",
  "empresaTelefonos",
  "nombre",
  "dni",
  "marca",
  "modelo",
  "color",
  "ram",
  "capacidad",
  "serie",
  "accesorios",
  "fecha",
  "logoSrc",
];

export function buildCargoLaptopQuery(body: CargoLaptopPdfInput): string {
  const params = new URLSearchParams();
  for (const key of QUERY_KEYS) {
    const value = body[key];
    if (typeof value === "string" && value.length > 0) {
      params.set(key, value);
    }
  }
  // Evita UI de firma en el render del PDF
  params.set("mode", "print");
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function generateCargoLaptopPdf(
  origin: string,
  body: CargoLaptopPdfInput,
): Promise<Buffer> {
  const url = `${origin}/documentos/cargo-laptop${buildCargoLaptopQuery(body)}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });

    await page.evaluate((firma) => {
      document.querySelectorAll("[data-no-print]").forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      const field = document.getElementById("signature-field");
      if (!field) return;

      field.querySelectorAll("canvas, button, p").forEach((el) => el.remove());

      let img = document.getElementById(
        "signature-image",
      ) as HTMLImageElement | null;

      if (!img) {
        img = document.createElement("img");
        img.id = "signature-image";
        img.alt = "Firma";
        field.appendChild(img);
      }

      if (firma) {
        img.src = firma;
        img.classList.remove("hidden");
        img.style.display = "block";
        img.style.maxHeight = "16mm";
        img.style.maxWidth = "100%";
        img.style.objectFit = "contain";
        img.style.margin = "0 auto";
      } else {
        img.style.display = "none";
      }
    }, body.firma ?? null);

    if (body.firma) {
      await page
        .waitForFunction(
          () => {
            const img = document.getElementById(
              "signature-image",
            ) as HTMLImageElement | null;
            return Boolean(img && img.complete && img.naturalWidth > 0);
          },
          { timeout: 10000 },
        )
        .catch(() => undefined);
    }

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
