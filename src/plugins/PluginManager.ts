import { OcrResult, ScenarioResult } from './types';
import { CloudVlmOcrPlugin, parseVlmScenarioResult } from './ocr/CloudVlmOcrPlugin';
import { AiGatewayError } from '../utils/aiGateway';

class PluginManager {
  private cloudVlmPlugin = new CloudVlmOcrPlugin();

  /** 获取云端 VLM 插件实例（用于多轮追问） */
  getCloudVlmPlugin(): CloudVlmOcrPlugin {
    return this.cloudVlmPlugin;
  }

  /** 文本驱动的动态表达卡：语音意图/手打需求 → 当地语言表达卡（无图路径） */
  async generateCardFromText(text: string, location?: string): Promise<ScenarioResult> {
    return this.cloudVlmPlugin.generateCardFromText(text, location);
  }

  /** 聆听对方（mic ambient）：对方当地语言发言 → 合并回复卡（外语回复 + 母语译文） */
  async generateReplyCard(text: string, location?: string): Promise<ScenarioResult> {
    return this.cloudVlmPlugin.generateReplyCard(text, location);
  }

  /**
   * 核心管线：拍摄 → 云端识别。失败与无效响应均严格抛出 typed error。
   */
  async processImageSnapshot(
    imageUri: string,
    location?: string,
  ): Promise<{ ocr: OcrResult; scenario: ScenarioResult }> {
    const ocr = await this.cloudVlmPlugin.recognizeText(imageUri, location);
    const scenario = parseVlmScenarioResult(ocr.rawText);
    if (!scenario) {
      throw new AiGatewayError('INVALID_RESPONSE', '云端未返回有效场景数据');
    }
    return { ocr, scenario };
  }
}

export const pluginManager = new PluginManager();
