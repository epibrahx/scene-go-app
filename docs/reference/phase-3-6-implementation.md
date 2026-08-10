# SceneGo 阶段 3–6 技术实施参考文档 (Implementation Reference)

> **文档位置**：`docs/reference/phase-3-6-implementation.md`  
> **更新时间**：2026-08-10  
> **适用版本**：SceneGo iOS React Native (Expo SDK 51 / RN 0.74)  
> **核心承诺**：秒级成卡、精准表达、双语国际化 (zh-Hans/en)、安全门禁闭环、无客户端 Key 风险。

---

## 一、 系统架构全景 (System Architecture)

SceneGo 采用无导航库依赖的纯 State 驱动架构，由 `appReducer` 控制路由状态转换，`AppShell` 为统一跟视图，配套模块化 Service 与 Core Engine。

```mermaid
flowchart TD
    AppShell[AppShell.tsx] --> AppReducer[appReducer.ts State & Task Manager]
    AppShell --> Router[Route Dispatcher: home | card | presentation | camera | photoResult | country | safety | safetyDetail | settings]
    
    subgraph UI_Layer [UI 屏幕与组件]
        HomeScreen[01 HomeScreen]
        CardScreen[02 CardResultScreen]
        PresScreen[03 PresentationScreen]
        CamScreen[04 CameraScreen]
        PhotoScreen[05 PhotoResultScreen]
        CountryScreen[06 CountryPickerScreen]
        SafetyCardScreen[07 SafetyCardScreen]
        SafetyDetailScreen[08 SafetyDetailSheet]
        SettingsScreen[13 SettingsScreen]
        SafetyFAB[SafetyFAB Component]
        InputComposer[InputComposer Component]
        TtsButton[TtsButton Component]
        AsyncFeedback[AsyncFeedback Component]
    end

    subgraph Service_Layer [服务层 Services]
        TtsService[ttsService.ts]
        PermService[permissionService.ts]
        MediaLifecycle[mediaLifecycle.ts]
    end

    subgraph Core_Layer [核心逻辑 Core & Utils]
        SpeechCtrl[speechController.ts]
        AiGateway[aiGateway.ts]
        OcrPlugin[CloudVlmOcrPlugin.ts]
        ExprEngine[expressionEngine.ts]
        ImgCompress[imageCompress.ts]
        LocalRepo[localRepository.ts]
    end

    subgraph Safety_Data_Layer [安全数据门禁 Core]
        SafetyRegistry[registry.ts 26国草稿]
        PubGate[publicationGate.ts 发布门禁]
        PhoneNorm[phone.ts 号码规范化]
    end

    subgraph Gateway_Proxy [阶段 6 代理网关]
        Contract[src/contracts/aiGateway.ts]
        EdgeFunc[supabase/functions/ai-gateway]
    end

    Router --> UI_Layer
    UI_Layer --> Service_Layer
    UI_Layer --> Core_Layer
    UI_Layer --> Safety_Data_Layer
    Core_Layer --> Gateway_Proxy
```

---

## 二、 阶段 3：在线主闭环 (Online Main Loop)

### 1. 服务层 (Services)
- **`src/services/ttsService.ts`**
  - 封装 `expo-speech`。
  - `play(text, langCode)` 自动检查语言可用性 (`getAvailableVoicesAsync`)；若语言不支持，抛出 `AppError('tts')`。
  - 单例与状态监听 `onStateChange`。
  - `AppState` 自动监听：应用切入后台时静默停止播放。
- **`src/services/permissionService.ts`**
  - 统一管理 `camera`、`microphone`、`speech` 权限。
  - 返回规范化状态：`granted` | `denied` | `undetermined` | `permanentlyDenied`。
  - 自动引导用户调用 `Linking.openSettings()`。
- **`src/services/mediaLifecycle.ts`**
  - 管理拍照与语音过程中的临时文件。
  - `registerTempFile(uri)` / `cleanupAll()` 避免文件泄露。
  - `startBackgroundMonitor()`：应用进入后台时自动清理临时文件并停止 TTS/录音。

### 2. 核心模块改造 (Core Modifications)
- **`src/core/speechController.ts`**
  - 增加 `_activeSession` 单活跃会话守卫。
  - `start(locale, sessionId)` / `stop(sessionId)` / `cancel(sessionId)`。
  - 停止录音后自动等待 300ms 以捕获 final 识别事件。
  - `onPartial` / `onFinal` / `onError` 事件订阅。
- **`src/utils/aiGateway.ts`**
  - 结合 `runtimeConfig`：生产环境调用专有 HTTPS 代理 (`EXPO_PUBLIC_AI_PROXY_URL`)，无 Authorization Header（由代理添加）；开发/预览环境允许直连 OpenRouter。
  - 规范化请求 ID (`requestId`) 与日志去敏感化（只记录模型、状态码、耗时与字节数）。
  - 支持 `AbortSignal` 请求中断。
  - 错误映射：HTTP 429 映射为 `AppError('rate-limit')`，超时映射为 `AppError('timeout')`，服务端异常映射为 `AppError('server')`。
