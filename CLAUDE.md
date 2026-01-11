# PA (Personal Assistant) - Claude Code 지침

## 프로젝트 개요

macOS 메뉴바에 상주하는 Claude Code 기반 개인 비서 앱

## 기술 스택

- **Runtime**: Electron 34+
- **Build**: vite-plugin-electron
- **UI**: React 19 + TypeScript
- **State**: Zustand
- **Styling**: styled-components
- **Claude**: @anthropic-ai/claude-agent-sdk
- **i18n**: i18next (20개 언어 지원)

## 프로젝트 구조

```
personal-assistant/
├── electron/
│   ├── main.ts                 # Tray, Window, IPC 핸들러, fixPath()
│   ├── preload.ts              # Context bridge
│   ├── systemPrompt.ts         # 기본 시스템 프롬프트
│   └── services/
│       └── ClaudeService.ts    # Claude SDK 통합
├── src/
│   ├── main.tsx                # React 진입점
│   ├── App.tsx                 # 메인 컴포넌트
│   ├── components/
│   │   ├── ChatContainer.tsx   # 채팅 레이아웃
│   │   ├── MessageList.tsx     # 메시지 목록 (react-virtuoso)
│   │   ├── MessageItem.tsx     # 메시지 렌더링 (마크다운)
│   │   ├── MessageInput.tsx    # 입력창
│   │   ├── SessionList.tsx     # 대화 기록 목록
│   │   └── SettingsContainer.tsx # 설정
│   ├── stores/
│   │   └── chatStore.ts        # Zustand 상태 관리
│   ├── hooks/
│   │   └── useStreamHandler.ts # 스트림 이벤트 핸들러
│   ├── i18n/                   # 다국어 지원
│   │   └── locales/            # 20개 언어 파일
│   └── types/
│       └── index.ts            # 타입 정의
├── resources/
│   ├── icon.icns               # 앱 아이콘
│   └── trayTemplate.png        # 트레이 아이콘
└── release/                    # 빌드 결과물
```

## 주요 기능

1. **메뉴바 트레이** - 클릭 시 팝업창 열림/닫힘
2. **전역 단축키** - 기본값 Alt+Space
3. **Claude Code 채팅** - 스트리밍 응답, MCP 서버 연동
4. **시스템 프롬프트** - 커스텀 가능
5. **대화 기록** - 세션 저장/불러오기
6. **AI 알림** - 응답 완료 시 AI 생성 알림
7. **로그인 시 자동 실행**
8. **20개 언어 지원**

## 개발 명령어

```bash
pnpm dev      # 개발 서버 실행
pnpm build    # 프로덕션 빌드
pnpm typecheck # 타입 체크
```

## 핵심 파일

### electron/main.ts
- `fixPath()`: macOS Finder 실행 시 PATH 환경변수 수정
- Tray 아이콘 및 팝업 윈도우 생성
- IPC 핸들러 (claude:*, sessions:*, config:*)
- 전역 단축키 등록, 로그인 시 자동 실행

### electron/services/ClaudeService.ts
- `findClaudePath()`: 여러 경로에서 Claude CLI 탐색
- Claude Code SDK 통합
- 스트리밍 처리
- AI 알림 생성 (`generateNotification()`)
- MCP 서버 연동 (`settingSources: ['user', 'project', 'local']`)

### src/stores/chatStore.ts
Zustand 스토어. 채팅 상태, 세션 관리, 시스템 프롬프트 등 모든 상태 관리.

## 설정 저장

electron-store: `~/Library/Application Support/personal-assistant/config.json`
- globalShortcut: 전역 단축키
- systemPrompt: 시스템 프롬프트
- sessions: 대화 기록
- openAtLogin: 로그인 시 자동 실행

## 빌드 주의사항

- macOS Finder에서 앱 실행 시 PATH 문제 → `fixPath()` 함수로 해결
- MCP 서버 연동 → `settingSources` 옵션 필수
- 앱 아이콘: `resources/icon.icns` (1024x1024 기반)
