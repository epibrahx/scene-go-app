import { NativeSpeech } from '../utils/NativeSpeech';
import { AppError } from '../errors/AppError';

export interface SpeechStartResult {
  ok: boolean;
  error?: string;
}

export const speechController = {
  _activeSession: null as string | null,

  async start(locale: string = 'zh-CN', sessionId: string): Promise<SpeechStartResult> {
    if (this._activeSession) {
      return { ok: false, error: 'Another session is active' };
    }
    this._activeSession = sessionId;
    const result = await NativeSpeech.start(locale);
    if (!result.ok) {
      this._activeSession = null;
      throw new AppError('speech', result.error || 'Unknown speech start error');
    }
    return result;
  },

  async stop(sessionId: string): Promise<void> {
    if (this._activeSession !== sessionId) return;
    await NativeSpeech.stop();
    // wait 300ms for final event after stopping
    await new Promise(resolve => setTimeout(resolve, 300));
    this._activeSession = null;
  },

  async cancel(sessionId: string): Promise<void> {
    if (this._activeSession !== sessionId) return;
    await NativeSpeech.stop();
    this._activeSession = null;
  },

  onPartial(cb: (text: string) => void) {
    const sub = NativeSpeech.onSpeechResult((e) => {
      if (!e.isFinal) cb(e.transcript);
    });
    return () => sub.remove();
  },

  onFinal(cb: (text: string) => void) {
    const sub = NativeSpeech.onSpeechResult((e) => {
      if (e.isFinal) cb(e.transcript);
    });
    return () => sub.remove();
  },

  onError(cb: (error: string) => void) {
    const sub = NativeSpeech.onSpeechError((e) => {
      cb(new AppError('speech', e.message).message);
    });
    return () => sub.remove();
  },

  isActive() {
    return this._activeSession !== null;
  },

  async cleanup() {
    if (this._activeSession) {
      await NativeSpeech.stop();
      this._activeSession = null;
    }
  }
};
