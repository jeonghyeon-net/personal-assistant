import { execSync } from 'child_process'
import { appendFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const logFile = join(homedir(), 'pa-debug.log')
const log = (msg: string) => {
  const timestamp = new Date().toISOString()
  appendFileSync(logFile, `[${timestamp}] ${msg}\n`)
}

process.stdout.on('error', () => {})
process.stderr.on('error', () => {})

log('[fixPath] Starting, platform: ' + process.platform)
log('[fixPath] Initial PATH: ' + process.env.PATH)

function extractPath(output: string): string | null {
  const lines = output.trim().split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (line) {
      const trimmed = line.trim()
      if (trimmed.includes('/') && !trimmed.includes(' ')) {
        return trimmed
      }
    }
  }
  return null
}


if (process.platform === 'darwin') {
  try {
    const output = execSync('/bin/zsh -lc "echo $PATH"', {
      encoding: 'utf8',
      timeout: 5000,
    })
    const shellPath = extractPath(output)
    if (shellPath) {
      process.env.PATH = shellPath
      log('[fixPath] Set PATH from zsh: ' + shellPath)
    }
  } catch (zshError) {
    log('[fixPath] zsh failed: ' + (zshError instanceof Error ? zshError.message : String(zshError)))
    try {
      const output = execSync('/bin/bash -lc "echo $PATH"', {
        encoding: 'utf8',
        timeout: 5000,
      })
      const bashPath = extractPath(output)
      if (bashPath) {
        process.env.PATH = bashPath
        log('[fixPath] Set PATH from bash: ' + bashPath)
      }
    } catch (bashError) {
      log('[fixPath] bash also failed: ' + (bashError instanceof Error ? bashError.message : String(bashError)))
    }
  }
}

log('[fixPath] Final PATH: ' + process.env.PATH)
