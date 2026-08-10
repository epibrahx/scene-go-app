import { OcrPlugin, OcrResult, ScenarioResult, ChatTurn } from '../types';
import { getCachedSettings } from '../../utils/appSettings';
import { AiGatewayError, chatCompletions, AiChatMessage } from '../../utils/aiGateway';
import * as FileSystem from 'expo-file-system';
import { parseVlmScenarioResult } from './parseVlmScenario';
import { AppError } from '../../errors/AppError';

export { parseVlmScenarioResult } from './parseVlmScenario';

const SCENE_SYSTEM_PROMPT = `你是 SceneGo 出行智能助手。用户正在异国旅行，会通过手机摄像头拍摄眼前的场景（菜单、路牌、车站、商店、景点、告示牌等）。
你的任务是分析这张照片，给出对旅行者最有价值的即时解读。

你必须严格以如下 JSON 格式回复（不要输出任何其他内容）：
{
  "title": "场景的简短中文标题（如：泰式海鲜餐厅菜单）",
  "category": "场景分类（RESTAURANT / AIRPORT / HOTEL / TRANSPORT / SHOPPING / ATTRACTION / SIGN / OTHER）",
  "translatedText": "对照片内容的详细中文解读与翻译（包含价格、关键细节等）",
  "tips": ["出行避坑提示1", "避坑提示2", "避坑提示3"],
  "recommendedPhrases": ["当地语言实用短语1 (中文翻译)", "短语2 (中文翻译)"],
  "targetText": "如果这个场景需要向当地人表达诉求（点餐、问路、砍价等），给出当地语言的核心表达句；纯展示类场景（路牌/菜单阅读）则省略",
  "phonetic": "targetText 的当地语言发音拉丁转写",
  "subText": "补充说明（当地语言或英文，如忌口细节）",
  "localTip": "中文当地惯例提示（小费/计费/注意事项）",
  "languageCode": "当地语言 BCP-47 代码（如 th-TH / ja-JP / en-US）",
  "menu": "当照片是菜单/价目表/菜品清单时输出结构化菜单对象，否则为 null（字段结构见下）"
}
菜单字段结构（menu 为 null 时忽略）：
{"signature":[{"zh":"中文菜名","en":"英文名","th":"当地语言菜名","price":"价格(如 150 铢)","spice":"辣度(如 🌶️🌶️ 或 无辣)","allergens":["花生","海鲜"]}],"allergenWarn":"中文避坑预警（含过敏原提示，无则空串）","dishes":[与 signature 相同字段结构]}；signature 最多 3 项，dishes 最多 6 项`;

const CARD_SYSTEM_PROMPT = `你是 SceneGo 出行助手。用户正在异国旅行，会用一句话描述当下的表达需求（可能来自语音转写）。
根据需求生成一张"递给当地人看"的高对比度表达卡。语言必须严格使用下方设定的目标语言，禁止使用其他语言。

你必须严格以如下 JSON 格式回复（不要输出任何其他内容）：
{
  "title": "卡片的中文标题（如：出租车按表计费）",
  "category": "场景分类（RESTAURANT / AIRPORT / HOTEL / TRANSPORT / SHOPPING / ATTRACTION / SIGN / OTHER）",
  "targetText": "目标语言大字表达（递给当地人看的核心句）",
  "phonetic": "目标语言发音的拉丁转写",
  "subText": "补充说明（目标语言或英文）",
  "localTip": "中文当地惯例提示（小费/计费/注意事项）",
  "languageCode": "必须等于下方设定的目标语言代码",
  "phrases": ["备用表达1（目标语言，括号内中文翻译）", "备用表达2（目标语言，括号内中文翻译）", "备用表达3（目标语言，括号内中文翻译）"]
}`;

