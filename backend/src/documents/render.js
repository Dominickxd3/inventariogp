import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import CargoLaptop from './components/CargoLaptop.js'
import CargoDevolucionLaptop from './components/CargoDevolucionLaptop.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tailwindCss = readFileSync(resolve(__dirname, 'tailwind.css'), 'utf8')

export function renderCargoLaptopHtml(data) {
  const bodyHtml = renderToStaticMarkup(h(CargoLaptop, data))
  return wrapHtml(bodyHtml, tailwindCss)
}

export function renderCargoDevolucionHtml(data) {
  const bodyHtml = renderToStaticMarkup(h(CargoDevolucionLaptop, data))
  return wrapHtml(bodyHtml, tailwindCss)
}

function wrapHtml(body, css) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { height: 100%; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
${css}
</style>
</head>
<body>
${body}
</body>
</html>`
}
