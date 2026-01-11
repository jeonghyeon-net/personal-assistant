import { execSync } from 'child_process'

process.stdout.on('error', () => {})
process.stderr.on('error', () => {})

if (process.platform === 'darwin') {
  try {
    const shellPath = execSync('/bin/zsh -ilc "echo $PATH"', { encoding: 'utf8' }).trim()
    if (shellPath) {
      process.env.PATH = shellPath
    }
  } catch {
    try {
      const bashPath = execSync('/bin/bash -ilc "echo $PATH"', { encoding: 'utf8' }).trim()
      if (bashPath) {
        process.env.PATH = bashPath
      }
    } catch {
      // ignore
    }
  }
}
