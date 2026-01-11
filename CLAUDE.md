# Personal Assistant - macOS 메뉴바 Claude Code 채팅 앱

## 프로젝트 개요
macOS 메뉴바에 상주하는 Claude Code 기반 개인 비서 앱입니다.

## 기술 스택
- **Runtime**: Electron 34+
- **Build**: vite-plugin-electron
- **UI**: React 19 + TypeScript
- **State**: Zustand
- **Styling**: styled-components
- **Claude**: @anthropic-ai/claude-agent-sdk

## 프로젝트 구조
```
personal-assistant/
├── electron/
│   ├── main.ts                 # Tray, Window, IPC 핸들러
│   ├── preload.ts              # Context bridge
│   ├── systemPrompt.ts         # 기본 시스템 프롬프트 (별도 파일)
│   └── services/
│       └── ClaudeService.ts    # Claude SDK 통합
├── src/
│   ├── main.tsx                # React 진입점
│   ├── App.tsx                 # 메인 컴포넌트 (헤더, 뷰 전환)
│   ├── components/
│   │   ├── ChatContainer.tsx   # 채팅 레이아웃
│   │   ├── MessageList.tsx     # 메시지 목록 (react-virtuoso)
│   │   ├── MessageItem.tsx     # 개별 메시지 렌더링
│   │   ├── MessageInput.tsx    # 입력창
│   │   ├── SessionList.tsx     # 대화 기록 목록
│   │   └── SettingsContainer.tsx # 설정 (단축키, 시스템 프롬프트)
│   ├── stores/
│   │   └── chatStore.ts        # Zustand 상태 관리
│   ├── hooks/
│   │   └── useStreamHandler.ts # 스트림 이벤트 핸들러
│   └── types/
│       └── index.ts            # 타입 정의
├── vite.config.ts
└── package.json
```

## 주요 기능
1. **메뉴바 트레이 아이콘** - 클릭 시 팝업창 열림/닫힘
2. **전역 단축키** - 기본값 Alt+Space, 설정에서 변경 가능
3. **Claude Code 채팅** - 스트리밍 응답 지원
4. **시스템 프롬프트** - electron/systemPrompt.ts에서 관리
5. **대화 기록** - electron-store로 세션 저장/불러오기
6. **제목 자동 생성** - 첫 메시지 기반 Claude로 제목 생성
7. **OS 알림** - 응답 완료 시 알림
8. **ESC 키로 중지** - 스트리밍 중 ESC로 중단

## 개발 명령어
```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
```

## 주요 파일 설명

### electron/systemPrompt.ts
기본 시스템 프롬프트가 정의된 파일. 이 파일을 수정하면 기본 AI 성격이 변경됨.
**주의**: 이 파일 수정 후 앱 재시작 필요.

### electron/main.ts
- Tray 아이콘 및 팝업 윈도우 생성
- IPC 핸들러 (claude:execute, sessions:*, config:* 등)
- 전역 단축키 등록

### src/stores/chatStore.ts
Zustand 스토어. 채팅 상태, 세션 관리, 시스템 프롬프트 등 모든 상태 관리.

### electron/services/ClaudeService.ts
Claude Code SDK 통합. 쿼리 실행, 스트리밍, 제목 생성, 세션 관리.

## 설정 저장 위치
electron-store 사용: `~/Library/Application Support/personal-assistant/config.json`
- globalShortcut: 전역 단축키
- systemPrompt: 사용자 정의 시스템 프롬프트
- sessions: 저장된 대화 기록

## 개발 시 주의사항
- electron/ 폴더 파일 수정 시 앱 재시작 필요 (watch 비활성화됨)
- src/ 폴더 파일은 HMR로 자동 반영
- 새 대화 시작 시 Claude 세션도 리셋됨 (시스템 프롬프트 재적용)
