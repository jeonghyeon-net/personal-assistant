import { useState, useCallback, type ComponentPropsWithoutRef } from 'react'
import styled, { keyframes, css } from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Message, ContentBlock } from '../types'

const Wrap = styled.div<{ $isUser: boolean }>`
  padding: 3px 12px;
  display: flex;
  width: 100%;
  box-sizing: border-box;
  justify-content: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
`

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const Bubble = styled.div<{ $isUser: boolean; $isStreaming?: boolean }>`
  width: ${({ $isUser }) => ($isUser ? 'auto' : '85%')};
  max-width: 85%;
  padding: 6px 10px;
  border-radius: 4px;
  background: ${({ $isUser }) =>
    $isUser ? '#0A84FF' : 'rgba(255,255,255,0.08)'};
  color: rgba(255, 255, 255, 0.92);
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: break-word;
  word-break: break-word;
  animation: ${slideIn} 0.25s ease-out;
  animation-delay: ${({ $isStreaming }) => ($isStreaming ? '0.3s' : '0s')};
  animation-fill-mode: backwards;
`

const markdownStyles = css`
  p {
    margin: 0 0 10px;
    &:last-child {
      margin: 0;
    }
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    margin: 16px 0 8px;
    font-weight: 600;
    line-height: 1.3;
    &:first-child {
      margin-top: 0;
    }
  }
  h1 {
    font-size: 1.4em;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 6px;
  }
  h2 {
    font-size: 1.25em;
  }
  h3 {
    font-size: 1.1em;
  }

  ul,
  ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  li {
    margin: 4px 0;
    &::marker {
      color: rgba(255, 255, 255, 0.5);
    }
  }
  ul li {
    list-style-type: disc;
  }
  ul ul li {
    list-style-type: circle;
  }

  blockquote {
    margin: 10px 0;
    padding: 8px 14px;
    border-left: 3px solid rgba(10, 132, 255, 0.6);
    background: rgba(255, 255, 255, 0.04);
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: rgba(255, 255, 255, 0.8);
    p {
      margin: 0;
    }
  }

  hr {
    border: none;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    margin: 16px 0;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 12px;
    overflow: hidden;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.15);
  }
  th,
  td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  th {
    background: rgba(255, 255, 255, 0.08);
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
  }
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: rgba(255, 255, 255, 0.03);
  }

  a {
    color: #64d2ff;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
    &:hover {
      color: #8ae0ff;
      border-bottom-color: rgba(100, 210, 255, 0.4);
    }
  }

  strong {
    font-weight: 600;
    color: #fff;
  }

  em {
    font-style: italic;
    color: rgba(255, 255, 255, 0.9);
  }

  del {
    text-decoration: line-through;
    color: rgba(255, 255, 255, 0.5);
  }

  img {
    max-width: 100%;
    border-radius: 8px;
    margin: 8px 0;
  }
`

const MarkdownContent = styled.div`
  ${markdownStyles}
`

const InlineCode = styled.code`
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
  font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
  color: #ff7eb6;
  word-break: break-all;
`

const CodeBlockWrapper = styled.div`
  position: relative;
  margin: 12px 0;
  border-radius: 10px;
  overflow: hidden;
  background: #1e1e1e;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
`

const CodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
`

const CodeLanguage = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`

const CopyButton = styled.button<{ $copied?: boolean }>`
  background: ${({ $copied }) =>
    $copied ? 'rgba(50, 215, 75, 0.2)' : 'rgba(255, 255, 255, 0.08)'};
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  color: ${({ $copied }) =>
    $copied ? '#32d74b' : 'rgba(255, 255, 255, 0.6)'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: ${({ $copied }) =>
      $copied ? 'rgba(50, 215, 75, 0.3)' : 'rgba(255, 255, 255, 0.15)'};
    color: ${({ $copied }) => ($copied ? '#32d74b' : '#fff')};
  }

  ${({ $copied }) =>
    $copied &&
    css`
      animation: ${fadeOut} 0.3s ease 1.5s forwards;
    `}
`

const blink = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`

const Cursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 14px;
  background: linear-gradient(180deg, #0a84ff, #64d2ff);
  margin-left: 2px;
  animation: ${blink} 1s ease-in-out infinite;
  vertical-align: text-bottom;
  border-radius: 1px;
`

const typing = keyframes`
  0%, 20% { opacity: 0.3; }
  50% { opacity: 1; }
  80%, 100% { opacity: 0.3; }
`

const TypingDots = styled.span`
  display: inline-flex;
  gap: 3px;

  span {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    animation: ${typing} 1.2s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`

