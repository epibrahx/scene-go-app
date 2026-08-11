/**
 * 纯逻辑回归测试（无 RN 依赖模块）：bun run scripts/logic-selftest.ts
 * 覆盖：VLM 解析 / 卡构建降级 / 横滑短语解析 / 国家安全数据完整性。
 * 修改这些模块或内容数据前必跑；全绿才可提交。
 */
import { parseVlmScenarioResult } from '../src/plugins/ocr/parseVlmScenario';
import { scenarioToCard } from '../src/utils/cardBuilder';
import { toPhraseCards } from '../src/utils/cardPhrases';
import { COUNTRY_SAFETY } from '../src/data/countrySafety';

let failed = 0;
function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

// ── parseVlmScenarioResult（VLM 返回 → ScenarioResult）──
console.log('── parseVlmScenarioResult ──');
const full = parseVlmScenarioResult(JSON.stringify({
  title: '泰式海鲜餐厅菜单',
  category: 'RESTAURANT',
  translatedText: '菜单解读',
  tips: ['避坑1'],
  recommendedPhrases: ['Menu, please (请给我菜单)'],
  targetText: 'Menu, please',
  phonetic: 'me-nu',
  subText: 'sub',
  localTip: 'tip',
  languageCode: 'th-TH',
  menu: {
    signature: [{ zh: '冬阴功', en: 'Tom Yum', th: 'ต้มยำ', price: '150 铢', spice: '🌶️🌶️' }],
    dishes: [{ zh: '炒饭', en: 'Fried Rice', th: 'ข้าวผัด', price: '80 铢' }],
    allergenWarn: '含花生',
  },
}));
check('完整 JSON 解析（title/category）', full?.title === '泰式海鲜餐厅菜单' && full?.category === 'RESTAURANT');
check('recommendedPhrases 透传', full?.recommendedPhrases?.[0] === 'Menu, please (请给我菜单)');
check('菜单 signature/dishes 解析', full?.menu?.signature?.length === 1 && full?.menu?.dishes?.length === 1 && full?.menu?.signature?.[0]?.zh === '冬阴功');
check('菜单 allergenWarn 透传', full?.menu?.allergenWarn === '含花生');

const fenced = parseVlmScenarioResult('```json\n{"title":"路牌解读","translatedText":"停止"}\n```');
check('```json 围栏剥离', fenced?.title === '路牌解读' && fenced?.translatedText === '停止');

const partial = parseVlmScenarioResult('{"title":"只有标题"}');
check('部分字段容错（默认 category）', partial?.title === '只有标题' && partial?.category === 'SCENE');

const invalid = parseVlmScenarioResult('这不是 JSON 的模型输出');
check('非法 JSON 严格返回 null', invalid === null);

check('空输入返回 null', parseVlmScenarioResult('') === null);
check('菜单结构非法 → 无菜单', parseVlmScenarioResult('{"title":"t","menu":{"bad":true}}')?.menu === undefined);
check('recommendedPhrases 非数组 → 空', parseVlmScenarioResult('{"title":"t","recommendedPhrases":"x"}')?.recommendedPhrases?.length === 0);

// ── scenarioToCard（ScenarioResult → CardData 降级链）──
console.log('── scenarioToCard ──');
const sc = {
  title: '出租车按表计费',
  category: 'TAXI',
  originalText: 'ocr',
  translatedText: '解读',
  tips: ['避坑'],
  recommendedPhrases: ['By meter, please (请打表)', 'Second one (第二条)'],
  targetText: 'By meter, please',
  phonetic: 'bai-mi-ter',
  subText: 'sub',
  languageCode: 'th-TH',
};
const card = scenarioToCard(sc, '泰国');
check('targetText/语言代码映射', card.targetText === 'By meter, please' && card.languageCode === 'th-TH');
check('phrases/tips 透传（限 3）', card.phrases?.length === 2 && card.tips?.[0] === '避坑');
check('locationName 注入', card.locationName === '泰国');
check('phonetic/subText 透传', card.phonetic === 'bai-mi-ter' && card.subText === 'sub');
const noTarget = scenarioToCard({ ...sc, targetText: undefined, phonetic: undefined, subText: undefined }, 'X');
check('缺 targetText → 用短语拆分降级', noTarget.targetText === 'By meter, please');
const empty = scenarioToCard({ ...sc, targetText: undefined, recommendedPhrases: [], translatedText: '' }, 'X');
check('全缺 → 兜底「请帮我」', empty.targetText === '请帮我' && empty.categoryTag === 'TAXI');
check('成卡预生成回复选项（label=中文/replyCard=外语）', card.reply?.options?.[0]?.label === '请打表' && card.reply?.options?.[0]?.replyCard?.targetText === 'By meter, please');
check('回复选项最多 2 条', card.reply?.options?.length === 2);
check('无短语 → 无回复选项', empty.reply === undefined);

// ── toPhraseCards（推荐短语 → 横滑卡）──
console.log('── toPhraseCards ──');
const ph = toPhraseCards(['By meter, please (请打表)', 'No translation here', 'Third one (第三个)']);
check('带翻译解析（外语/母语）', ph?.[0]?.foreignText === 'By meter, please' && ph?.[0]?.nativeText === '请打表');
check('无翻译短语跳过', ph?.length === 2 && !ph?.some((p) => p.foreignText === 'No translation here'));
check('空/未定义返回 undefined', toPhraseCards(undefined) === undefined && toPhraseCards([]) === undefined);
const many = toPhraseCards(['a (1)', 'b (2)', 'c (3)', 'd (4)']);
check('最多取 3 个', many?.length === 3);

// ── 国家安全数据完整性 ──
console.log('── countrySafety 数据完整性 ──');
check('至少 1 个国家', COUNTRY_SAFETY.length >= 1);
const codes = COUNTRY_SAFETY.map((c) => c.code);
check('国家码无重复', new Set(codes).size === codes.length);
const phoneRe = /^\+?[\d\s-]{2,}$/;
let badCountry: string[] = [];
for (const c of COUNTRY_SAFETY) {
  const problems: string[] = [];
  if (!c.nameZh || !c.nameEn) problems.push('nameZh/nameEn 缺失');
  if (!/^[a-zA-Z]{2,3}(-[A-Z]{2})?$/.test(c.langCode)) problems.push(`langCode 非法: ${c.langCode}`);
  for (const [k, v] of Object.entries({ police: c.emergency.police, ambulance: c.emergency.ambulance, fire: c.emergency.fire })) {
    if (!phoneRe.test(v) || !/^\d{2,15}$/.test(v.replace(/[\s-]/g, ''))) problems.push(`${k} 电话非法: ${v}`);
  }
  // 本国条目（code 与护照国一致）无使领馆电话，允许为空
  if (!c.tipping || !c.voltage || !c.currency || !c.water) problems.push('惯例字段缺失');
  if (!Array.isArray(c.scams) || c.scams.length === 0) problems.push('scams 缺失');
  if (!c.sos?.local || !c.sos?.phonetic) problems.push('sos 缺失');
  if (problems.length) badCountry.push(`${c.code}: ${problems.join(', ')}`);
}
check('全部国家必填字段与电话格式合法', badCountry.length === 0, badCountry.slice(0, 5).join(' | '));

console.log(failed === 0 ? '\n全部通过 ✅' : `\n${failed} 项失败 ❌`);
process.exit(failed === 0 ? 0 : 1);
