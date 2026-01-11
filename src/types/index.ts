export interface ThinkingBlock {
  type: 'thinking'
  content: string
}

export interface TextBlock {
  type: 'text'
  content: string
}

export interface ToolUseBlock {
  type: 'tool_use'
  toolName: string
  input: string
}

export interface ToolResultBlock {
  type: 'tool_result'
  toolName: string
  content: string
}

export type ContentBlock = ThinkingBlock | TextBlock | ToolUseBlock | ToolResultBlock

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  blocks?: ContentBlock[]
  timestamp: number
  isStreaming?: boolean
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  systemPrompt?: string
  createdAt: number
  updatedAt: number
}

export interface ContextUsage {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  contextWindowSize: number
}

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
}

export interface API {
  claude: {
    checkAvailability: () => Promise<ClaudeAvailability>
    execute: (prompt: string, options?: ExecuteOptions) => Promise<string | null>
    onStream: (callback: (data: StreamData) => void) => () => void
    abort: () => Promise<boolean>
  }
  window: {
    hide: () => Promise<void>
    quit: () => Promise<void>
  }
  config: {
    get: <T = unknown>(key: string) => Promise<T>
    set: (key: string, value: unknown) => Promise<void>
    setShortcut: (shortcut: string) => Promise<{ success: boolean; error?: string }>
  }
  sessions: {
    list: () => Promise<ChatSession[]>
    save: (session: ChatSession) => Promise<void>
    delete: (sessionId: string) => Promise<void>
  }
  title: {
    generate: (message: string) => Promise<{ success: boolean; title: string }>
  }
}

declare global {
  interface Window {
    api: API
  }
}
