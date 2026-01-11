import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Message, ContentBlock, ChatSession } from '../types'

interface ChatState {
  sessionId: string
  messages: Message[]
  systemPrompt: string
  isStreaming: boolean
  currentStreamContent: string
  streamingBlocks: ContentBlock[]
  streamingMessageId: string | null
  claudeSessionId: string | null
  claudeAvailable: boolean
  inputValue: string
  error: string | null
  sessions: ChatSession[]
  currentTitle: string
  isGeneratingTitle: boolean
}

interface ChatActions {
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, content: string, blocks?: ContentBlock[]) => void
  startStreaming: (messageId: string) => void
  appendStream: (content: string) => void
  appendBlock: (block: ContentBlock) => void
  stopStreaming: () => void
  setClaudeSessionId: (sessionId: string) => void
  setInputValue: (value: string) => void
  setError: (error: string | null) => void
  setClaudeAvailable: (available: boolean) => void
  checkClaudeAvailability: () => Promise<void>
  sendMessage: (content: string) => Promise<void>
  abortMessage: () => Promise<void>
  clearChat: () => void
  loadSessions: () => Promise<void>
  saveCurrentSession: () => Promise<void>
  loadSession: (session: ChatSession) => void
  deleteSession: (sessionId: string) => Promise<void>
  setSystemPrompt: (prompt: string) => void
  generateTitle: (message: string) => Promise<void>
}

type ChatStore = ChatState & ChatActions

const createNewSessionId = (): string => uuidv4()

const initialState: ChatState = {
  sessionId: createNewSessionId(),
  messages: [],
  systemPrompt: '',
  isStreaming: false,
  currentStreamContent: '',
  streamingBlocks: [],
  streamingMessageId: null,
  claudeSessionId: null,
  claudeAvailable: true,
  inputValue: '',
  error: null,
  sessions: [],
  currentTitle: '새 대화',
  isGeneratingTitle: false,
}

