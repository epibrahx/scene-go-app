/** 安全数据核心类型定义 */
import type { CountrySafetyCandidate } from './candidates';

export type PublicationStatus = 'draft' | 'reviewed' | 'published';

export interface SafetyEvidence {
  /** 官方来源 URL */
  url: string;
  /** 页面标题 */
  title: string;
  /** 访问日期 ISO string */
  accessDate: string;
  /** 归档文件哈希（可选） */
  hash?: string;
}

export interface SafetyReviewer {
  name: string;
  date: string;
}

export interface SafetyRecord extends CountrySafetyCandidate {
  publicationStatus: PublicationStatus;
  /** 核验通过时间 ISO string，null 表示未核验 */
  verifiedAt: string | null;
  /** 过期时间 ISO string，null 表示未设定 */
  expiresAt: string | null;
  /** 核验人列表，至少 2 人才可发布 */
  reviewers: SafetyReviewer[];
  /** 官方证据 URL 列表 */
  evidenceUrls: SafetyEvidence[];
}

/** 安全视图投影：未通过发布门禁时剥离号码字段 */
export interface SafetyViewProjection {
  code: string;
  nameZh: string;
  nameEn: string;
  langCode: string;
  publicationStatus: PublicationStatus;
  /** 仅已发布时有值 */
  emergency?: SafetyRecord['emergency'];
  /** 仅已发布时有值 */
  embassy?: string;
  tipping: string;
  voltage: string;
  currency: string;
  water: string;
  scams: string[];
  sos: { local: string; phonetic: string };
}
