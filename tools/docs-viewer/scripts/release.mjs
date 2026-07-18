import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const distDir = path.join(packageRoot, 'dist')
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'))
const artifactBase = `${manifest.name.replace(/^@/, '').replace(/[\\/]/g, '-')}-${manifest.version}`

function fail(message) {
  throw new Error(`[docs-view release] ${message}`)
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || packageRoot,
    stdio: options.stdio || 'inherit',
    encoding: options.encoding,
  })
  if (result.error) fail(result.error.message)
  if (result.status !== 0) fail(`${command} ${args.join(' ')} exited with status ${result.status}`)
  return result
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function copyReleaseFiles(stageRoot) {
  for (const entry of [
    'README.md',
    'package.json',
    'package-lock.json',
    'launch.cmd',
    'launch.ps1',
    'launch.sh',
    'bin',
    'scripts',
    'src',
    'theme',
  ]) {
    const src = path.join(packageRoot, entry)
    const dst = path.join(stageRoot, entry)
    if (!existsSync(src)) fail(`missing release input: ${entry}`)
    cpSync(src, dst, { recursive: true })
  }
}

function manifestEntries(root, dir = root) {
  const entries = []
  for (const name of readdirSync(dir)) {
    if (name === 'MANIFEST.txt') continue
    const full = path.join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      entries.push(...manifestEntries(root, full))
    } else if (stat.isFile()) {
      entries.push(path.relative(root, full).split(path.sep).join('/'))
    }
  }
  return entries
}

function writeManifest(root) {
  const entries = manifestEntries(root)
  entries.push('MANIFEST.txt')
  entries.sort()
  writeFileSync(path.join(root, 'MANIFEST.txt'), `${entries.join('\n')}\n`, 'utf8')
}

function validatePackedFiles() {
  const packed = run(npmCmd, ['pack', '--dry-run', '--json'], {
    stdio: 'pipe',
    encoding: 'utf8',
  })

  let packInfo
  try {
    packInfo = JSON.parse(packed.stdout)[0]
  } catch (err) {
    fail(`could not parse npm pack dry-run output: ${err.message}`)
  }

  if (!packInfo?.filename || !Array.isArray(packInfo.files)) {
    fail('npm pack dry-run output did not include filename/files metadata')
  }

  const required = [
    'README.md',
    'package.json',
    'launch.cmd',
    'launch.ps1',
    'launch.sh',
    'bin/docs-view.js',
    'scripts/launch.mjs',
    'src/cli.js',
    'src/runtime.js',
    'theme/index.js',
    'theme/components/CsvViewer.vue',
    'theme/components/DrawioViewer.vue',
    'theme/components/FileDownload.vue',
    'theme/components/ImageView.vue',
    'theme/components/PdfViewer.vue',
    'theme/style.css',
  ]
  const packedFiles = new Set(packInfo.files.map((f) => f.path))
  const missing = required.filter((file) => !packedFiles.has(file))
  if (missing.length > 0) fail(`package manifest is missing required files: ${missing.join(', ')}`)
}

function writeFixture(projectRoot) {
  const docsDir = path.join(projectRoot, 'docs')
  mkdirSync(docsDir, { recursive: true })
  writeFileSync(path.join(projectRoot, '.gitignore'), '', 'utf8')
  writeFileSync(path.join(docsDir, 'index.md'), '# Zip Install Smoke\n', 'utf8')
  writeFileSync(path.join(docsDir, 'data.csv'), 'a,b\n1,2\n', 'utf8')
}

function verifyZipInstall(zipFile) {
  const verifyRoot = mkdtempSync(path.join(os.tmpdir(), 'docs-viewer-zip-verify-'))
  const consumerRoot = path.join(verifyRoot, 'consumer')
  mkdirSync(consumerRoot, { recursive: true })

  try {
    run('unzip', ['-q', zipFile, '-d', verifyRoot])
    const extractedRoot = path.join(verifyRoot, artifactBase)
    if (!existsSync(path.join(extractedRoot, 'package.json'))) {
      fail(`zip did not extract expected package root: ${extractedRoot}`)
    }
    const manifestPath = path.join(extractedRoot, 'MANIFEST.txt')
    if (!existsSync(manifestPath)) fail('zip did not include MANIFEST.txt')
    const manifestText = readFileSync(manifestPath, 'utf8')
    for (const rel of ['MANIFEST.txt', 'README.md', 'launch.ps1', 'launch.cmd', 'package.json', 'scripts/launch.mjs', 'src/runtime.js']) {
      if (!manifestText.split(/\r?\n/).includes(rel)) {
        fail(`zip manifest missing ${rel}`)
      }
    }

    writeFixture(consumerRoot)
    if (process.platform === 'win32') {
      run('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(extractedRoot, 'launch.ps1'), 'build'], {
        cwd: consumerRoot,
      })
    } else {
      run(process.execPath, [path.join(extractedRoot, 'scripts', 'launch.mjs'), 'build'], {
        cwd: consumerRoot,
      })
    }

    for (const rel of ['docs-dist/index.html', 'docs-dist/data.csv', 'docs-dist/data.csv.view.html']) {
      if (!existsSync(path.join(consumerRoot, rel))) fail(`zip install smoke missing ${rel}`)
    }
    for (const rel of [
      '.tools/docs-viewer-install/package.json',
      '.tools/docs-viewer-install/package-lock.json',
      '.tools/docs-viewer-install/node_modules',
    ]) {
      if (!existsSync(path.join(consumerRoot, rel))) fail(`zip launcher smoke missing ${rel}`)
    }
    if (existsSync(path.join(consumerRoot, 'node_modules'))) {
      fail('zip launcher smoke created project-root node_modules')
    }
  } finally {
    rmSync(verifyRoot, { recursive: true, force: true })
  }
}

console.log('[docs-view release] running smoke test')
run(npmCmd, ['run', 'smoke'])

rmSync(distDir, { recursive: true, force: true })
mkdirSync(distDir, { recursive: true })

console.log('[docs-view release] validating npm package file list')
validatePackedFiles()

const stageParent = mkdtempSync(path.join(os.tmpdir(), 'docs-viewer-release-'))
const stageRoot = path.join(stageParent, artifactBase)

try {
  console.log('[docs-view release] staging zip package')
  mkdirSync(stageRoot, { recursive: true })
  copyReleaseFiles(stageRoot)
  writeManifest(stageRoot)

  const zipFile = path.join(distDir, `${artifactBase}.zip`)
  console.log('[docs-view release] writing zip package')
  run('zip', ['-qr', zipFile, artifactBase], { cwd: stageParent })

  if (!existsSync(zipFile)) fail(`zip was not written: ${zipFile}`)

  const checksum = `${sha256(zipFile)}  ${path.basename(zipFile)}\n`
  const checksumFile = `${zipFile}.sha256`
  writeFileSync(checksumFile, checksum, 'utf8')

  console.log('[docs-view release] verifying zip install')
  verifyZipInstall(zipFile)

  console.log(`[docs-view release] wrote ${zipFile}`)
  console.log(`[docs-view release] wrote ${checksumFile}`)
} finally {
  rmSync(stageParent, { recursive: true, force: true })
}
