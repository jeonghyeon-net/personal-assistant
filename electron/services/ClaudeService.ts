import { BrowserWindow, Notification } from 'electron'
import { execSync } from 'child_process'
import { existsSync, readdirSync, appendFileSync } from 'fs'
import { join, dirname } from 'path'
import { homedir, platform } from 'os'

const logFile = join(homedir(), 'pa-debug.log')
const log = (msg: string) => {
  const timestamp = new Date().toISOString()
  appendFileSync(logFile, `[${timestamp}] ${msg}\n`)
}

function addClaudePathToEnv(claudePath: string): void {
  const dir = dirname(claudePath)
  const currentPath = process.env.PATH || ''
  if (!currentPath.split(':').includes(dir)) {
    process.env.PATH = dir + ':' + currentPath
    log('[ClaudeService] Added to PATH: ' + dir)
  }
}
import { query } from '@anthropic-ai/claude-agent-sdk'
import type {
  Query,
  Options,
  SDKMessage,
  SDKSystemMessage,
  SDKResultMessage,
  SDKPartialAssistantMessage,
} from '@anthropic-ai/claude-agent-sdk'
import { DEFAULT_SYSTEM_PROMPT } from '../systemPrompt'

interface ClaudeError {
  code: string
  message: string
  details?: string
}

interface ClaudeAvailability {
  available: boolean
  path?: string
  error?: ClaudeError
}

interface ClaudePathResult {
  found: boolean
  path: string
  error?: ClaudeError
}

const DEFAULT_SYSTEM_PROMPT_PRESET = {
  type: 'preset' as const,
  preset: 'claude_code' as const,
}

function findClaudePath(): ClaudePathResult {
  const isWindows = platform() === 'win32'
  const isMac = platform() === 'darwin'
  const home = homedir()

  const scanDir = (baseDir: string, pattern: (name: string) => boolean, subPath: string): string[] => {
    if (!existsSync(baseDir)) return []
    try {
      return readdirSync(baseDir)
        .filter(pattern)
        .map((dir) => join(baseDir, dir, subPath))
    } catch {
      return []
    }
  }

  const getDynamicPaths = (): string[] => {
    const paths: string[] = []

    paths.push(...scanDir(join(home, '.nvm/versions/node'), (d) => d.startsWith('v'), 'bin/claude'))
    paths.push(...scanDir(join(home, 'Library/Application Support/fnm/node-versions'), (d) => d.startsWith('v'), 'installation/bin/claude'))
    paths.push(...scanDir(join(home, '.local/share/fnm/node-versions'), (d) => d.startsWith('v'), 'installation/bin/claude'))
    paths.push(...scanDir(join(home, '.fnm/node-versions'), (d) => d.startsWith('v'), 'installation/bin/claude'))
    paths.push(...scanDir('/opt/homebrew/Cellar/node', () => true, 'bin/claude'))
    paths.push(...scanDir('/usr/local/Cellar/node', () => true, 'bin/claude'))
    paths.push(...scanDir(join(home, '.volta/tools/image/node'), () => true, 'bin/claude'))
    paths.push(...scanDir(join(home, '.asdf/installs/nodejs'), () => true, 'bin/claude'))

    return paths
  }

  const staticPaths = isWindows
    ? [
        'C:\\Program Files\\Claude\\claude.exe',
        join(home, 'AppData\\Roaming\\npm\\claude.cmd'),
        join(home, 'AppData\\Roaming\\npm\\claude'),
        join(home, '.claude\\local\\claude.exe'),
      ]
    : [
        '/usr/local/bin/claude',
        '/opt/homebrew/bin/claude',
        '/usr/bin/claude',
        join(home, '.npm-global/bin/claude'),
        join(home, '.local/bin/claude'),
        join(home, '.claude/local/claude'),
        join(home, 'n/bin/claude'),
      ]

  const commonPaths = [...staticPaths, ...getDynamicPaths()]

  log('[findClaudePath] Checking common paths: ' + commonPaths.length + ' paths')
  for (const candidatePath of commonPaths) {
    if (existsSync(candidatePath)) {
      log('[findClaudePath] Found at common path: ' + candidatePath)
      return { found: true, path: candidatePath }
    }
  }
  log('[findClaudePath] No common path found')

  const tryFindClaude = (command: string): string | null => {
    console.log('[findClaudePath] Trying command:', command)
    try {
      const foundPath = execSync(command, { encoding: 'utf8', timeout: 5000 }).trim()
      const firstPath = foundPath.split('\n')[0]?.trim()
      if (firstPath) {
        console.log('[findClaudePath] Found path:', firstPath)
        return firstPath
      }
    } catch (error) {
      console.log('[findClaudePath] Command failed:', command, error instanceof Error ? error.message : error)
      return null
    }
    return null
  }

  let foundPath: string | null = null

  if (isMac) {
    foundPath = tryFindClaude('/bin/zsh -lc "which claude"')
    if (!foundPath) {
      foundPath = tryFindClaude('/bin/bash -lc "which claude"')
    }
  } else if (isWindows) {
    foundPath = tryFindClaude('where claude')
  } else {
    foundPath = tryFindClaude('which claude')
  }

  if (foundPath) {
    return { found: true, path: foundPath }
  }

  const defaultPath = isWindows ? 'claude.exe' : 'claude'
  return {
    found: false,
    path: defaultPath,
    error: {
      code: 'CLAUDE_NOT_FOUND',
      message: 'Claude CLI를 찾을 수 없습니다. Claude Code를 설치해주세요.',
      details: 'https://claude.ai/code 에서 설치 가능합니다.',
    },
  }
}

