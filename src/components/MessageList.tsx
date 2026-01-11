import { useRef, useEffect } from 'react'
import { MessageItem } from './MessageItem'
import type { Message, ContentBlock } from '../types'

interface Props {
  messages: Message[]
  streamContent: string
  streamingBlocks: ContentBlock[]
}

export function MessageList({ messages, streamContent, streamingBlocks }: Props): React.ReactElement {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages.length, streamContent, streamingBlocks.length])

  return (
    <>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          streamContent={message.isStreaming ? streamContent : undefined}
          streamingBlocks={message.isStreaming ? streamingBlocks : undefined}
        />
      ))}
      <div ref={endRef} />
    </>
  )
}
