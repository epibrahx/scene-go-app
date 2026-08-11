/**
 * ScenarioResult → 表达卡 CardData 转换（纯函数，可单测）
 *
 * 动态卡优先使用 VLM 输出的当地语言字段；缺失时逐级降级，保证卡面不为空。
 * 成卡时一并预生成回复选项（SCN-27：点选「直出 replyCard」，秒级出卡）。
 */
import { ScenarioResult } from '../plugins/types';
import { CardData, ReplyOption } from '../core/types';

/**
 * recommendedPhrases「当地语言短语 (中文翻译)」→ 建议回复选项。
 * 每条拆出中文做点选 label、外语做回卡 targetText（扁平结构，无嵌套 reply）。
 * 无中文翻译的短语无法构成点选文案，跳过。
 */
export function buildReplyOptions(s: ScenarioResult): ReplyOption[] {
  if (!s.recommendedPhrases?.length) return [];
  const opts: ReplyOption[] = [];
  for (const phrase of s.recommendedPhrases.slice(0, 2)) {
    const m = phrase.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (!m) continue;
    const foreign = m[1].trim();
    const native = m[2].trim();
    opts.push({
      label: native,
      replyCard: {
        id: `rep-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
        categoryTag: 'REPLY',
        locationName: s.title || '回复',
        title: native,
        targetText: foreign,
        phonetic: '',
        subText: '',
        localTip: '',
        languageCode: s.languageCode || 'zh-CN',
        role: 'reply',
      },
    });
  }
  return opts;
}

export function scenarioToCard(s: ScenarioResult, location: string, role: 'ask' | 'reply' = 'ask'): CardData {
  const fallbackText =
    s.recommendedPhrases?.[0]?.split('(')[0]?.trim() || s.translatedText || '请帮我';
  const replyOptions = buildReplyOptions(s);

  return {
    id: `sc-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    categoryTag: s.category || 'SCENE',
    locationName: location,
    title: s.title || '场景表达',
    targetText: s.targetText || fallbackText,
    phonetic: s.phonetic || '',
    subText: s.subText || '',
    localTip: s.localTip || s.tips?.[0] || '',
    languageCode: s.languageCode || 'zh-CN',
    role,
    // 备用表达与提示列表：VLM 产物透传到卡面（此前被丢弃）
    phrases: s.recommendedPhrases?.length ? s.recommendedPhrases.slice(0, 3) : undefined,
    tips: s.tips?.length ? s.tips.slice(0, 3) : undefined,
    // 建议回复（成卡时预生成，点选直出）
    ...(replyOptions.length ? { reply: { label: '你可以这样接', options: replyOptions } } : {}),
  };
}
