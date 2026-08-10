import { MenuData } from '../core/types';

export interface OcrResult {
  rawText: string;
  lines: string[];
  confidence?: number;
}

export interface ScenarioResult {
  title: string;
  category: string;
  originalText: string;
  translatedText: string;
  tips: string[];
  recommendedPhrases: string[];
  /** 表达卡字段（动态卡）：当地语言大字 + 发音 + 惯例提示，由 VLM 推断式生成 */
  targetText?: string;
  /** 当地语言发音的拉丁转写 */
  phonetic?: string;
  /** 补充说明（当地语言或英文） */
  subText?: string;
  /** 中文当地惯例提示（小费/计费/注意事项） */
  localTip?: string;
  /** BCP-47 语言代码（如 th-TH / ja-JP / en-US） */
  languageCode?: string;
  /** 菜单照片：结构化菜单（无则 undefined，走普通解读） */
  menu?: MenuData | null;
}

export interface OcrPlugin {
  id: string;
  name: string;
  description: string;
  recognizeText(imageUri: string, location?: string): Promise<OcrResult>;
}

/** 多轮对话中的一轮问答（供云端 VLM 追问会话使用） */
export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}
