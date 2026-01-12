import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

process.stdout.on('error', () => {})
process.stderr.on('error', () => {})

function fixMacPath(): void {
  if (process.platform !== 'darwin') return

  const currentPath = process.env.PATH || ''
  const paths = new Set(currentPath.split(':').filter(Boolean))

  try {
    const etcPaths = readFileSync('/etc/paths', 'utf8')
    etcPaths.split('\n').filter(Boolean).forEach((p) => paths.add(p))
  } catch {
    ['/usr/local/bin', '/usr/bin', '/bin', '/usr/sbin', '/sbin'].forEach((p) => paths.add(p))
  }

  try {
    const pathsD = '/etc/paths.d'
    if (existsSync(pathsD)) {
      for (const file of readdirSync(pathsD)) {
        try {
          const content = readFileSync(join(pathsD, file), 'utf8')
          content.split('\n').filter(Boolean).forEach((p) => paths.add(p))
        } catch {
          continue
        }
      }
    }
  } catch {
    // ignore
  }

  const home = homedir()
  const commonPaths = [
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    '/usr/local/bin',
    join(home, '.local/bin'),
    join(home, '.cargo/bin'),
    join(home, 'go/bin'),
    join(home, '.npm-global/bin'),
    join(home, '.nvm/versions/node'),
    join(home, '.fnm/node-versions'),
    join(home, '.volta/bin'),
    join(home, '.asdf/shims'),
  ]

  for (const p of commonPaths) {
    if (existsSync(p)) {
      if (p.includes('.nvm/versions/node')) {
        try {
          const versions = readdirSync(p).filter((v) => v.startsWith('v'))
          for (const v of versions) {
            paths.add(join(p, v, 'bin'))
          }
        } catch {
          continue
        }
      } else if (p.includes('.fnm/node-versions')) {
        try {
          const versions = readdirSync(p).filter((v) => v.startsWith('v'))
          for (const v of versions) {
            paths.add(join(p, v, 'installation/bin'))
          }
        } catch {
          continue
        }
      } else {
        paths.add(p)
      }
    }
  }

  process.env.PATH = [...paths].join(':')
}

fixMacPath()