class ClaudeService {
  private activeQuery: Query | null = null
  private claudeSessionId: string | null = null
  private claudePath: string
  private claudeAvailable: boolean
  private claudeError?: ClaudeError

  constructor() {
    const pathResult = findClaudePath()
    this.claudePath = pathResult.path
    this.claudeAvailable = pathResult.found
    this.claudeError = pathResult.error
    console.log('[ClaudeService] Claude path:', this.claudePath, 'available:', this.claudeAvailable)

    if (pathResult.found) {
      addClaudePathToEnv(this.claudePath)
    }
  }

  checkAvailability(): ClaudeAvailability {
    if (this.claudeAvailable) {
      return { available: true, path: this.claudePath }
    }
    return {
      available: false,
      error: this.claudeError ?? {
        code: 'CLAUDE_NOT_FOUND',
        message: 'Claude CLI를 찾을 수 없습니다.',
      },
    }
  }

  async execute(
    workDir: string,
    prompt: string,
    window: BrowserWindow,
    options?: {
      maxThinkingTokens?: number
      systemPrompt?: string
    }
  ): Promise<string | null> {
    log('[ClaudeService] execute called, claudePath: ' + this.claudePath + ', available: ' + this.claudeAvailable)
    log('[ClaudeService] Current PATH: ' + process.env.PATH)
    console.log('[ClaudeService] Starting execution with prompt:', prompt.substring(0, 100))

    const sdkOptions: Options = {
      cwd: workDir,
      pathToClaudeCodeExecutable: this.claudePath,
      systemPrompt: options?.systemPrompt || DEFAULT_SYSTEM_PROMPT_PRESET,
      settingSources: ['user', 'project', 'local'],
      maxTurns: 1000,
      includePartialMessages: true,
      permissionMode: 'bypassPermissions',
      resume: this.claudeSessionId ?? undefined,
      maxThinkingTokens: options?.maxThinkingTokens,
    }

    try {
      log('[ClaudeService] Calling query() with path: ' + sdkOptions.pathToClaudeCodeExecutable)
      const queryResult = query({
        prompt,
        options: sdkOptions,
      })
      log('[ClaudeService] query() returned, iterating...')

      this.activeQuery = queryResult

      let newClaudeSessionId: string | null = null
      let collectedResponse = ''

      for await (const message of queryResult) {
        const processedMessage = this.processMessage(message, window)
        if (processedMessage?.claudeSessionId) {
          newClaudeSessionId = processedMessage.claudeSessionId
          this.claudeSessionId = newClaudeSessionId
        }
        if (processedMessage?.textContent) {
          collectedResponse += processedMessage.textContent
        }
      }

      window.webContents.send('claude:stream', {
        type: 'end',
        exitCode: 0,
      })

      if (Notification.isSupported() && !window.isFocused()) {
        this.generateNotification(prompt, collectedResponse).then(({ title, body }) => {
          const notification = new Notification({
            title,
            body,
            silent: false,
          })
          notification.on('click', () => {
            window.show()
            window.focus()
            window.webContents.focus()
            window.webContents.send('window:focus')
          })
          notification.show()
        })
      }

      this.activeQuery = null
      return newClaudeSessionId
    } catch (error) {
      log('[ClaudeService] Query error: ' + (error instanceof Error ? error.message : String(error)))
      log('[ClaudeService] Error stack: ' + (error instanceof Error ? error.stack : 'N/A'))
      console.error('[ClaudeService] Query error:', error)
      window.webContents.send('claude:stream', {
        type: 'error',
        content: error instanceof Error ? error.message : String(error),
      })
      this.activeQuery = null
      return null
    }
  }

