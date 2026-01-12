import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { useChatStore } from '../stores/chatStore'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
`

const Messages = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;
`

const SizeToggle = styled.button<{ $expanded: boolean }>`
  position: fixed;
  bottom: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  padding: 2px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.2);
  font-size: 12px;
  line-height: 1;
  transition: color 0.15s ease, transform 0.2s ease;
  z-index: 1000;
  transform: ${({ $expanded }) => ($expanded ? 'rotate(180deg)' : 'rotate(0deg)')};

  &:hover {
    color: rgba(255, 255, 255, 0.5);
  }
`

export function ChatContainer(): React.ReactElement {
  const [expanded, setExpanded] = useState(false)
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

  useEffect(() => {
    window.api.window.getExpanded().then((savedExpanded) => {
      setExpanded(savedExpanded)
      if (savedExpanded) {
        window.api.window.toggleSize(savedExpanded)
      }
    })
  }, [])

  const handleSend = async (): Promise<void> => {
    if (!inputValue.trim()) return
    await sendMessage(inputValue.trim())
  }

  const handleToggleSize = (): void => {
    const newExpanded = !expanded
    setExpanded(newExpanded)
    window.api.window.toggleSize(newExpanded)
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

      <SizeToggle onClick={handleToggleSize} title={expanded ? '축소' : '확대'} $expanded={expanded}>
        ⌞
      </SizeToggle>

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
