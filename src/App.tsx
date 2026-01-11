import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { ChatContainer } from './components/ChatContainer'
import { SettingsContainer } from './components/SettingsContainer'
import { SessionList } from './components/SessionList'
import { useStreamHandler } from './hooks/useStreamHandler'
import { useChatStore } from './stores/chatStore'

const AppWrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(30, 30, 30, 0.92);
  backdrop-filter: blur(40px);
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
`

const HeaderTitle = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  display: flex;
  align-items: center;
  gap: 6px;
`

const LoadingDots = styled.span`
  @keyframes dots {
    0%, 20% { content: '.'; }
    40% { content: '..'; }
    60%, 100% { content: '...'; }
  }

  &::after {
    content: '';
    animation: dots 1s infinite;
  }
`

const HeaderButtons = styled.div`
  display: flex;
  gap: 4px;
`

const IconButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: rgba(255,255,255,0.4);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: rgba(255,255,255,0.7);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`

const Content = styled.div`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

type View = 'chat' | 'settings' | 'sessions'

export function App(): React.ReactElement {
  useStreamHandler()
  const [view, setView] = useState<View>('chat')
  const checkClaudeAvailability = useChatStore((state) => state.checkClaudeAvailability)
  const clearChat = useChatStore((state) => state.clearChat)
  const sessions = useChatStore((state) => state.sessions)
  const sessionId = useChatStore((state) => state.sessionId)
  const currentTitle = useChatStore((state) => state.currentTitle)
  const isGeneratingTitle = useChatStore((state) => state.isGeneratingTitle)

  const currentSession = sessions.find((s) => s.id === sessionId)
  const title = currentSession?.title || currentTitle

  useEffect(() => {
    checkClaudeAvailability()
  }, [checkClaudeAvailability])

  return (
    <AppWrapper>
      {view === 'chat' && (
        <Header>
          <HeaderTitle>
            {isGeneratingTitle ? (
              <>제목 생성 중<LoadingDots /></>
            ) : (
              title
            )}
          </HeaderTitle>
          <HeaderButtons>
            <IconButton onClick={() => setView('sessions')} title="대화 기록">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </IconButton>
            <IconButton onClick={clearChat} title="새 대화">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </IconButton>
            <IconButton onClick={() => setView('settings')} title="설정">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </IconButton>
          </HeaderButtons>
        </Header>
      )}
      <Content>
        {view === 'chat' && <ChatContainer />}
        {view === 'settings' && <SettingsContainer onBack={() => setView('chat')} />}
        {view === 'sessions' && <SessionList onBack={() => setView('chat')} />}
      </Content>
    </AppWrapper>
  )
}
