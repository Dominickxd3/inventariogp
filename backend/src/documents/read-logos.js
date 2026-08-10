import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const logosDir = resolve(__dirname, '..', 'assets', 'actas', 'logos')

export function readBase64(filename) {
  try {
    const buf = readFileSync(resolve(logosDir, filename))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}
