import * as Speech from 'expo-speech';
import { AppState, AppStateStatus } from 'react-native';
import { AppError } from '../errors/AppError';

type TtsState = 'idle' | 'playing' | 'error';

class TtsService {
  private isPlayingState: boolean = false;
  private stateChangeListeners: Set<(state: TtsState) => void> = new Set();
  private appStateSubscription: any = null;

  constructor() {
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState.match(/inactive|background/)) {
      this.stop();
    }
  };

  /**
   * 播放文本，先检查语言支持
   */
  async play(text: string, languageCode: string): Promise<void> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      const isAvailable = voices.some(v => v.language.startsWith(languageCode.split('-')[0]));
      
      if (!isAvailable) {
        throw new AppError('tts', `Language ${languageCode} is not available for TTS`);
      }

      this.notifyState('playing');
      this.isPlayingState = true;
      Speech.speak(text, {
        language: languageCode,
        onDone: () => {
          this.isPlayingState = false;
          this.notifyState('idle');
        },
        onError: (error) => {
          this.isPlayingState = false;
          this.notifyState('error');
        },
        onStopped: () => {
          this.isPlayingState = false;
          this.notifyState('idle');
        },
      });
    } catch (e) {
      this.isPlayingState = false;
      this.notifyState('error');
      throw e instanceof AppError ? e : new AppError('tts', e instanceof Error ? e.message : 'Unknown TTS Error');
    }
  }

  /**
   * 停止当前播放
   */
  stop(): void {
    Speech.stop();
    this.isPlayingState = false;
    this.notifyState('idle');
  }

  /**
   * 当前是否正在播放
   */
  isPlaying(): boolean {
    return this.isPlayingState;
  }

  /**
   * 订阅状态变化
   */
  onStateChange(cb: (state: TtsState) => void): () => void {
    this.stateChangeListeners.add(cb);
    return () => {
      this.stateChangeListeners.delete(cb);
    };
  }

  private notifyState(state: TtsState) {
    this.stateChangeListeners.forEach(listener => listener(state));
  }
}

export const ttsService = new TtsService();
