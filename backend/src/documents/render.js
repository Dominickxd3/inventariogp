import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { transformSync } from '@swc/core'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tailwindCss = readFileSync(resolve(__dirname, 'tailwind.css'), 'utf8')
const logosDir = resolve(__dirname, '..', '..', 'assets', 'actas', 'logos')

function readBase64(filename) {
  try {
    const buf = readFileSync(resolve(logosDir, filename))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch { return '' }
}

const logoBase64 = readBase64('logo.png')
const firmaResponsableBase64 = readBase64('firmasistemas.png')

function loadComponent(filePath) {
  const src = readFileSync(resolve(__dirname, filePath), 'utf8')

  const result = transformSync(src, {
    jsc: {
      parser: { syntax: 'typescript', tsx: true },
      transform: { react: { runtime: 'classic', pragma: 'React.createElement', pragmaFrag: 'React.Fragment' } },
      target: 'es2022',
    },
    module: { type: 'commonjs' },
  })

  const code = result.code

  const fakeRequire = (id) => {
    if (id === 'react') return { createElement, Fragment: Symbol('Fragment') }
    throw new Error(`Unknown require: ${id}`)
  }

  const mod = { exports: {} }
  const fn = new Function('module', 'exports', 'require', code)
  fn(mod, mod.exports, fakeRequire)
  return mod.exports.default || mod.exports
}

const CargoLaptop = loadComponent('./components/CargoLaptop.tsx')
const CargoDevolucionLaptop = loadComponent('./components/CargoDevolucionLaptop.tsx')

function wrapHtml(body) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>html,body{height:100%;margin:0;padding:0}@page{size:A4;margin:0}${tailwindCss}</style>
</head>
<body>${body}</body>
</html>`
}

export function renderCargoLaptopHtml(data) {
  const bodyHtml = renderToStaticMarkup(createElement(CargoLaptop, { ...data, logoSrc: data.logoSrc || logoBase64 }))
  return wrapHtml(bodyHtml)
}

export function renderCargoDevolucionHtml(data) {
  const bodyHtml = renderToStaticMarkup(createElement(CargoDevolucionLaptop, {
    ...data,
    logoSrc: data.logoSrc || logoBase64,
    firmaResponsableSrc: data.firmaResponsableSrc || firmaResponsableBase64,
  }))
  return wrapHtml(bodyHtml)
}
