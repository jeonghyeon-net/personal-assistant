import { useEffect } from 'react'
import styled from 'styled-components'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useChatStore } from '../stores/chatStore'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;
`

export function ChatContainer(): React.ReactElement {
  const {
    messages,
    isStreaming,
    currentStreamContent,
    streamingBlocks,
    inputValue,
    setInputValue,
    sendMessage,
    abortMessage,
  } = useChatStore()

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim()) return
    await sendMessage(inputValue.trim())
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isStreaming) {
        abortMessage()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isStreaming, abortMessage])

  return (
    <Container>
      <Messages>
        <MessageList
          messages={messages}
          streamContent={currentStreamContent}
          streamingBlocks={streamingBlocks}
        />
      </Messages>

      <MessageInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        onAbort={abortMessage}
        isStreaming={isStreaming}
      />
    </Container>
  )
}
