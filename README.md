# SceneGo

On-demand, context-aware travel assistance for overseas trips. Point the camera at a menu, sign, or ticket machine — or say what you need — SceneGo matches the scene and hands you a high-contrast local-language flash card to show a driver, cashier, or police officer.

Built with Expo / React Native. Client-only: no backend required.

## Features

- **Scene snapshot analysis** — capture a photo, cloud vision model interprets the scene (menu, signboard, station, store) and returns a structured interpretation with tips and useful phrases.
- **Multi-turn follow-up** — keep asking about the same photo (prices, allergens, directions). Conversations persist locally and can be resumed later.
- **Ready-made flash cards** — high-contrast, large-type cards for high-frequency needs (taxi by meter, allergen warnings, tax refund, SOS), with local-language TTS.
- **Realtime speech transcription** — native iOS `SFSpeechRecognizer` bridge (Expo Local Module) with live transcript banner and auto-archiving to notes.
- **Quick notes** — vouchers, Wi-Fi passwords, refund numbers; persist across launches, one-tap copy, fullscreen large-type display, and voice-memo auto-archive.
- **Session history** — past snapshot conversations are saved locally (AsyncStorage) and restorable.
- **Cloud recognition** — OpenRouter vision models return structured scene and expression-card data; failures surface as typed errors.

## Screens

视觉稿由 [Pencil](https://pen.dev) 设计（`docs/reference/DESIGN-v2.1.pen`）

| | | | |
|---|---|---|---|
| ![01 对话页](docs/reference/screens/SCREEN-01-dialog.png) | ![02 全屏大字卡](docs/reference/screens/SCREEN-02-flash-card.png) | ![03 卡栈](docs/reference/screens/SCREEN-03-card-stack.png) | ![04 笔记](docs/reference/screens/SCREEN-04-notes.png) |
| 01 对话页 | 02 全屏大字卡 | 03 卡栈 | 04 笔记 |
| ![05 更多](docs/reference/screens/SCREEN-05-more.png) | ![06 相机取景](docs/reference/screens/SCREEN-06-camera.png) | ![07 安全卡](docs/reference/screens/SCREEN-07-safety-card.png) | ![08 安全详情](docs/reference/screens/SCREEN-08-safety-detail.png) |
| 05 更多 | 06 相机取景 | 07 安全卡 | 08 安全详情 |
| ![09 国家选择](docs/reference/screens/SCREEN-09-country-select.png) | ![10 位置切换](docs/reference/screens/SCREEN-10-switch-prompt.png) | ![11 会话历史](docs/reference/screens/SCREEN-11-session-history.png) | ![12 API 日志](docs/reference/screens/SCREEN-12-api-log.png) |
| 09 国家选择 | 10 位置切换 | 11 会话历史 | 12 API 日志 |
| ![13 引擎设置](docs/reference/screens/SCREEN-13-engine-settings.png) | | | |
| 13 引擎设置 | | | |

## Architecture

```
┌────────────────────────────────────────────┐
│ App (Expo / React Native)                  │
│  App.tsx (启动壳: 字体 + 引擎初始化)        │
│  └── MainPage (单一随身工具)              │
│      ├── ActionCard (外语上/母语下+PLAY)   │
│      ├── InsightView (照片+横滑表达卡)     │
│      ├── PresentationModal (全屏展示)      │
│      └── expressionEngine ── plugins/       │
│          └── CloudVlmOcrPlugin (OpenRouter) │
│  modules/scenego-speech (Swift,             │
│      SFSpeechRecognizer Local Module)       │
└────────────────────────────────────────────┘
```

Recognition pipeline: snapshot → cloud recognition → structured `ScenarioResult` → expression card (+ insight phrase row).

## Quick Start

Requirements: Node 18+, Bun or npm, Xcode (iOS) with CocoaPods.

```bash
# install dependencies
bun install            # or: npm install

# iOS (native module autolinking, builds dev client)
npx expo run:ios

# or just Metro for Expo Go / web
npx expo start
```

### Environment variables

Create a `.env` file (`.env.example` committed as a template):

```env
# OpenRouter API key for cloud vision recognition in all environments
EXPO_PUBLIC_OPENROUTER_API_KEY=sk-or-v1-...
EXPO_PUBLIC_AI_GATEWAY_URL=https://openrouter.ai/api/v1/chat/completions
```

The API key and gateway URL are supplied at build time. Configure `EXPO_PUBLIC_OPENROUTER_API_KEY` as an EAS secret for preview and production builds; do not commit the key to the repository. The gateway URL defaults to OpenRouter and can be overridden with `EXPO_PUBLIC_AI_GATEWAY_URL` when needed.

## Project Layout

```text
scenego/
├── App.tsx                     # Entry: fonts + engine init, renders MainPage
├── app.json                    # Expo config, permissions, plugins
├── modules/
│   └── scenego-speech/         # Expo Local Module (Swift)
│       ├── expo-module.config.json
│       ├── ios/SceneGoSpeech.podspec
│       └── ios/SceneGoSpeechRecognizer.swift
├── src/
│   ├── components/             # MainPage, ActionCard, InsightView,
│   │                           # PresentationModal, SettingsSheet
│   ├── plugins/                # Cloud recognition integration
│   │   ├── PluginManager.ts    # cloud recognition facade
│   │   └── ocr/
│   └── utils/                  # NativeSpeech, SessionStore, NoteStore,
│                               # SecureConfig (build env), ApiLogger
├── ios/                        # Expo prebuild output (custom native)
├── docs/                       # PRD, architecture, strategy
└── .env.example                # env template
```

## Native Module

`SceneGoSpeechRecognizer` is an **Expo Local Module** (`modules/scenego-speech`), auto-discovered by autolinking — no manual Xcode project edits required. It bridges `SFSpeechRecognizer` + `AVAudioEngine` for realtime dictation, with locale fallback (zh-CN → zh-* → en-US) and audio-session lifecycle management.

## Tech Stack

- Expo SDK 51 / React Native 0.74 (TypeScript)
- expo-modules-core (Swift local module), expo-camera, expo-speech, expo-location, expo-file-system
- AsyncStorage (sessions & notes)
- OpenRouter chat completions API for vision

## Contributing

PRs welcome. Keep changes focused, run `npx tsc --noEmit` before submitting, and test on both simulator and a physical device where possible (speech recognition differs).

## License

MIT
