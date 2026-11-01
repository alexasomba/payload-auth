import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist/', import.meta.url))

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const absolutePath = path.join(directory, entry.name)
      return entry.isDirectory() ? walk(absolutePath) : [absolutePath]
    }),
  )
  return files.flat()
}

async function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith('./') && !specifier.startsWith('../')) return specifier
  if (path.extname(specifier)) return specifier

  const target = path.resolve(path.dirname(fromFile), specifier)
  for (const candidate of [`${target}.js`, `${target}.mjs`, `${target}.cjs`]) {
    try {
      if ((await stat(candidate)).isFile()) return `${specifier}.js`
    } catch {
      // Try the directory index after checking file extensions.
    }
  }

  try {
    if ((await stat(target)).isDirectory()) {
      const index = path.join(target, 'index.js')
      if ((await stat(index)).isFile()) return `${specifier.replace(/\/$/, '')}/index.js`
    }
  } catch {
    // The build should fail rather than publish an ESM import that Node cannot resolve.
  }

  throw new Error(`Could not resolve relative ESM import "${specifier}" from ${fromFile}`)
}

const files = (await walk(dist)).filter((file) => file.endsWith('.js'))
for (const file of files) {
  const source = await readFile(file, 'utf8')
  const pattern = /((?:from\s*|import\s*(?:\(\s*)?)['"])(\.{1,2}\/[^'"]+)(['"])/g
  const matches = [...source.matchAll(pattern)]
  if (matches.length === 0) continue

  let output = source
  for (const match of matches) {
    const specifier = match[2]
    const resolved = await resolveImport(file, specifier)
    if (resolved !== specifier)
      output = output.replace(match[0], `${match[1]}${resolved}${match[3]}`)
  }

  if (output !== source) await writeFile(file, output)
}
