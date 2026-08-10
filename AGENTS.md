# AGENTS.md — scenego 项目约定（AI Agent 必读）

> 本文件是仓库内所有 AI 协作工具（Claude Code、Cursor、Copilot、Oh My Pi 等）与人类协作者的**唯一权威约定**。
> 开始任何改动前先读本文件；提交/PR 前逐项对照「完成定义」。
> 其他工具特定配置（CLAUDE.md、.cursor/rules 等）只允许引用本文件，禁止另立规则。

## 项目

- Expo / React Native 应用（TypeScript），iOS + Android，云端 AI + iOS 原生语音识别
- 提交信息使用 **中文描述** 的 Conventional Commits，沿用仓库现有风格
- 远程仓库：`dotsoy/scene-go-app`

## 工作流：Git Flow（强制）

| 分支 | 职责 | 从哪来 | 合到哪 | 合并策略 |
|---|---|---|---|---|
| `main` | 生产可发布状态 | — | 只接受 release/hotfix 合入 | merge commit |
| `develop` | 集成开发主线 | main | 接受 feature 合入 | squash merge |
| `feature/<scope>-<desc>` | 新功能/修复开发 | develop | develop | squash merge |
| `release/vX.Y.Z` | 发版准备 | develop | main + develop | merge commit |
| `hotfix/vX.Y.Z` | 生产紧急修复 | main | main + develop（**必须双合**） | merge commit |

## 分支规则（必须）

- 新功能/修复一律从 `develop` 切出，**禁止直接从 main 切功能分支**
- 命名：`feature/<scope>-<desc>`、`bugfix/<desc>`、`hotfix/vX.Y.Z-<desc>`、`release/vX.Y.Z`，小写短横线分隔，可含版本号（`v1.2.0`）与 issue 号（如 `ORD-123`）
- 禁止直接 push `main`/`develop`；一律 PR + review
- 分支短命（原则上 < 3 天），超期先同步 develop 再继续

## 提交规范（必须）

- Conventional Commits，中文描述：`type(scope): 描述`
- 例：`fix(ui): 修复底部栏 SafeArea 黑条`
- 合法 type：`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`
- 一条提交只做一件事；写「为什么」，不只写「做了什么」

## 合并策略（必须）

- feature → develop：**squash merge**，保持 develop 线性
- release → main：merge commit
- hotfix：先合 main 并打 tag，**再回合 develop**，禁止漏合
- 禁止 rebase 共享分支（develop / main）

## 版本管理

- 语义化版本 MAJOR.MINOR.PATCH，tag 格式 `vX.Y.Z`
- 发版流程：develop → `release/vX.Y.Z` → 测试 → 合 main → tag `vX.Y.Z` → 回合 develop

## 完成定义（提交/PR 前逐项检查）

- [ ] 分支从 develop 切出，命名符合规范
- [ ] 提交信息符合 Conventional Commits（中文描述）
- [ ] CI（分支名 + 提交信息校验）通过
- [ ] 已通过 review
- [ ] 若是 hotfix：已确认双合 main + develop 的计划
