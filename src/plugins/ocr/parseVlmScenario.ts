/**
 * VLM 返回文本 → ScenarioResult 解析（纯函数，无原生依赖，可单测）。
 * Malformed responses return null so callers can surface a typed cloud error.
 */
import { ScenarioResult } from '../types';
import { MenuData, MenuDish } from '../../core/types';

/** 尝试从云端 VLM 原始返回文本中解析出 ScenarioResult JSON */
export function parseVlmScenarioResult(rawText: string): ScenarioResult | null {
  if (!rawText || rawText.trim().length === 0) return null;

  /** VLM 菜单字段 → MenuData；结构不合法返回 undefined（不影响整卡解读） */
  const parseMenu = (obj: Record<string, unknown> | null | undefined): MenuData | undefined => {
    if (!obj || typeof obj !== 'object') return undefined;
    const dishList = (arr: unknown): MenuDish[] => {
      if (!Array.isArray(arr)) return [];
      const out: MenuDish[] = [];
      for (const d of arr) {
        if (!d || typeof d !== 'object') continue;
        const item = d as Record<string, unknown>;
        if (typeof item.zh !== 'string' || typeof item.en !== 'string' || typeof item.th !== 'string') continue;
        out.push({
          zh: item.zh,
          en: item.en,
          th: item.th,
          price: typeof item.price === 'string' ? item.price : '',
          spice: typeof item.spice === 'string' ? item.spice : '无辣',
          signature: item.signature === true,
          allergens: Array.isArray(item.allergens)
            ? (item.allergens.filter((a): a is string => typeof a === 'string') as string[])
            : undefined,
        });
      }
      return out;
    };
    const signature = dishList(obj.signature).slice(0, 3);
    const dishes = dishList(obj.dishes).slice(0, 6);
    if (signature.length === 0 && dishes.length === 0) return undefined;
    const warn = typeof obj.allergenWarn === 'string' && obj.allergenWarn.trim()
      ? obj.allergenWarn.trim()
      : undefined;
    return { signature, dishes, allergenWarn: warn };
  };

  try {
    let jsonStr = rawText;
    const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1];

    const obj = JSON.parse(jsonStr.trim());
    if (obj.title || obj.translatedText) {
      return {
        title: obj.title || '场景解读',
        category: obj.category || 'SCENE',
        originalText: rawText,
        translatedText: obj.translatedText || rawText,
        tips: Array.isArray(obj.tips) ? obj.tips : ['来自场景图像分析'],
        recommendedPhrases: Array.isArray(obj.recommendedPhrases)
          ? obj.recommendedPhrases
          : [],
        // 表达卡字段（动态卡路径）：模型可能省略，此处可选透传
        targetText: obj.targetText,
        phonetic: obj.phonetic,
        subText: obj.subText,
        localTip: obj.localTip,
        languageCode: obj.languageCode,
        // 菜单解读：结构不合法时 undefined（走普通解读）
        menu: parseMenu(obj.menu),
      };
    }
  } catch {
    return null;
  }

  return null;
}