async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    if (FileSystem?.readAsStringAsync) {
      return await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType?.Base64 || 'base64',
      });
    }
  } catch {
    // 忽略原生模块加载错误
  }

  const res = await fetch(imageUri);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function buildSceneMessages(base64: string, location?: string) {
  const s = getCachedSettings();
  const userText = location
    ? `请分析这张照片中的场景，给出出行解读。\n（用户当前所在位置：${location}，可结合位置判断场景地点与当地语言）`
    : '请分析这张照片中的场景，给出出行解读。';
  return {
    messages: [
      {
        role: 'system',
        content: `${SCENE_SYSTEM_PROMPT}\n当前设定目标语言：${s.targetLanguage.name}（languageCode 必须为 ${s.targetLanguage.code}，recommendedPhrases / targetText 用该语言输出）。`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64}` },
          },
          {
            type: 'text',
            text: userText,
          },
        ],
      },
    ],
    maxTokens: 1024,
  };
}

function buildFollowUpMessages(base64: string, question: string, history: ChatTurn[] = []) {
  const messages: AiChatMessage[] = [
    {
      role: 'system',
      content:
        '你是 SceneGo 出行助手。用户正在异国旅行中，基于拍摄的照片与你多轮对话。' +
        '普通提问请用中文简洁回答，并尽量承接上文语境。\n' +
        '当用户表达的是“需要向当地人沟通/表达”的需求（如点餐、退房、问路、砍价、表达症状、请求帮助）时，' +
        '直接输出一张表达卡，严格以如下 JSON 格式回复（不要输出任何其他内容）：\n' +
        '{"title":"中文标题","category":"场景分类","targetText":"当地语言大字表达","phonetic":"拉丁转写","subText":"补充说明（当地语言或英文）","localTip":"中文当地惯例提示","languageCode":"BCP-47语言代码","phrases":["备用表达1（当地语言）","备用表达2"],"tips":["避坑提示"]}',
    },
  ];

  if (history.length === 0) {
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: question },
      ],
    });
  } else {
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: history[0].content },
      ],
    });
    for (const turn of history.slice(1)) {
      messages.push({ role: turn.role, content: turn.content });
    }
    messages.push({ role: 'user', content: question });
  }

  return { messages, maxTokens: 512 };
}

export class CloudVlmOcrPlugin implements OcrPlugin {
  id = 'cloud-vlm';
  name = '云端视觉识别';
  description = '通过 OpenRouter 识别摄像头画面场景';

  async recognizeText(imageUri: string, location?: string, signal?: AbortSignal): Promise<OcrResult> {
    const startTime = Date.now();
    const base64 = await convertImageToBase64(imageUri);
    const req = buildSceneMessages(base64, location);
    const result = await chatCompletions({
      messages: req.messages,
      maxTokens: req.maxTokens,
      logLabel: '[Scene OCR]',
      signal,
    });

    console.log(`[CloudVlm] 响应 (${result.status}, ${Date.now() - startTime}ms)`);
    return { rawText: result.content, lines: [result.content], confidence: 1.0 };
  }

  async askFollowUp(imageUri: string, question: string, history: ChatTurn[] = [], signal?: AbortSignal): Promise<string> {
    const base64 = await convertImageToBase64(imageUri);
    const req = buildFollowUpMessages(base64, question, history);
    const result = await chatCompletions({
      messages: req.messages,
      maxTokens: req.maxTokens,
      logLabel: `[Follow-Up]: ${question}\n[History]: ${history.length} turns`,
      signal,
    });
    return result.content;
  }

  async generateCardFromText(text: string, location?: string, signal?: AbortSignal): Promise<ScenarioResult> {
    const s = getCachedSettings();
    const userContent = location
      ? `${text}\n\n（用户当前所在位置：${location}，生成卡片请使用当地语言）`
      : text;
    const result = await chatCompletions({
      messages: [
        {
          role: 'system',
          content: `${CARD_SYSTEM_PROMPT}\n当前设定目标语言：${s.targetLanguage.name}（languageCode 必须为 ${s.targetLanguage.code}）。`,
        },
        { role: 'user', content: userContent },
      ],
      maxTokens: 512,
      logLabel: `[Card From Text]: ${text}`,
      signal,
    });
    const parsed = parseVlmScenarioResult(result.content);
    if (!parsed) throw new AppError('invalid-response', '云端未返回有效表达卡');
    return this.enforceTargetLanguage(parsed, s.targetLanguage.name, s.targetLanguage.code, text, signal);
  }

  async generateReplyCard(text: string, location?: string, signal?: AbortSignal): Promise<ScenarioResult> {
    const s = getCachedSettings();
    const userContent = location
      ? `对方用当地语言对我说了这句话：\n「${text}」\n（用户当前所在位置：${location}）\n\n请生成一张递给对方看的回复卡。`
      : `对方用当地语言对我说了这句话：\n「${text}」\n\n请生成一张递给对方看的回复卡。`;
    const result = await chatCompletions({
      messages: [
        {
          role: 'system',
          content: `你是 SceneGo 出行助手。对方用当地语言对你说了一段话，你需要回话。
严格以如下 JSON 格式回复（不要输出任何其他内容）：
{
  "title": "中文标题（如：回应对方）",
  "category": "场景分类（RESTAURANT / TRANSPORT / SHOPPING / HOTEL / OTHER）",
  "targetText": "递给对方看的当地语言回复（目标语言：${s.targetLanguage.name}）",
  "subText": "这句回复的中文译文，并简要说明对方说了什么（供用户理解）",
  "localTip": "中文惯例提示（可选，如小费/礼貌用语）",
  "languageCode": "${s.targetLanguage.code}"
}`,
        },
        { role: 'user', content: userContent },
      ],
      maxTokens: 512,
      logLabel: `[Reply Card]: ${text}`,
      signal,
    });
    const parsed = parseVlmScenarioResult(result.content);
    if (!parsed) throw new AppError('invalid-response', '云端未返回有效回复卡');
    return this.enforceTargetLanguage(parsed, s.targetLanguage.name, s.targetLanguage.code, text, signal);
  }

  async translateUtterance(text: string, lang?: string, signal?: AbortSignal): Promise<string> {
    const target = lang === 'en-US' ? '英语' : '简体中文';
    const result = await chatCompletions({
      messages: [
        {
          role: 'system',
          content: `你是出行翻译助手。把用户的当地语言发言翻译成${target}。只输出一行译文，不要任何其他内容。`,
        },
        { role: 'user', content: text },
      ],
      maxTokens: 256,
      logLabel: '[Listen Translate]',
      signal,
    });
    return result.content.trim();
  }

  async translateToTarget(text: string, langName: string, langCode: string, signal?: AbortSignal): Promise<string> {
    const result = await chatCompletions({
      messages: [
        {
          role: 'system',
          content: `你是出行翻译助手。把下面的句子翻译成${langName}（语言代码 ${langCode}）。只输出一行${langName}译文，不要任何其他内容。`,
        },
        { role: 'user', content: text },
      ],
      maxTokens: 256,
      logLabel: '[Language Fix]',
      signal,
    });
    return result.content.trim();
  }

  private async enforceTargetLanguage(parsed: ScenarioResult, langName: string, langCode: string, fallbackSource: string, signal?: AbortSignal): Promise<ScenarioResult> {
    if (parsed.languageCode && parsed.languageCode === langCode) return parsed;
    const source = parsed.targetText || parsed.translatedText || fallbackSource;
    const fixed = await this.translateToTarget(source, langName, langCode, signal);
    console.warn(`[Language Fix] 模型输出语言 ${parsed.languageCode ?? '未知'} ≠ 目标 ${langCode}，已重译`);
    parsed.targetText = fixed;
    parsed.languageCode = langCode;
    return parsed;
  }
}