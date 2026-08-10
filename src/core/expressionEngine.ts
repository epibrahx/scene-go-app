/**
 * 表达引擎：场景识别与表达卡生成的业务核心（与 UI 无关）。
 * 输入（图片/文本/追问）→ 云端解读或表达卡。
 */
import { pluginManager } from '../plugins/PluginManager';
import { parseVlmScenarioResult } from '../plugins/ocr/CloudVlmOcrPlugin';
import { ChatTurn, ScenarioResult } from '../plugins/types';
import { getLocationContext } from '../utils/locationContext';
import { compressImage } from '../utils/imageCompress';
import { scenarioToCard } from '../utils/cardBuilder';
import { pipelineTraceStore } from './pipelineTrace';
import { CardData } from './types';

export interface ProcessImageResult {
  scenario: ScenarioResult;
  card: CardData;
}

export interface AskFollowUpResult {
  text: string;
  /** 追问中表达沟通需求时 VLM 返回表达卡，命中则附带卡片数据 */
  card?: CardData;
}

export const expressionEngine = {
  /**
   * 拍照管线：压缩 → 云端识别 → 解读 + 表达卡。
   * （照片捕获本身属设备/UI 层，调用方传入 uri；位置上下文内部获取）
   */
  async processImage(photoUri: string, location?: string): Promise<ProcessImageResult> {
    const uri = await compressImage(photoUri);
    const locationCtx = location ?? (await getLocationContext()) ?? undefined;
    const result = await pluginManager.processImageSnapshot(uri, locationCtx);
    return {
      scenario: result.scenario,
      card: scenarioToCard(result.scenario, locationCtx ?? '当前位置'),
    };
  },

  /** 文本驱动的动态表达卡：一句话需求（打字/语音）→ AI 翻译成目标语言表达卡 */
  async generateCard(text: string, location?: string): Promise<CardData> {
    const result = await pluginManager.generateCardFromText(text, location);
    const card = scenarioToCard(result, location ?? '当前位置');
    console.log(
      `[Card trace] 云端VLM → card=${card.id} category=${card.categoryTag} title=${card.title} menu=${result.menu ? `signature=${result.menu.signature.length}/dishes=${result.menu.dishes.length}` : '无'}`,
    );
    pipelineTraceStore.getState().pushTrace({
      at: Date.now(),
      input: text,
      path: 'vlm',
      category: card.categoryTag,
      targetText: card.targetText,
      steps: 0,
      menu: result.menu ? `signature=${result.menu.signature.length}/dishes=${result.menu.dishes.length}` : undefined,
    });
    return card;
  },

  /**
   * 聆听对方（mic ambient）：对方用当地语言说了一段话 → 一张合并回复卡
   * （外语回复在上递给人看，母语译文在下供用户理解）。一次输入 = 一张卡。
   */
  async replyToUtterance(text: string, location?: string): Promise<CardData> {
    const result = await pluginManager.generateReplyCard(text, location);
    return scenarioToCard(result, location ?? '当前位置');
  },

  /**
   * 多轮追问：携带会话历史，回答追加到对话流；
   * 用户表达沟通需求时自动生成表达卡（解析 VLM 卡片 JSON，命中 targetText 即成卡）。
   */
  async askFollowUp(
    imageUri: string,
    question: string,
    history: ChatTurn[],
  ): Promise<AskFollowUpResult> {
    const reply = await pluginManager.getCloudVlmPlugin().askFollowUp(imageUri, question, history);
    const parsed = parseVlmScenarioResult(reply);
    if (parsed && parsed.targetText) {
      const locationCtx = await getLocationContext();
      return {
        text: `${reply}\n\n✅ 已为你生成表达卡「${parsed.title || '场景表达'}」，关闭对话即可查看。`,
        card: scenarioToCard(parsed, locationCtx ?? '当前位置'),
      };
    }
    return { text: reply };
  },
};
