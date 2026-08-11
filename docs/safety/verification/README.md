# 安全数据核验流程

## 核验标准
每个国家的安全数据必须满足以下条件才能发布：

1. **官方证据**：每个字段至少一条官方来源 URL
2. **双人复核**：至少 2 名独立核验人
3. **时效要求**：
   - 紧急号码/使馆电话：90 天复核期
   - 其他字段（惯例/货币/电压等）：180 天复核期
4. **号码规范**：所有电话号码必须通过 `normalizePhoneNumber()` 校验
5. **Production Allowlist**：国家代码必须在生产白名单中

## 核验流程
1. 第一核验人填写 `verification/<ISO>.md`（使用 TEMPLATE.md）
2. 第二核验人独立复查所有号码、国家码、tel: 规范化、时效与中英含义
3. 双方留下姓名和日期
4. 争议项不发布
5. 代码 review 不替代内容复核

## 发布状态
- `draft`：初始状态，所有新增国家
- `reviewed`：已核验但未上线
- `published`：已核验且在 production allowlist 中

## 过期处理
- CI 在到期前告警
- 到期后 production test 失败
- 自动 gate 下线（canPublishSafety 返回 false）
- 每国可独立发布/撤回
