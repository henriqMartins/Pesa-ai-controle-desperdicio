// Gera os ícones PNG do PWA a partir dos SVGs da marca em `public/`.
//
// Os PNGs ficam versionados em `public/`, então este script só precisa rodar
// quando o ícone mudar. Requer o `sharp` (não é dependência fixa do projeto):
//
//   npm i -D sharp
//   node scripts/gerar-icones.mjs
//   npm uninstall sharp
//
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const pub = new URL('../public/', import.meta.url)
const icon = readFileSync(new URL('icon.svg', pub))
const maskable = readFileSync(new URL('icon-maskable.svg', pub))

const jobs = [
  [icon, 192, 'pwa-192.png'],
  [icon, 512, 'pwa-512.png'],
  [maskable, 512, 'pwa-maskable-512.png'],
  // apple-touch-icon: o iOS aplica os próprios cantos; 180x180 é a referência.
  [icon, 180, 'apple-touch-icon.png'],
]

for (const [buf, size, name] of jobs) {
  const out = fileURLToPath(new URL(name, pub))
  await sharp(buf, { density: 384 }).resize(size, size).png().toFile(out)
  console.log('gerado:', name, `(${size}x${size})`)
}
