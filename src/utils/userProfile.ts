/**
 * 用户档案：国别（国籍）+ 语言。SceneGo 面向各国人士，档案决定：
 * - 使领馆信息展示（本国驻当地领事保护；非中国籍暂以提示代替）
 * - 未来 UI 国际化的语言偏好
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export { LANGUAGE_OPTIONS, NATIONALITY_OPTIONS } from '../data/countries';

const KEY = '@scenego/user-profile';

export interface UserProfile {
  /** 国籍（ISO 3166-1 alpha-2） */
  nationality: string;
  /** 语言（BCP-47） */
  language: string;
  /** 过敏原（中文，如 ['花生']）；目前无写入 UI，仅供药店分步卡读取与未来「个人档案」使用 */
  allergens?: string[];
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.nationality === 'string' && typeof parsed.language === 'string') {
      return parsed as UserProfile;
    }
  } catch {
    // 解析失败按未设置处理
  }
  return null;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[UserProfile] save failed:', err);
  }
}
