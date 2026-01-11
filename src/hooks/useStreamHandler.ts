import { useEffect } from 'react'
import type { StreamData } from '../types'
import { useChatStore } from '../stores/chatStore'

export function useStreamHandler(): void {
  useEffect(() => {
    const unsubscribe = window.api.claude.onStream((data: StreamData) => {
      const store = useChatStore.getState()

      switch (data.type) {
        case 'stdout': {
          const content = data.content ?? ''
          store.appendStream(content)
          store.appendBlock({ type: 'text', content })
          break
        }
        case 'thinking': {
          const content = data.content ?? ''
          store.appendBlock({ type: 'thinking', content })
          break
        }
        case 'tool_use': {
          if (data.toolName) {
            store.appendBlock({ type: 'tool_use', toolName: data.toolName, input: data.input ?? '' })
          } else if (data.input) {
            store.appendBlock({ type: 'tool_use', toolName: '', input: data.input })
          }
          break
        }
        case 'tool_result': {
          store.appendBlock({ type: 'tool_result', toolName: data.toolName ?? '', content: data.content ?? '' })
          break
        }
        case 'end': {
          const streamingMessageId = store.streamingMessageId
          if (streamingMessageId) {
            store.updateMessage(
              streamingMessageId,
              store.currentStreamContent,
              store.streamingBlocks.length > 0 ? [...store.streamingBlocks] : undefined
            )
          }
          store.stopStreaming()
          break
        }
        case 'rate_limit': {
          let errorMessage = 'Rate limit에 도달했습니다.'
          if (data.resetTime) {
            try {
              const resetDate = new Date(data.resetTime)
              const localTime = resetDate.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              errorMessage = `Rate limit에 도달했습니다. ${localTime}에 리셋됩니다.`
            } catch {
              errorMessage = data.content ?? 'Rate limit에 도달했습니다.'
            }
          }
          store.setError(errorMessage)
          store.stopStreaming()
          break
        }
        case 'error': {
          store.setError(data.content ?? 'Unknown error')
          store.stopStreaming()
          break
        }
        case 'compact_start': {
          store.appendBlock({ type: 'text', content: '\n[컨텍스트 요약 중...]\n' })
          break
        }
        case 'usage': {
          break
        }
        default:
          break
      }
    })

    return unsubscribe
  }, [])
}
