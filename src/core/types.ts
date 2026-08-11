/**
 * 核心层共享类型（与 UI 无关）。
 * 表达卡、会话、状态数据在此定义，UI 组件从本层引用（不再反向依赖组件）。
 */

/** 表达卡（递卡展示的核心数据） */
export interface CardData {
  id: string;
  categoryTag: string;
  locationName: string;
  title: string;
  targetText: string;
  phonetic: string;
  /** 补充说明/服务语句 */
  subText: string;
  localTip: string;
  languageCode: string;
  badgeColor?: string;
  /** 备用表达短语（当地语言 (中文翻译)），点击可朗读 */
  phrases?: string[];
  /** 出行提示列表（LOCAL PROTOCOL 展开） */
  tips?: string[];
  /** 来源快照会话 id：卡面提供「AI 解读」入口 */
  sessionId?: string;
  /** 安全卡专属：一键拨打号码（警察/救护/火警/旅游警察） */
  dials?: { num: string; label: string }[];
  /** 多步骤卡（一卡全览）：点步骤可放大为全屏大字 */
  steps?: CardStep[];
  /** 一卡全览引导语（如「全部步骤一张卡 · 点任意步骤可放大」） */
  stepsLead?: string;
  /** 顶行右侧胶囊文字（如「一卡全览」/「3 步一张卡」） */
  allPillText?: string;
  /** 全览卡底部回应选项（听完对方说话后选择） */
  reply?: { label: string; options: ReplyOption[] };
  /** 卡来源：ask=我的表达（generateCard），reply=对方回话（replyToUtterance/建议回复直出） */
  role?: 'ask' | 'reply';
}

/** 多步骤卡中的一步（打车/药店等协商流程） */
export interface CardStep {
  tag: string;
  /** 令牌色：#38bdf8 / #facc15 / #81C784 */
  tagColor: string;
  /** 当地语言大字 */
  targetText: string;
  /** 拉丁转写 */
  phonetic?: string;
  /** 中文补充（含翻译） */
  supplement?: string;
  /** 协商筹码 chips（如「打表计费」/「不走高速」） */
  chips?: { label: string }[];
}

/** 全览卡回应选项（选中后直出回卡，成卡时已预生成 replyCard） */
export interface ReplyOption {
  /** 点选显示的中文短句（如「好的，谢谢」） */
  label: string;
  /** 预生成的回卡：扁平结构（无嵌套 reply），防递归 */
  replyCard: Omit<CardData, 'reply'>;
}

/** 菜单解读：VLM 结构化菜单条目 */
export interface MenuDish {
  zh: string;
  en: string;
  /** 当地语言菜名（出卡必用） */
  th: string;
  price: string;
  spice: string;
  signature?: boolean;
  allergens?: string[];
}

export interface MenuData {
  signature: MenuDish[];
  allergenWarn?: string;
  dishes: MenuDish[];
}

/**
 * V2 对话流消息（UI 渲染模型）。
 * 表达卡消息携带 CardData，与卡栈（cardStackStore）同源。
 */
export interface ChatMessage {
  id: string;
  kind: 'user' | 'assistant' | 'card' | 'system';
  /** 文本内容（user/assistant/system 消息） */
  content?: string;
  /** kind=assistant 解读消息的照片缩略 */
  imageUri?: string;
  /** kind=card：直接渲染表达卡（与卡栈共享数据源） */
  card?: CardData;
  /** kind=assistant：菜单解读面板数据（VLM 结构化菜单） */
  menu?: MenuData;
  createdAt: number;
}
