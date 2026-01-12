import './fixPath'
import {
  app,
  BrowserWindow,
  Tray,
  ipcMain,
  nativeImage,
  globalShortcut,
} from 'electron'
import { join } from 'path'
import { homedir } from 'os'
import Store from 'electron-store'
import { claudeService } from './services/ClaudeService'
import { DEFAULT_SYSTEM_PROMPT } from './systemPrompt'

interface ChatSession {
  id: string
  title: string
  messages: unknown[]
  systemPrompt?: string
  createdAt: number
  updatedAt: number
}

interface StoreSchema {
  ultrathinkEnabled: boolean
  globalShortcut: string
  systemPrompt: string
  sessions: ChatSession[]
  openAtLogin: boolean
}

const store = new Store<StoreSchema>({
  defaults: {
    ultrathinkEnabled: true,
    globalShortcut: 'Alt+Space',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    sessions: [],
    openAtLogin: false,
  },
})

function registerGlobalShortcut(shortcut: string): boolean {
  globalShortcut.unregisterAll()
  try {
    const success = globalShortcut.register(shortcut, () => {
      if (mainWindow?.isVisible()) {
        mainWindow.hide()
      } else {
        showWindow()
      }
    })
    return success
  } catch {
    return false
  }
}

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const DIST = join(__dirname, '../dist')
const ELECTRON_DIST = __dirname

function getWorkDir(): string {
  return homedir()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 420,
    minWidth: 380,
    maxWidth: 380,
    minHeight: 300,
    maxHeight: 800,
    show: false,
    resizable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    closable: false,
    title: 'Assistant',
    frame: false,
    transparent: true,
    vibrancy: 'popover',
    visualEffectState: 'active',
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: join(ELECTRON_DIST, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(DIST, 'index.html'))
  }

  mainWindow.on('close', (event) => {
    event.preventDefault()
    mainWindow?.hide()
  })

  mainWindow.on('blur', () => {
    mainWindow?.hide()
  })
}

function createTray(): void {
  const iconPath = app.isPackaged
    ? join(process.resourcesPath, 'trayTemplate.png')
    : join(__dirname, '../resources/trayTemplate.png')
  const icon = nativeImage.createFromPath(iconPath)
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('Personal Assistant')

  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      showWindow()
    }
  })
}

function showWindow(): void {
  if (!mainWindow) return

  const trayBounds = tray?.getBounds()
  if (trayBounds) {
    const windowBounds = mainWindow.getBounds()
    const x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
    const y = Math.round(trayBounds.y + trayBounds.height)
    mainWindow.setPosition(x, y)
  }

  mainWindow.show()
  mainWindow.focus()
  mainWindow.webContents.focus()
  mainWindow.webContents.send('window:focus')
}

ipcMain.handle('claude:check-availability', () => {
  return claudeService.checkAvailability()
})

ipcMain.handle('claude:execute', async (_event, prompt: string, options?: {
  maxThinkingTokens?: number
  systemPrompt?: string
}) => {
  if (!mainWindow) return null
  const workDir = getWorkDir()
  return claudeService.execute(workDir, prompt, mainWindow, options)
})

ipcMain.handle('claude:abort', async () => {
  return claudeService.abort()
})

ipcMain.handle('claude:reset-session', () => {
  claudeService.resetSession()
})

ipcMain.handle('window:hide', () => {
  mainWindow?.hide()
})

ipcMain.handle('app:quit', () => {
  mainWindow?.destroy()
  app.quit()
})

ipcMain.handle('config:get', (_event, key: string) => {
  if (key === 'defaultSystemPrompt') {
    return DEFAULT_SYSTEM_PROMPT
  }
  return store.get(key)
})

ipcMain.handle('config:set', (_event, key: string, value: unknown) => {
  store.set(key, value)
})

ipcMain.handle('config:set-shortcut', (_event, shortcut: string) => {
  const success = registerGlobalShortcut(shortcut)
  if (success) {
    store.set('globalShortcut', shortcut)
    return { success: true }
  }
  return { success: false, error: '단축키 등록 실패' }
})

ipcMain.handle('config:set-open-at-login', (_event, enabled: boolean) => {
  app.setLoginItemSettings({
    openAtLogin: enabled,
    openAsHidden: true,
  })
  store.set('openAtLogin', enabled)
  return { success: true }
})

ipcMain.handle('sessions:list', () => {
  return store.get('sessions')
})

ipcMain.handle('sessions:save', (_event, session: ChatSession) => {
  const sessions = store.get('sessions')
  const index = sessions.findIndex((s) => s.id === session.id)
  if (index >= 0) {
    sessions[index] = session
  } else {
    sessions.unshift(session)
  }
  store.set('sessions', sessions.slice(0, 50))
})

ipcMain.handle('sessions:delete', (_event, sessionId: string) => {
  const sessions = store.get('sessions')
  store.set('sessions', sessions.filter((s) => s.id !== sessionId))
})

ipcMain.handle('title:generate', async (_event, message: string) => {
  console.log('[TitleGeneration] Starting for message:', message.slice(0, 20))
  return claudeService.generateTitle(message)
})

app.whenReady().then(() => {
  createTray()
  createWindow()
  showWindow()

  const savedShortcut = store.get('globalShortcut')
  registerGlobalShortcut(savedShortcut)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', async () => {
  globalShortcut.unregisterAll()
  await claudeService.cleanup()
})

app.on('activate', () => {
  if (!mainWindow) {
    createWindow()
  }
  showWindow()
})