  private processMessage(
    message: SDKMessage,
    window: BrowserWindow
  ): { claudeSessionId?: string; textContent?: string } | null {
    if (message.type === 'system') {
      const sysMsg = message as SDKSystemMessage
      if (sysMsg.subtype === 'init') {
        console.log('[ClaudeService] Claude Session ID:', sysMsg.session_id)
        return { claudeSessionId: sysMsg.session_id }
      }
      if (sysMsg.subtype === 'compact_boundary') {
        window.webContents.send('claude:stream', {
          type: 'compact_start',
        })
      }
    }

    if (message.type === 'stream_event') {
      const partialMsg = message as SDKPartialAssistantMessage
      const event = partialMsg.event

      if (event.type === 'content_block_start') {
        const contentBlock = event.content_block
        if (contentBlock.type === 'thinking') {
          window.webContents.send('claude:stream', {
            type: 'thinking_start',
          })
        } else if (contentBlock.type === 'tool_use') {
          window.webContents.send('claude:stream', {
            type: 'tool_use',
            toolName: contentBlock.name,
            input: '',
          })
        }
      }

      if (event.type === 'content_block_delta') {
        const delta = event.delta
        if (delta.type === 'thinking_delta' && 'thinking' in delta) {
          window.webContents.send('claude:stream', {
            type: 'thinking',
            content: delta.thinking,
          })
        } else if (delta.type === 'text_delta' && 'text' in delta) {
          window.webContents.send('claude:stream', {
            type: 'stdout',
            content: delta.text,
          })
          return { textContent: delta.text as string }
        } else if (delta.type === 'input_json_delta' && 'partial_json' in delta) {
          window.webContents.send('claude:stream', {
            type: 'tool_use',
            input: delta.partial_json,
          })
        }
      }

      if (event.type === 'content_block_stop') {
        window.webContents.send('claude:stream', {
          type: 'content_block_stop',
        })
      }
    }

    if (message.type === 'assistant' || message.type === 'user') {
      const msg = message as { message?: { content?: Array<{ type: string; tool_use_id?: string; content?: string | unknown }> } }
      if (msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'tool_result') {
            window.webContents.send('claude:stream', {
              type: 'tool_result',
              toolName: block.tool_use_id ?? '',
              content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
            })
          }
        }
      }
    }

    if (message.type === 'result') {
      const resultMsg = message as SDKResultMessage
      if (resultMsg.is_error && 'errors' in resultMsg) {
        const errorContent = resultMsg.errors?.join('\n') ?? 'Unknown error'
        const rateLimitMatch = errorContent.match(/Rate limit reached.*?resets at (\d{4}-\d{2}-\d{2}T[\d:]+(?:[+-]\d{2}:\d{2}|Z))/i)
        if (rateLimitMatch?.[1]) {
          window.webContents.send('claude:stream', {
            type: 'rate_limit',
            content: errorContent,
            resetTime: rateLimitMatch[1],
          })
        } else {
          window.webContents.send('claude:stream', {
            type: 'error',
            content: errorContent,
          })
        }
      }

      if ('usage' in resultMsg && 'modelUsage' in resultMsg) {
        const usage = resultMsg.usage as { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number }
        const modelUsage = resultMsg.modelUsage as Record<string, { contextWindow?: number }>
        const firstModelUsage = Object.values(modelUsage)[0]
        window.webContents.send('claude:stream', {
          type: 'usage',
          usage: {
            inputTokens: usage.input_tokens ?? 0,
            outputTokens: usage.output_tokens ?? 0,
            cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
            cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
            contextWindowSize: firstModelUsage?.contextWindow ?? 200000,
          },
        })
      }

      return { claudeSessionId: resultMsg.session_id }
    }

    return null
  }

  async abort(): Promise<boolean> {
    if (this.activeQuery) {
      try {
        await this.activeQuery.interrupt()
        this.activeQuery = null
        return true
      } catch (error) {
        console.error('[ClaudeService] Abort error:', error)
        return false
      }
    }
    return false
  }

  async cleanup(): Promise<void> {
    console.log('[ClaudeService] Cleaning up...')
    if (this.activeQuery) {
      try {
        await this.activeQuery.interrupt()
      } catch (error) {
        console.error('[ClaudeService] Cleanup error:', error)
      }
    }
    this.activeQuery = null
  }

  resetSession(): void {
    console.log('[ClaudeService] Resetting session')
    this.claudeSessionId = null
  }

  setSessionId(sessionId: string): void {
    console.log('[ClaudeService] Setting session ID:', sessionId)
    this.claudeSessionId = sessionId
  }

  async generateTitle(message: string): Promise<{ success: boolean; title: string }> {
    const messageWithoutUrls = message.replace(/https?:\/\/[^\s]+/g, '').trim()
    const fallbackTitle = (messageWithoutUrls || message).slice(0, 30)

    if (!this.claudeAvailable) {
      return { success: false, title: fallbackTitle }
    }

    const textForTitle = messageWithoutUrls || message
    const prompt = `다음 메시지의 핵심 주제를 한국어로 10자 이내로 요약해줘. 따옴표나 설명 없이 제목만 출력해:\n\n${textForTitle}`

    try {
      const sdkOptions: Options = {
        cwd: homedir(),
        pathToClaudeCodeExecutable: this.claudePath,
        maxTurns: 1,
        permissionMode: 'bypassPermissions',
      }

      const queryResult = query({ prompt, options: sdkOptions })
      let resultText = ''

      for await (const msg of queryResult) {
        if (msg.type === 'assistant') {
          const assistantMsg = msg as { message?: { content?: Array<{ type: string; text?: string }> } }
          if (assistantMsg.message?.content) {
            for (const block of assistantMsg.message.content) {
              if (block.type === 'text' && block.text) {
                resultText += block.text
              }
            }
          }
        }
      }

      const title = resultText.trim().slice(0, 30) || fallbackTitle
      console.log('[ClaudeService] Generated title:', title)
      return { success: true, title }
    } catch (error) {
      console.error('[ClaudeService] Title generation error:', error)
      return { success: false, title: fallbackTitle }
    }
  }

  async generateNotification(userMessage: string, assistantResponse: string): Promise<{ title: string; body: string }> {
    if (!this.claudeAvailable) {
      return { title: '응답 완료', body: '메시지가 도착했어요!' }
    }

    const generateText = async (promptText: string): Promise<string> => {
      try {
        const sdkOptions: Options = {
          cwd: homedir(),
          pathToClaudeCodeExecutable: this.claudePath,
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          maxTurns: 1,
          permissionMode: 'bypassPermissions',
        }

        const queryResult = query({ prompt: promptText, options: sdkOptions })
        let resultText = ''

        for await (const msg of queryResult) {
          if (msg.type === 'assistant') {
            const assistantMsg = msg as { message?: { content?: Array<{ type: string; text?: string }> } }
            if (assistantMsg.message?.content) {
              for (const block of assistantMsg.message.content) {
                if (block.type === 'text' && block.text) {
                  resultText += block.text
                }
              }
            }
          }
        }

        return resultText.trim()
      } catch {
        return ''
      }
    }

    const contextSummary = `사용자 질문: ${userMessage.slice(0, 100)}\n응답 요약: ${assistantResponse.slice(0, 200)}`

    const titlePrompt = `다음 대화 내용을 바탕으로 사용자에게 보낼 알림 제목을 20자 이내로 작성해. 대화 내용과 관련있고 자극적이어야 해. 따옴표나 설명 없이 제목만 출력해.\n\n${contextSummary}`
    const bodyPrompt = `다음 대화 내용을 바탕으로 사용자에게 보낼 알림 내용을 40자 이내로 작성해. 대화 내용을 요약하되 너답게 자극적으로 작성해. 따옴표나 설명 없이 내용만 출력해.\n\n${contextSummary}`

    try {
      const [title, body] = await Promise.all([
        generateText(titlePrompt),
        generateText(bodyPrompt),
      ])

      console.log('[ClaudeService] Generated notification:', { title, body })
      return {
        title: title.slice(0, 30) || '응답 완료',
        body: body.slice(0, 60) || '메시지가 도착했어요!',
      }
    } catch (error) {
      console.error('[ClaudeService] Notification generation error:', error)
      return { title: '응답 완료', body: '메시지가 도착했어요!' }
    }
  }
}

export const claudeService = new ClaudeService()
