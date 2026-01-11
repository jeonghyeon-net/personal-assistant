import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useChatStore } from '../stores/chatStore'
import { languages } from '../i18n'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
`

const Title = styled.h2`
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin: 0 0 16px;
  cursor: pointer;

  &:hover {
    color: rgba(255,255,255,0.7);
  }
`

const Section = styled.div`
  margin-bottom: 16px;
`

const Label = styled.div`
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  margin-bottom: 6px;
`

const ShortcutWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const ShortcutButton = styled.button<{ $recording: boolean }>`
  flex: 1;
  background: rgba(255,255,255,0.08);
  border: 1px solid ${({ $recording }) => $recording ? '#0A84FF' : 'rgba(255,255,255,0.1)'};
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 13px;
  color: ${({ $recording }) => $recording ? '#0A84FF' : 'rgba(255,255,255,0.9)'};
  cursor: pointer;
  text-align: left;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  letter-spacing: 1px;

  &:hover {
    background: rgba(255,255,255,0.1);
  }
`

const ClearButton = styled.button`
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  width: 28px;
  height: 34px;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.8);
  }
`

const HelpText = styled.div`
  font-size: 10px;
  color: rgba(255,255,255,0.35);
  margin-top: 6px;
`

const PromptWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const PromptTextArea = styled.textarea`
  width: 100%;
  height: 120px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 11px;
  color: rgba(255,255,255,0.9);
  resize: vertical;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  line-height: 1.4;
  box-sizing: border-box;
  overflow-y: auto;

  &:focus {
    border-color: #0A84FF;
  }

  &::placeholder {
    color: rgba(255,255,255,0.3);
  }
`

const ResetButton = styled.button`
  align-self: flex-start;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  color: rgba(255,255,255,0.6);
  cursor: pointer;

  &:hover {
    background: rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.9);
  }
`

const QuitButton = styled.button`
  width: 100%;
  background: rgba(255,59,48,0.15);
  border: 1px solid rgba(255,59,48,0.3);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 12px;
  color: #FF453A;
  cursor: pointer;
  margin-top: auto;

  &:hover {
    background: rgba(255,59,48,0.25);
  }
`

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Toggle = styled.button<{ $active: boolean }>`
  width: 42px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: ${({ $active }) => $active ? '#34C759' : 'rgba(255,255,255,0.2)'};
  position: relative;
  cursor: pointer;
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $active }) => $active ? '20px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
  }
`

const LanguageSelect = styled.select`
  width: 100%;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 13px;
  color: rgba(255,255,255,0.9);
  cursor: pointer;
  outline: none;
  font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

  &:focus {
    border-color: #0A84FF;
  }

  option {
    background: #1c1c1e;
    color: rgba(255,255,255,0.9);
  }
