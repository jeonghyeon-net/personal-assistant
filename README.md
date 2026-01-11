# PA (Personal Assistant)

macOS 메뉴바에서 Claude Code와 대화할 수 있는 앱

## 기능

- 메뉴바 트레이 아이콘 클릭으로 채팅창 열기/닫기
- Claude Code SDK 기반 스트리밍 응답
- MCP 서버 연동 지원
- Ultrathink (확장 사고) 모드
- 세션 히스토리 저장
- 커스텀 시스템 프롬프트
- 전역 단축키 설정
- 로그인 시 자동 실행
- 20개 언어 지원

## 기술 스택

- Electron 34
- React 19 + TypeScript
- Vite + vite-plugin-electron
- Zustand (상태 관리)
- styled-components
- @anthropic-ai/claude-agent-sdk
- react-markdown + react-syntax-highlighter

## 개발

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 빌드
pnpm build
```

## 빌드 결과물

```
release/PA-1.0.0-arm64.dmg
release/PA-1.0.0-arm64-mac.zip
```

## 요구사항

- macOS 10.12+
- Claude Code CLI 설치 필요 (`npm install -g @anthropic-ai/claude-code`)
