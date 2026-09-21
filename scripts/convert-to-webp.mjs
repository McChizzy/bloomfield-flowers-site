/**
 * convert-to-webp.mjs
 *
 * Converts all JPEG / PNG / HEIC images in a folder to WebP.
 * Originals are kept untouched. Already-converted files are skipped.
 *
 * Usage:
 *   node scripts/convert-to-webp.mjs [options]
 *
 * Options:
 *   --dir <path>      Folder to scan (default: images/)
 *   --quality <n>     WebP quality 1-100 (default: 82)
 *   --max-width <n>   Resize down to this width if wider (default: 1800)
 *   --dry-run         Print what would happen, convert nothing
 *   --force           Re-convert even if a .webp already exists
 *
 * Install Sharp first (one-time):
 *   npm install --save-dev sharp
 */

import { createRequire } from 'module'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
let sharp
try {
  sharp = require('sharp')
} catch {
  console.error('\n  sharp is not installed. Run:\n\n    npm install --save-dev sharp\n\n  then re-run this script.\n')
  process.exit(1)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.heic', '.heif', '.tiff', '.tif'])

function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : null
  }
  return {
    dir: path.resolve(ROOT, get('--dir') ?? 'images'),
    quality: Number(get('--quality') ?? 82),
    maxWidth: Number(get('--max-width') ?? 1800),
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  }
}

async function collectImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      files.push(...await collectImages(full))
    } else if (SUPPORTED.has(path.extname(e.name).toLowerCase())) {
      files.push(full)
    }
  }
  return files
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

async function convert(src, opts) {
  const dest = src.replace(/\.[^.]+$/, '.webp')

  if (!opts.force) {
    try {
      await fs.access(dest)
      console.log(`  skip  ${path.relative(ROOT, src)}  (webp exists)`)
      return { skipped: true }
    } catch { /* doesn't exist yet — proceed */ }
  }

  if (opts.dryRun) {
    console.log(`  would convert  ${path.relative(ROOT, src)}  →  ${path.basename(dest)}`)
    return { dryRun: true }
  }

  const srcStat = await fs.stat(src)
  const pipeline = sharp(src, { failOnError: false })
    .rotate() // auto-orient from EXIF
    .resize({ width: opts.maxWidth, withoutEnlargement: true })
    .webp({ quality: opts.quality, effort: 4 })

  const buf = await pipeline.toBuffer()
  await fs.writeFile(dest, buf)

  const saving = srcStat.size - buf.length
  const pct = ((saving / srcStat.size) * 100).toFixed(0)
  const sign = saving >= 0 ? '-' : '+'

  console.log(
    `  ✓  ${path.relative(ROOT, src).padEnd(55)} ${fmtBytes(srcStat.size).padStart(9)} → ${fmtBytes(buf.length).padStart(9)}  (${sign}${Math.abs(pct)}%)`
  )

  return { srcSize: srcStat.size, destSize: buf.length }
}

async function main() {
  const opts = parseArgs()

  console.log(`\nBloomfield WebP converter`)
  console.log(`  dir:       ${opts.dir}`)
  console.log(`  quality:   ${opts.quality}`)
  console.log(`  max-width: ${opts.maxWidth}px`)
  if (opts.dryRun) console.log(`  mode:      DRY RUN — nothing will be written`)
  if (opts.force)  console.log(`  mode:      FORCE — re-converting existing WebPs`)
  console.log()

  let images
  try {
    images = await collectImages(opts.dir)
  } catch {
    console.error(`  Error: could not read folder "${opts.dir}"`)
    process.exit(1)
  }

  if (!images.length) {
    console.log('  No images found.')
    return
  }

  console.log(`  Found ${images.length} image(s) to process\n`)

  let totalSrc = 0, totalDest = 0, converted = 0, skipped = 0, errors = 0

  for (const img of images) {
    try {
      const result = await convert(img, opts)
      if (result.skipped) { skipped++ }
      else if (result.dryRun) { converted++ }
      else {
        totalSrc  += result.srcSize
        totalDest += result.destSize
        converted++
      }
    } catch (err) {
      console.error(`  ✗  ${path.relative(ROOT, img)}: ${err.message}`)
      errors++
    }
  }

  console.log()
  if (!opts.dryRun && converted > 0) {
    const saved = totalSrc - totalDest
    const pct = totalSrc > 0 ? ((saved / totalSrc) * 100).toFixed(1) : 0
    console.log(`  Converted: ${converted}   Skipped: ${skipped}   Errors: ${errors}`)
    console.log(`  Total saved: ${fmtBytes(saved)} (${pct}% smaller across converted files)`)
    console.log()
    console.log(`  Originals are untouched. Update image references in catalog.js`)
    console.log(`  and main.js to use .webp extensions when you're ready.`)
  } else if (opts.dryRun) {
    console.log(`  Dry run complete — ${converted} file(s) would be converted, ${skipped} skipped.`)
  }
  console.log()
}

main()