export const useChatStore = create<ChatStore>((set, get) => ({
  ...initialState,

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }))
  },

  updateMessage: (messageId, content, blocks) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, content, blocks, isStreaming: false } : m
      ),
    }))
  },

  startStreaming: (messageId) => {
    set({
      isStreaming: true,
      streamingMessageId: messageId,
      currentStreamContent: '',
      streamingBlocks: [],
    })
  },

  appendStream: (content) => {
    set((state) => ({
      currentStreamContent: state.currentStreamContent + content,
    }))
  },

  appendBlock: (newBlock) => {
    set((state) => {
      const lastBlock = state.streamingBlocks[state.streamingBlocks.length - 1]

      if (lastBlock && lastBlock.type === newBlock.type) {
        if (lastBlock.type === 'thinking' && newBlock.type === 'thinking') {
          const updatedBlocks = [...state.streamingBlocks]
          updatedBlocks[updatedBlocks.length - 1] = {
            ...lastBlock,
            content: lastBlock.content + newBlock.content,
          }
          return { streamingBlocks: updatedBlocks }
        }
        if (lastBlock.type === 'text' && newBlock.type === 'text') {
          const updatedBlocks = [...state.streamingBlocks]
          updatedBlocks[updatedBlocks.length - 1] = {
            ...lastBlock,
            content: lastBlock.content + newBlock.content,
          }
          return { streamingBlocks: updatedBlocks }
        }
        if (lastBlock.type === 'tool_use' && newBlock.type === 'tool_use') {
          const updatedBlocks = [...state.streamingBlocks]
          updatedBlocks[updatedBlocks.length - 1] = {
            ...lastBlock,
            input: lastBlock.input + (newBlock.input ?? ''),
          }
          return { streamingBlocks: updatedBlocks }
        }
      }

      return { streamingBlocks: [...state.streamingBlocks, newBlock] }
    })
  },

  stopStreaming: () => {
    set({
      isStreaming: false,
      streamingMessageId: null,
      currentStreamContent: '',
      streamingBlocks: [],
    })
    get().saveCurrentSession()
  },

  setClaudeSessionId: (sessionId) => {
    set({ claudeSessionId: sessionId })
  },

  setInputValue: (value) => {
    set({ inputValue: value })
  },

  setError: (error) => {
    set({ error })
  },

  setClaudeAvailable: (available) => {
    set({ claudeAvailable: available })
  },

  checkClaudeAvailability: async () => {
    try {
      const availability = await window.api.claude.checkAvailability()
      set({ claudeAvailable: availability.available })
      if (!availability.available && availability.error) {
        set({ error: availability.error.message })
      }
      const systemPrompt = await window.api.config.get<string>('systemPrompt')
      if (systemPrompt) {
        set({ systemPrompt })
      }
      await get().loadSessions()
    } catch (error) {
      console.error('[ChatStore] Failed to check Claude availability:', error)
      set({ claudeAvailable: false })
    }
  },

  sendMessage: async (content) => {
    const state = get()

    if (!state.claudeAvailable) {
      set({ error: 'Claude CLI가 사용 불가능합니다. Claude Code를 설치해주세요.' })
      return
    }

    if (state.isStreaming) {
      return
    }

    const isFirstMessage = state.messages.length === 0

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    get().addMessage(userMessage)

    if (isFirstMessage) {
      get().generateTitle(content)
    }

    const assistantMessageId = uuidv4()
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    }
    get().addMessage(assistantMessage)

    get().startStreaming(assistantMessageId)
    set({ inputValue: '' })

    try {
      await window.api.claude.execute(content, {
        maxThinkingTokens: 32000,
        systemPrompt: state.systemPrompt || undefined,
      })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : String(error) })
      get().stopStreaming()
    }
  },

  abortMessage: async () => {
    const state = get()
    await window.api.claude.abort()

    if (state.streamingMessageId) {
      get().updateMessage(state.streamingMessageId, '[중단됨]', [
        { type: 'text', content: '[중단됨]' },
      ])
    }
    get().stopStreaming()
  },

  clearChat: () => {
    window.api.claude.resetSession()
    set({
      sessionId: createNewSessionId(),
      messages: [],
      currentStreamContent: '',
      streamingBlocks: [],
      streamingMessageId: null,
      error: null,
      currentTitle: '새 대화',
      isGeneratingTitle: false,
    })
  },

  loadSessions: async () => {
    const sessions = await window.api.sessions.list()
    set({ sessions })
  },

  saveCurrentSession: async () => {
    const state = get()
    if (state.messages.length === 0) return

    const existingSession = state.sessions.find((s) => s.id === state.sessionId)
    const title = existingSession?.title || state.currentTitle

    const session: ChatSession = {
      id: state.sessionId,
      title,
      messages: state.messages.filter((m) => !m.isStreaming),
      systemPrompt: state.systemPrompt,
      createdAt: state.messages[0]?.timestamp || Date.now(),
      updatedAt: Date.now(),
    }

    await window.api.sessions.save(session)
    await get().loadSessions()
  },

  loadSession: (session) => {
    const state = get()
    if (state.isStreaming) {
      get().abortMessage()
    }
    window.api.claude.resetSession()
    set({
      sessionId: session.id,
      messages: session.messages,
      systemPrompt: session.systemPrompt || '',
      currentStreamContent: '',
      streamingBlocks: [],
      streamingMessageId: null,
      isStreaming: false,
      error: null,
      currentTitle: session.title,
      isGeneratingTitle: false,
    })
  },

  deleteSession: async (sessionId) => {
    await window.api.sessions.delete(sessionId)
    await get().loadSessions()
  },

  setSystemPrompt: (prompt) => {
    set({ systemPrompt: prompt })
    window.api.config.set('systemPrompt', prompt)
  },

  generateTitle: async (message) => {
    set({ isGeneratingTitle: true })
    try {
      const result = await window.api.title.generate(message)
      if (result.success) {
        set({ currentTitle: result.title, isGeneratingTitle: false })
      } else {
        set({ currentTitle: message.slice(0, 20), isGeneratingTitle: false })
      }
    } catch {
      set({ currentTitle: message.slice(0, 20), isGeneratingTitle: false })
    }
  },
}))
