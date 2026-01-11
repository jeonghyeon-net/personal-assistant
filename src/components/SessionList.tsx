import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useChatStore } from '../stores/chatStore'
import type { ChatSession } from '../types'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
`

const Title = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin: 0 0 12px;
  cursor: pointer;

  &:hover {
    color: rgba(255,255,255,0.7);
  }
`

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const SessionItem = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px;
  cursor: pointer;
  gap: 8px;

  &:hover {
    background: rgba(255,255,255,0.1);
  }
`

const SessionInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const SessionTitle = styled.div`
  font-size: 12px;
  color: rgba(255,255,255,0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const SessionDate = styled.div`
  font-size: 10px;
  color: rgba(255,255,255,0.4);
  margin-top: 2px;
`

const DeleteButton = styled.button`
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: rgba(255,255,255,0.3);
  font-size: 12px;
  flex-shrink: 0;

  &:hover {
    color: #FF453A;
  }
`

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.3);
  font-size: 12px;
`

function useFormatDate() {
  const { t, i18n } = useTranslation()

  return (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return t('sessions.yesterday')
    } else if (days < 7) {
      return t('sessions.daysAgo', { days })
    } else {
      return date.toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
    }
  }
}

interface Props {
  onBack: () => void
}

export function SessionList({ onBack }: Props): React.ReactElement {
  const { t } = useTranslation()
  const formatDate = useFormatDate()
  const sessions = useChatStore((state) => state.sessions)
  const loadSession = useChatStore((state) => state.loadSession)
  const deleteSession = useChatStore((state) => state.deleteSession)

  const handleSelect = (session: ChatSession): void => {
    loadSession(session)
    onBack()
  }

  const handleDelete = async (e: React.MouseEvent, sessionId: string): Promise<void> => {
    e.stopPropagation()
    await deleteSession(sessionId)
  }

  return (
    <Container>
      <Title onClick={onBack}>{t('sessions.back')}</Title>
      {sessions.length === 0 ? (
        <EmptyState>{t('sessions.empty')}</EmptyState>
      ) : (
        <List>
          {sessions.map((session) => (
            <SessionItem key={session.id} onClick={() => handleSelect(session)}>
              <SessionInfo>
                <SessionTitle>{session.title}</SessionTitle>
                <SessionDate>{formatDate(session.updatedAt)}</SessionDate>
              </SessionInfo>
              <DeleteButton onClick={(e) => handleDelete(e, session.id)} title={t('sessions.delete')}>
                ×
              </DeleteButton>
            </SessionItem>
          ))}
        </List>
      )}
    </Container>
  )
}
