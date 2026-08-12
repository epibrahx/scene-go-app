# SceneGo 工程基线收口与 SDK 57 升级记录

> 记录 2026-08-12 本次工作会话：从工程阻塞分析到 Expo SDK 57 + CNG 升级的全过程与决策。
> 状态：代码已提交并推送至 `feature/audit-project-blockers`；真机验证因无开发者账号/设备不可用暂停。

## 一、背景与目标

原项目处于多次重构后的混合状态：

- Expo SDK 51 + React Native 0.74，与本机 Xcode 26.6 不兼容
- 同时存在 DESIGN-v2.1 / DESIGN-v3.0 / Roadmap"空壳"描述，版本基线不统一
- 生产 AI 链路未闭环（代理分支地址为空）
- 存在语音、相机、会话持久化等核心交互缺陷

本次目标：收口工程基线、升级 SDK、切换 CNG、修复核心链路。

## 二、关键决策

| # | 决策 | 理由 |
|---|---|---|
| 1 | 生产也直连 OpenRouter | 用户拍板，统一 AI 链路，移除 Supabase 代理分支 |
| 2 | 直接升级 Expo SDK 57（跳过逐版本） | 用户拍板；本机 Xcode 26.6 需 SDK≥54，SDK 57 是当前最新 |
| 3 | TypeScript 升级到 7.0 | 用户拍板；原生编译器，性能提升约 10 倍 |
| 4 | 彻底切换 CNG（Continuous Native Generation） | 删除 `ios/` 与 `app.config.ts`，`app.json` 成为唯一配置来源 |
| 5 | 删除原生 Vision 分类器功能 | `SceneGoVisionClassifier` 为旧 RCT 模块，`src/` 零引用，不迁移 |
| 6 | Ruby/CocoaPods 纳入 mise 管理 | 项目工具链可复现，对齐 Expo EAS 镜像（Ruby 3.2 / CocoaPods 1.16.2） |
| 7 | 真机验证不采用云端构建 | 用户拍板：只在本地测试验证 |

## 三、环境变更

- 新增项目级 `.mise.toml`：node 22 / bun 1.3.14 / ruby 3.2.11
- mise 管理 Ruby 3.2.11 与 CocoaPods 1.16.2（原 Homebrew ruby 4.0 / pod 1.17 弃用）
- `.gitignore` 改为 `/ios/`、`/android/` 锚定根目录整体忽略（避免误伤 `modules/scenego-speech/ios`）

## 四、依赖升级

| 包 | 旧 | 新 |
|---|---|---|
| expo | ~51.0.0 | ^57.0.12 |
| react-native | 0.74.5 | 0.86.2 |
| react / react-dom | 18.2.0 | 19.2.3 |
| react-native-web | ~0.19.10 | ^0.21.2 |
| typescript | ~5.3.3 | ~6.0.3 → 7.0.2 |
| @types/react | ~18.2.45 | ^19 |
| 各 expo-* 模块 | 51 系 | 57 系（camera/file-system/font/image-manipulator/location/speech/status-bar/dev-client/metro-runtime/async-storage/splash-screen） |

配置调整：

- 删除 `app.config.ts`，`app.json` 为唯一来源
- `splash` 字段迁移为 `expo-splash-screen` 插件
- 新增 `expo-status-bar` 插件
- `package.json` 增加 `expo.install.exclude: ["typescript"]`，避免 TS 7.0 版本校验告警

## 五、代码修复

1. **AI 网关收口**：`src/utils/aiGateway.ts` 移除生产代理分支，开发/生产统一用 `EXPO_PUBLIC_OPENROUTER_API_KEY` 直连 OpenRouter；网关地址 `EXPO_PUBLIC_AI_GATEWAY_URL` 可覆盖，代码保留默认值。
2. **语音转写**：`useHoldToSpeak.ts` 补 `onPartial` 订阅；`speechController.stop` 后延长等待 final 结果（900ms），避免松开误判为空。
3. **相机反馈**：`CameraScreen.tsx` 的 `busyRef` 改为 `useState`，拍照中显示 loading 并禁用快门。
4. **会话持久化**：`PhotoResultScreen.tsx` 图片识别成功后调用 `chatSessionStore.start()` 初始化会话。
5. **回复卡重复**：`CardResultScreen.tsx` 修复 reply 卡同时出现在"我方/对方"双气泡的问题。
6. **语音崩溃**：`SceneGoSpeechRecognizer.swift` 不依赖 `inputNode.outputFormat(forBus:0)`，改用 `audioSession` 有效采样率构造确定 mono Float32 格式，规避 `installTap` 的 `IsFormatSampleRateAndChannelCountValid` 崩溃（iOS 26 模拟器复现）。
7. 图标 `icon.png` / `adaptive-icon.png` 修正为正方形 295×295。

## 六、验证结果

| 项 | 结果 |
|---|---|
| `expo-doctor` | 20/20 通过（网络可达时） |
| `npm run check` | 通过（tsc + 自检） |
| `expo export --platform ios` | 通过 |
| `expo run:ios`（模拟器 iPhone 17 Pro） | 构建成功，0 error |
| TypeScript 7.0.2 `tsc --noEmit` | 通过 |

## 七、提交记录

分支 `feature/audit-project-blockers`（已 push 到 `origin`）：

```text
94903c1b  docs(readme): 同步 SDK 57 / CNG / mise 工具链说明
aa8648f5  fix(speech): 规避 installTap 无效音频格式崩溃
d8497a24  chore(git): CNG 模式整体忽略 ios/ 与 android/ 生成产物
bd671c48  build(expo): 升级 Expo SDK 57 并切换 CNG 持续原生生成
1cef11a6  fix(core): 收口 OpenRouter 网关配置并修复核心交互链路
```

> 注：1cef11a6 同时记录了此前已暂存的 ios/ 删除（与核心修复同批提交）。

## 八、待办 / 阻塞

### 阻塞：真机验证

- 本机无 Apple 开发者账号（付费计划），真机签名受限
- 真机在 `devicectl` 中状态为 `unavailable`（未信任/未解锁），Xcode 未将其列为构建 destination
- 待办：手机解锁并"信任此电脑"后，配置 `DEVELOPMENT_TEAM` 个人团队自动签名，重试 `expo run:ios --device`
- 语音识别（麦克风）必须真机验证，模拟器无麦克风

### 待办

- 合并回 `develop`：创建 PR（feature → develop，squash merge）。当前 `GH_TOKEN` 缺少 `createPullRequest` 权限，需手动在网页创建：
  `https://github.com/epibrahx/scene-go-app/compare/develop...feature/audit-project-blockers?expand=1`
- 生产配置 `EXPO_PUBLIC_OPENROUTER_API_KEY`：本地 `.env` 未提交，EAS 构建需配置 secret（本次未云端构建）

## 九、遗留说明

- 远程仓库实际为 `epibrahx/scene-go-app`（AGENTS.md 记载的 `dotsoy/scene-go-app` 已过时，以 `git remote -v` 为准）
- TS 7.0 超出 Expo 官方声明支持范围（官方建议 ~6.0.3），已用 `expo.install.exclude` 排除校验；本仓库已验证可用