- **`src/plugins/ocr/CloudVlmOcrPlugin.ts`**
  - 透传 `AbortSignal`，对非合法 JSON 响应统一抛出 `AppError('invalid-response')`。
- **`src/utils/imageCompress.ts`**
  - 移除对小尺寸图片的早退逻辑。所有图片均经过 `ImageManipulator.manipulateAsync` 重编码为 JPEG，强制抹除 EXIF 地理位置与元数据。

### 3. 主闭环 UI 屏幕与组件
- **`src/screens/HomeScreen.tsx` (01 屏)**：主页，整合 `InputComposer` 输入/按住说话、拍照入口。首次发送前弹出 AI 服务隐私授权弹窗。
- **`src/screens/PresentationScreen.tsx` (03 屏)**：全屏大字展示表达卡目标文本，高对比度排版。
- **`src/screens/CardResultScreen.tsx` (02 屏)**：表达卡展示，支持 TtsButton 朗读、全屏大字查看、快捷回复（使用预导出的扁平卡）。
- **`src/components/InputComposer.tsx`**：文本输入与按住说话复合组件（支持 44pt 触控与实时音轨显示）。
- **`src/components/TtsButton.tsx`**：集成播放/停止切换与不可用语言警示。
- **`src/components/AsyncFeedback.tsx`**：通用异步 TaskState 反馈蒙层（加载/重试/成功）。

---

## 三、 阶段 4：相机与图片解读 (Camera & Photo Analysis)

### 1. 相机拍照流 (Camera Screen 04)
- **`src/screens/CameraScreen.tsx`**
  - 挂载时通过 `permissionService` 申请相机权限。
  - 权限拒绝时提供清晰警示、跳转设置按钮以及文字替代方案提示。
  - 拍摄后调用 `compressImage` (抹除 EXIF) → `mediaLifecycle.registerTempFile` → 携带 `photoUri` 跳转至 `photoResult` 路由。

### 2. 照片解读与表达卡生成 (Photo Result Screen 05)
- **`src/screens/PhotoResultScreen.tsx`**
  - 自动触发 `expressionEngine.processImage(photoUri)`。
  - 展示识别出的场景类型与母语描述。
  - 用户可点击"生成表达卡"将其转化为标准表达卡并存储至 `cardStackStore`。
  - 识别失败时不展示伪识别结果，提供重拍与重试选项。

---

## 四、 阶段 5：安全数据核心与管理界面 (Safety Data & Management)

### 1. 安全数据核心与门禁 (Safety Core)
- **`src/data/safety/types.ts`**：定义 `SafetyRecord`、`PublicationStatus` (`draft` | `reviewed` | `published`)、`SafetyEvidence`、`SafetyReviewer` 及视图投影 `SafetyViewProjection`。
- **`src/data/safety/registry.ts`**：26 国候选数据全量注册，初始状态一律设为 `draft`/`unverified`。
- **`src/data/safety/publicationGate.ts`**：
  - 发布条件：状态为 `published` + 处于 Production Allowlist + 至少 2 名核验人 + 至少 1 条官方证据 URL + 未过期 + 紧急号码在 90 天复核期内。
  - 视图投影 `getPublishedSafetyView`：未通过门禁（未核验/已过期）的记录，**完全剥离** `emergency` 电话号码与 `embassy` 电话字段。
- **`src/data/safety/phone.ts`**：
  - `normalizePhoneNumber`：仅保留 `+` 与数字。严格拒绝暂停符 (`,;`)、分机号 (`p/w`)、USSD (`*#`) 及非数字字符。
  - `isDialSafe`：校验号码安全度。

### 2. 双人核验规范文档
- **`docs/safety/verification/README.md`**：规定官方来源、双人复核、90/180 天时效与号码规范化标准。
- **`docs/safety/verification/TEMPLATE.md`**：逐字段核验记录模板。

### 3. 安全与设置 UI 屏幕
- **`src/screens/CountryPickerScreen.tsx` (06 屏)**：目的地国家选择与搜索。定位提示仅作为建议，需用户显式点击确认弹窗后方可切换。
- **`src/screens/SafetyCardScreen.tsx` (07 屏)**：当前目的地安全概览。未核验/过期国家展示警示文案且不呈现电话号码。
- **`src/screens/SafetyDetailSheet.tsx` (08 屏)**：
  - 详细安全指南。
  - 紧急电话拨打：**必须长按 600ms** 触发（带有 Progress 环状进度指示器）。普通短按提示"长按 600ms 拨打"，绝不触发 `Linking.openURL`。
