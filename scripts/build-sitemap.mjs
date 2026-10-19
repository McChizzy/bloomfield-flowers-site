// Regenerates public/sitemap.xml: home, app pages, every product page and the static landing pages.
// Run after adding products or landing pages:  node scripts/build-sitemap.mjs
import { readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { products } from '../src/catalog.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SITE = 'https://bloomfieldflowers.ng'
const today = new Date().toISOString().slice(0, 10)

const appPages = [
  ['/', 'weekly', '1.0'],
  ['/shop', 'weekly', '0.9'],
  ['/custom-orders', 'monthly', '0.7'],
  ['/delivery', 'monthly', '0.6'],
  ['/about', 'monthly', '0.5'],
  ['/flower-care', 'monthly', '0.5'],
  ['/contact', 'monthly', '0.5'],
]
const landing = readdirSync(join(root, 'public'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => [`/${f.replace(/\.html$/, '')}`, 'monthly', f.startsWith('flower-delivery') ? '0.9' : '0.8'])
const productPages = products.map((p) => [`/product/${p.id}`, 'monthly', '0.7'])

const urls = [...appPages, ...landing, ...productPages]
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([path, freq, pri]) => `  <url>
    <loc>${SITE}${path === '/' ? '/' : path}</loc>
    <changefreq>${freq}</changefreq>
    <priority>${pri}</priority>
    <lastmod>${today}</lastmod>
  </url>`).join('\n')}
</urlset>
`
writeFileSync(join(root, 'public', 'sitemap.xml'), xml)
console.log(`sitemap.xml: ${urls.length} URLs (${appPages.length} app, ${landing.length} landing, ${productPages.length} products)`)
