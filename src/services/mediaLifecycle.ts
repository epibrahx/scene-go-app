import * as FileSystem from 'expo-file-system';
import { AppState, AppStateStatus } from 'react-native';
import { ttsService } from './ttsService';
import { speechController } from '../core/speechController';

class MediaLifecycle {
  private trackedFiles: Set<string> = new Set();
  private appStateSubscription: any = null;

  /**
   * 注册临时文件以便后台清理
   */
  registerTempFile(uri: string): void {
    this.trackedFiles.add(uri);
  }

  /**
   * 取消注册临时文件
   */
  unregisterTempFile(uri: string): void {
    this.trackedFiles.delete(uri);
  }

  /**
   * 清理所有已注册的临时文件
   */
  async cleanupAll(): Promise<void> {
    const uris = Array.from(this.trackedFiles);
    this.trackedFiles.clear();
    
    await Promise.allSettled(
      uris.map(async (uri) => {
        try {
          const info = await FileSystem.getInfoAsync(uri);
          if (info.exists) {
            await FileSystem.deleteAsync(uri, { idempotent: true });
          }
        } catch (e) {
          // 忽略清理过程中的错误
        }
      })
    );
  }

  /**
   * 启动后台监听，在进入后台时停止服务并清理
   */
  startBackgroundMonitor(): () => void {
    if (this.appStateSubscription) {
      return () => this.appStateSubscription.remove();
    }

    this.appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        // 停止 TTS
        ttsService.stop();
        // 停止语音识别
        await speechController.cleanup();
        // 清理临时文件
        await this.cleanupAll();
      }
    });

    return () => {
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
    };
  }
}

export const mediaLifecycle = new MediaLifecycle();
