import puppeteer from 'puppeteer'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logosDir = path.join(__dirname, '..', '..', 'assets', 'actas', 'logos')

function readBase64(filename) {
  try {
    const buf = readFileSync(path.join(logosDir, filename))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}

export const logoBase64 = readBase64('logo.png')
export const firmaResponsableBase64 = readBase64('firmasistemas.png')

export async function generatePdf(html) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
