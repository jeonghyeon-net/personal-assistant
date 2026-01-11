import { useRef, useEffect, KeyboardEvent } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

const Container = styled.div`
  padding: 8px 12px 10px;
  border-top: 1px solid rgba(255,255,255,0.06);
`

const InputWrap = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: rgba(255,255,255,0.06);
  border-radius: 6px;
  padding: 4px 4px 4px 10px;
`

const TextArea = styled.textarea`
  flex: 1;
  border: none;
  background: none;
  color: rgba(255,255,255,0.92);
  font-size: 13px;
  line-height: 20px;
  resize: none;
  outline: none;
  height: 20px;
  max-height: 80px;
  padding: 4px 0;

  &::placeholder {
    color: rgba(255,255,255,0.3);
  }
`

const SendBtn = styled.button<{ $stop?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background: ${({ $stop }) => $stop ? '#FF453A' : '#0A84FF'};
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:disabled {
    opacity: 0.3;
  }

  svg {
    width: 14px;
    height: 14px;
  }
`

interface Props {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  onAbort: () => void
  isStreaming: boolean
}

export function MessageInput({ value, onChange, onSend, onAbort, isStreaming }: Props): React.ReactElement {
  const { t } = useTranslation()
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 80)}px`
    }
  }, [value])

  useEffect(() => {
    if (!isStreaming && ref.current) {
      ref.current.focus()
    }
  }, [isStreaming])

  useEffect(() => {
    const unsubscribe = window.api.window.onFocus(() => {
      if (ref.current && !isStreaming) {
        ref.current.focus()
      }
    })
    return unsubscribe
  }, [isStreaming])

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isStreaming && value.trim()) onSend()
    }
  }

  return (
    <Container>
      <InputWrap>
        <TextArea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={t('chat.placeholder')}
          disabled={isStreaming}
          rows={1}
          autoFocus
        />
        <SendBtn
          onClick={isStreaming ? onAbort : onSend}
          disabled={!isStreaming && !value.trim()}
          $stop={isStreaming}
        >
          {isStreaming ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </SendBtn>
      </InputWrap>
    </Container>
  )
}