- **`src/screens/SettingsScreen.tsx` (13 屏)**：界面语言切换 (zh-Hans/en)、目的地与目标语言切换、`CompliancePanel` 隐私合规面板、清除全部本地数据 (`clearAllLocalData`) 确认弹窗。**无任何 API Key / 模型配置入口**。
- **`src/components/SafetyFAB.tsx`**：56px 圆形悬浮安全按钮（`radii.r28`），常驻于主屏右下角，一键直达安全中心。

---

## 五、 阶段 6：代理网关与打包门禁 (Edge Proxy & Production Gate)

### 1. 共享契约 (Shared Contract)
- **`src/contracts/aiGateway.ts`**
  - 定义合法模型白名单 `MODEL_ALLOWLIST` (`openrouter/free`, `openai/gpt-4o-mini`, `openai/gpt-4o`, `anthropic/claude-3.5-sonnet`)。
  - 定义请求限制：最多 10 条消息、文本最长 8000 字符、图片 base64 上限 ~2MB、Body 上限 3MB、`max_tokens` 上限 2048。
  - 纯 TS 校验器：`validateRequest` 与 `validateBodySize`。

### 2. Deno Edge Function 代理网关
- **`supabase/functions/ai-gateway/index.ts`**
  - 仅暴露 `POST /v1/chat/completions`。
  - 服务端直接从 `Deno.env` 读取 OpenRouter Key，客户端无需传输 Key。
  - CORS 白名单校验 (`https://scenego.app`)。
  - 请求体与模型白名单严格过滤。
  - 日志绝对不记录提示词、图片、译文或 Authorization，仅留 `request_id`、安装 ID 哈希、状态码、耗时与字节数。

### 3. 打包与静态门禁
- **`app.config.ts`**：读取 `EXPO_PUBLIC_APP_ENV` 与 `EXPO_PUBLIC_AI_PROXY_URL` 注入 Expo extra。
- **`scripts/assert-production-config.ts`**：
  - 生产环境配置静态断言。
  - 检测到 `EXPO_PUBLIC_OPENROUTER_API_KEY` / `EXPO_PUBLIC_OPENAI_API_KEY` 非空即中断构建。
  - 强制代理 URL 必须为 HTTPS，禁止 `openrouter.ai` 直连或 `localhost`。
- **`scripts/scan-production-bundle.ts`**：
  - 生产环境导出 Bundle 扫描。
  - 正则检测 Bundle 产物中是否内联包含密钥特征 (`sk-or-`, `sk-`)。仅输出 match count 与 pass/fail，不打印敏感内容。
- **`eas.json`**：配置 development、preview、production 构建环境，生产环境启用配置断言。

---

## 六、 安全与合规红线对照表 (Redlines Compliance)

| 红线要求 | 实施机制与代码实现 | 验证状态 |
|---|---|---|
| **不提交/不部署** | 未执行 `git commit` / `push` / `deploy` | ✅ 符合 |
| **不新增依赖** | 未修改 `package.json` 中的 `dependencies` | ✅ 符合 |
| **不做离线功能** | 删去所有离线包、离线识别、场景包下载逻辑 | ✅ 符合 |
| **生产无客户端 Key** | `assert-production-config.ts` + `runtimeConfig.ts` + `aiGateway.ts` 三重拦截 | ✅ 符合 |
| **未核验安全隐去号码** | `publicationGate.ts` `getPublishedSafetyView` 物理剥离 `emergency`/`embassy` 字段 | ✅ 符合 |
| **防误触长按拨号** | `SafetyDetailSheet.tsx` 动态监听 `onPressIn`，满 600ms 才允许调 `openURL('tel:')` | ✅ 符合 |
| **隐私保护 (去 EXIF)** | `imageCompress.ts` 强制使用 `SaveFormat.JPEG` 重编码擦除 GPS 信息 | ✅ 符合 |
| **日志安全** | `aiGateway.ts` 与 Deno Edge 代理抹除提示词/图片/译文日志 | ✅ 符合 |

---

## 七、 自动化测试与质量标准

全量测试跑通：
- `bun test`: 45 pass, 0 fail (10 test files)
- `./node_modules/.bin/tsc --noEmit`: Exit code 0 (0 errors)

```
Test Suites:
- scripts/assert-production-config.test.ts (3 tests)
- src/app/appReducer.test.ts (4 tests)
- src/config/runtimeConfig.test.ts (2 tests)
- src/contracts/aiGateway.test.ts (11 tests)
- src/storage/localRepository.test.ts (4 tests)
- src/errors/retryPolicy.test.ts (3 tests)
- src/i18n/i18n.test.ts (2 tests)
- src/data/safety/publicationGate.test.ts (9 tests)
- src/data/safety/phone.test.ts (4 tests)
- src/data/safety/candidates.test.ts (3 tests)
```