`

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift'])

const KEY_DISPLAY_MAP: Record<string, string> = {
  Meta: '⌘',
  Control: '⌃',
  Alt: '⌥',
  Shift: '⇧',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Backspace: '⌫',
  Delete: '⌦',
  Enter: '↩',
  Tab: '⇥',
  Escape: '⎋',
  Space: '␣',
}

function formatShortcutForElectron(modifiers: Set<string>, key: string): string {
  const parts: string[] = []
  if (modifiers.has('Meta')) parts.push('CommandOrControl')
  if (modifiers.has('Alt')) parts.push('Alt')
  if (modifiers.has('Control') && !modifiers.has('Meta')) parts.push('Control')
  if (modifiers.has('Shift')) parts.push('Shift')
  const keyName = key.length === 1 ? key.toUpperCase() : key
  parts.push(keyName)
  return parts.join('+')
}

function formatShortcutForDisplay(shortcut: string): string {
  if (!shortcut) return ''
  const parts = shortcut.split('+')
  const displayParts = parts.map((part) => {
    if (part === 'CommandOrControl') return '⌘'
    return KEY_DISPLAY_MAP[part] ?? part
  })
  return displayParts.join(' ')
}

interface Props {
  onBack: () => void
}

export function SettingsContainer({ onBack }: Props): React.ReactElement {
  const { t, i18n } = useTranslation()
  const [shortcut, setShortcut] = useState('Alt+Space')
  const [isRecording, setIsRecording] = useState(false)
  const [pressedModifiers, setPressedModifiers] = useState<Set<string>>(new Set())
  const [openAtLogin, setOpenAtLogin] = useState(false)
  const recordingRef = useRef(false)
  const modifiersRef = useRef<Set<string>>(new Set())
  const buttonRef = useRef<HTMLButtonElement>(null)

  const systemPrompt = useChatStore((state) => state.systemPrompt)
  const setSystemPrompt = useChatStore((state) => state.setSystemPrompt)

  const handleLanguageChange = (lang: string): void => {
    i18n.changeLanguage(lang)
  }

  const handleResetPrompt = async (): Promise<void> => {
    const defaultPrompt = await window.api.config.get<string>('defaultSystemPrompt')
    if (defaultPrompt) {
      setSystemPrompt(defaultPrompt)
    }
  }

  useEffect(() => {
    const loadSettings = async (): Promise<void> => {
      const savedShortcut = await window.api.config.get<string>('globalShortcut')
      if (savedShortcut) setShortcut(savedShortcut)
      const savedOpenAtLogin = await window.api.config.get<boolean>('openAtLogin')
      setOpenAtLogin(savedOpenAtLogin ?? false)
    }
    loadSettings()
  }, [])

  const handleOpenAtLoginChange = async (enabled: boolean): Promise<void> => {
    await window.api.config.setOpenAtLogin(enabled)
    setOpenAtLogin(enabled)
  }

  useEffect(() => {
    recordingRef.current = isRecording
  }, [isRecording])

  useEffect(() => {
    modifiersRef.current = pressedModifiers
  }, [pressedModifiers])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!recordingRef.current) return
      const target = event.target as HTMLElement
      if (buttonRef.current && !buttonRef.current.contains(target)) {
        setIsRecording(false)
        setPressedModifiers(new Set())
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!recordingRef.current) return
      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        setIsRecording(false)
        setPressedModifiers(new Set())
        return
      }

      if (MODIFIER_KEYS.has(event.key)) {
        setPressedModifiers((prev) => new Set([...prev, event.key]))
        return
      }

      if (modifiersRef.current.size > 0) {
        const newShortcut = formatShortcutForElectron(modifiersRef.current, event.key)
        saveShortcut(newShortcut)
        setIsRecording(false)
        setPressedModifiers(new Set())
      }
    }

    const handleKeyUp = (event: KeyboardEvent): void => {
      if (!recordingRef.current) return
      if (MODIFIER_KEYS.has(event.key)) {
        setPressedModifiers((prev) => {
          const next = new Set(prev)
          next.delete(event.key)
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [])

  const saveShortcut = async (newShortcut: string): Promise<void> => {
    const result = await window.api.config.setShortcut(newShortcut)
    if (result.success) {
      setShortcut(newShortcut)
    }
  }

  const handleClear = (event: React.MouseEvent): void => {
    event.stopPropagation()
    saveShortcut('Alt+Space')
    setIsRecording(false)
    setPressedModifiers(new Set())
  }

  const displayValue = isRecording
    ? pressedModifiers.size > 0
      ? Array.from(pressedModifiers).map((key) => KEY_DISPLAY_MAP[key] ?? key).join(' ')
      : t('settings.shortcut.waiting')
    : formatShortcutForDisplay(shortcut)

  return (
    <Container>
      <Title onClick={onBack}>{t('settings.back')}</Title>

      <Section>
        <Label>{t('settings.language.label')}</Label>
        <LanguageSelect
          value={i18n.language}
          onChange={(e) => handleLanguageChange(e.target.value)}
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.nativeName}
            </option>
          ))}
        </LanguageSelect>
      </Section>

      <Section>
        <ToggleWrapper>
          <Label style={{ marginBottom: 0 }}>{t('settings.openAtLogin')}</Label>
          <Toggle
            $active={openAtLogin}
            onClick={() => handleOpenAtLoginChange(!openAtLogin)}
          />
        </ToggleWrapper>
      </Section>

      <Section>
        <Label>{t('settings.shortcut.label')}</Label>
        <ShortcutWrapper>
          <ShortcutButton
            ref={buttonRef}
            $recording={isRecording}
            onClick={() => setIsRecording(true)}
          >
            {displayValue}
          </ShortcutButton>
          <ClearButton onClick={handleClear} title={t('settings.shortcut.reset')}>
            ×
          </ClearButton>
        </ShortcutWrapper>
        <HelpText>{t('settings.shortcut.help')}</HelpText>
      </Section>

      <Section>
        <Label>{t('settings.systemPrompt.label')}</Label>
        <PromptWrapper>
          <PromptTextArea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={t('settings.systemPrompt.placeholder')}
          />
          <ResetButton onClick={handleResetPrompt}>{t('settings.systemPrompt.reset')}</ResetButton>
        </PromptWrapper>
        <HelpText>{t('settings.systemPrompt.help')}</HelpText>
      </Section>

      <QuitButton onClick={() => window.api.window.quit()}>
        {t('settings.quit')}
      </QuitButton>
    </Container>
  )
}
