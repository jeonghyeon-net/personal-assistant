import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface StreamData {
  type: 'stdout' | 'stderr' | 'end' | 'error' | 'thinking' | 'thinking_start' | 'content_block_stop' | 'tool_use' | 'tool_result' | 'compact_start' | 'compact_end' | 'rate_limit' | 'usage'
  sessionId?: string
  content?: string
  toolName?: string
  input?: string
  exitCode?: number
  resetTime?: string
  usage?: ContextUsage
}

export interface ContextUsage {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  contextWindowSize: number
}

export interface ClaudeAvailability {
  available: boolean
  path?: string
  error?: {
    code: string
    message: string
    details?: string
  }
}

export interface ExecuteOptions {
  maxThinkingTokens?: number
  systemPrompt?: string
}

const api = {
  claude: {
    checkAvailability: (): Promise<ClaudeAvailability> =>
      ipcRenderer.invoke('claude:check-availability'),

    execute: (prompt: string, options?: ExecuteOptions): Promise<string | null> =>
      ipcRenderer.invoke('claude:execute', prompt, options),

    onStream: (callback: (data: StreamData) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, data: StreamData): void => {
        callback(data)
      }
      ipcRenderer.on('claude:stream', handler)
      return () => {
        ipcRenderer.removeListener('claude:stream', handler)
      }
    },

    abort: (): Promise<boolean> =>
      ipcRenderer.invoke('claude:abort'),

    resetSession: (): Promise<void> =>
      ipcRenderer.invoke('claude:reset-session'),
  },

  window: {
    hide: (): Promise<void> => ipcRenderer.invoke('window:hide'),
    quit: (): Promise<void> => ipcRenderer.invoke('app:quit'),
    onFocus: (callback: () => void): (() => void) => {
      const handler = (): void => callback()
      ipcRenderer.on('window:focus', handler)
      return () => ipcRenderer.removeListener('window:focus', handler)
    },
  },

  shell: {
    openExternal: (url: string): Promise<void> =>
      ipcRenderer.invoke('shell:open-external', url),
  },

  config: {
    get: <T = unknown>(key: string): Promise<T> =>
      ipcRenderer.invoke('config:get', key),

    set: (key: string, value: unknown): Promise<void> =>
      ipcRenderer.invoke('config:set', key, value),

    setShortcut: (shortcut: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('config:set-shortcut', shortcut),

    setOpenAtLogin: (enabled: boolean): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('config:set-open-at-login', enabled),
  },

  sessions: {
    list: () => ipcRenderer.invoke('sessions:list'),
    save: (session: unknown) => ipcRenderer.invoke('sessions:save', session),
    delete: (sessionId: string) => ipcRenderer.invoke('sessions:delete', sessionId),
  },

  title: {
    generate: (message: string): Promise<{ success: boolean; title: string }> =>
      ipcRenderer.invoke('title:generate', message),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type API = typeof api