const Toggle = styled.details`
  margin: 2px 0;
  font-size: 10px;

  summary {
    cursor: pointer;
    padding: 2px 0;
    color: rgba(255, 255, 255, 0.35);
    user-select: none;
    list-style: none;

    &::-webkit-details-marker {
      display: none;
    }

    &::before {
      content: '▸ ';
      font-size: 8px;
    }

    &:hover {
      color: rgba(255, 255, 255, 0.55);
    }
  }

  &[open] summary::before {
    content: '▾ ';
  }
`

const ToggleContent = styled.div`
  padding: 4px 0 4px 10px;
  font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
  font-size: 9px;
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.4;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }
`

interface CodeBlockProps {
  language: string
  code: string
}

function CodeBlock({ language, code }: CodeBlockProps): React.ReactElement {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <CodeBlockWrapper>
      <CodeHeader>
        <CodeLanguage>{language || 'code'}</CodeLanguage>
        <CopyButton onClick={handleCopy} $copied={copied}>
          {copied ? '✓ Copied' : 'Copy'}
        </CopyButton>
      </CodeHeader>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '14px',
          background: 'transparent',
          fontSize: '12px',
          lineHeight: 1.5,
        }}
        showLineNumbers={code.split('\n').length > 3}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'rgba(255,255,255,0.25)',
          userSelect: 'none',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </CodeBlockWrapper>
  )
}

function Block({ block }: { block: ContentBlock }): React.ReactElement | null {
  if (block.type === 'text') return null
  const label =
    block.type === 'thinking'
      ? 'thinking'
      : block.type === 'tool_use'
        ? 'tool'
        : 'result'
  const content =
    block.type === 'thinking'
      ? block.content
      : block.type === 'tool_use'
        ? block.input
        : block.content

  return (
    <Toggle>
      <summary>
        {label}
        {block.type !== 'thinking' && block.toolName ? `: ${block.toolName}` : ''}
      </summary>
      <ToggleContent>{content}</ToggleContent>
    </Toggle>
  )
}

interface Props {
  message: Message
  streamContent?: string
  streamingBlocks?: ContentBlock[]
}

export function MessageItem({
  message,
  streamContent,
  streamingBlocks,
}: Props): React.ReactElement {
  const isUser = message.role === 'user'
  const content = message.isStreaming ? (streamContent ?? '') : message.content
  const blocks = message.isStreaming ? streamingBlocks : message.blocks

  const handleLinkClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      e.preventDefault()
      window.api.shell.openExternal(href)
    },
    []
  )

  const components: ComponentPropsWithoutRef<typeof ReactMarkdown>['components'] = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const codeString = String(children).replace(/\n$/, '')
      const isBlock = codeString.includes('\n') || (match && match[1])

      if (isBlock) {
        return <CodeBlock language={match?.[1] ?? ''} code={codeString} />
      }
      return <InlineCode {...props}>{children}</InlineCode>
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          onClick={(e) => href && handleLinkClick(e, href)}
          style={{ cursor: 'pointer' }}
        >
          {children}
        </a>
      )
    },
  }

  const renderBlocks = (): React.ReactNode => {
    if (!blocks || blocks.length === 0) {
      if (content) {
        return (
          <MarkdownContent>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {content}
            </ReactMarkdown>
          </MarkdownContent>
        )
      }
      return null
    }

    return blocks.map((block, i) => {
      if (block.type === 'text') {
        return block.content.trim() ? (
          <MarkdownContent key={i}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {block.content}
            </ReactMarkdown>
          </MarkdownContent>
        ) : null
      }
      return <Block key={i} block={block} />
    })
  }

  const renderUserContent = (text: string): React.ReactNode => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={i}
            href={part}
            onClick={(e) => handleLinkClick(e, part)}
            style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}
          >
            {part}
          </a>
        )
      }
      return part
    })
  }

  return (
    <Wrap $isUser={isUser}>
      <Bubble $isUser={isUser} $isStreaming={message.isStreaming}>
        {isUser ? (
          renderUserContent(content)
        ) : message.isStreaming ? (
          (content || (blocks && blocks.length > 0)) ? (
            <>
              {renderBlocks()}
              {content && !blocks?.some(b => b.type === 'text') && (
                <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
              )}
              <Cursor />
            </>
          ) : (
            <TypingDots>
              <span />
              <span />
              <span />
            </TypingDots>
          )
        ) : (
          renderBlocks()
        )}
      </Bubble>
    </Wrap>
  )
}
