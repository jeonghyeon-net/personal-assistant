import styled, { keyframes } from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message, ContentBlock } from '../types'

const Wrap = styled.div<{ $isUser: boolean }>`
  padding: 3px 12px;
  display: flex;
  justify-content: ${({ $isUser }) => $isUser ? 'flex-end' : 'flex-start'};
`

const Bubble = styled.div<{ $isUser: boolean }>`
  max-width: 88%;
  padding: 6px 10px;
  border-radius: 4px;
  background: ${({ $isUser }) => $isUser ? '#0A84FF' : 'rgba(255,255,255,0.08)'};
  color: rgba(255,255,255,0.92);
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: break-word;
  word-break: break-word;

  p { margin: 0 0 6px; &:last-child { margin: 0; } }
  ul, ol { margin: 0 0 6px; padding-left: 14px; }
  code {
    background: rgba(0,0,0,0.2);
    padding: 1px 4px;
    border-radius: 2px;
    font-size: 11px;
    font-family: "SF Mono", Menlo, monospace;
    word-break: break-all;
  }
  pre {
    background: rgba(0,0,0,0.2);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 4px 0;
    code { background: none; padding: 0; word-break: normal; }
  }
  a { color: #64D2FF; }
`

const blink = keyframes`
  50% { opacity: 0; }
`

const Cursor = styled.span`
  display: inline-block;
  width: 1px;
  height: 12px;
  background: #fff;
  margin-left: 1px;
  animation: ${blink} 1s step-end infinite;
  vertical-align: text-bottom;
`

const Toggle = styled.details`
  margin: 4px 0;
  font-size: 10px;

  summary {
    cursor: pointer;
    color: rgba(255,255,255,0.45);
    &:hover { color: rgba(255,255,255,0.65); }
  }
`

const ToggleContent = styled.div`
  margin-top: 4px;
  padding: 6px;
  background: rgba(0,0,0,0.15);
  border-radius: 3px;
  font-family: "SF Mono", Menlo, monospace;
  font-size: 9px;
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
  color: rgba(255,255,255,0.5);
`

function Block({ block }: { block: ContentBlock }): React.ReactElement | null {
  if (block.type === 'text') return null
  const label = block.type === 'thinking' ? 'thinking' : block.type === 'tool_use' ? 'tool' : 'result'
  const content = block.type === 'thinking' ? block.content : block.type === 'tool_use' ? block.input : block.content

  return (
    <Toggle>
      <summary>{label}{block.type !== 'thinking' && block.toolName ? `: ${block.toolName}` : ''}</summary>
      <ToggleContent>{content}</ToggleContent>
    </Toggle>
  )
}

interface Props {
  message: Message
  streamContent?: string
  streamingBlocks?: ContentBlock[]
}

export function MessageItem({ message, streamContent, streamingBlocks }: Props): React.ReactElement {
  const isUser = message.role === 'user'
  const content = message.isStreaming ? streamContent ?? '' : message.content
  const blocks = message.isStreaming ? streamingBlocks : message.blocks
  const nonText = blocks?.filter((b) => b.type !== 'text') ?? []
  const text = blocks?.filter((b) => b.type === 'text').map((b) => b.content).join('\n') || content

  return (
    <Wrap $isUser={isUser}>
      <Bubble $isUser={isUser}>
        {isUser ? (
          content
        ) : message.isStreaming ? (
          <>
            {nonText.map((b, i) => <Block key={i} block={b} />)}
            <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
            <Cursor />
          </>
        ) : (
          <>
            {nonText.map((b, i) => <Block key={i} block={b} />)}
            {text.trim() && <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>}
          </>
        )}
      </Bubble>
    </Wrap>
  )
}
