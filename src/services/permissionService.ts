import { Camera } from 'expo-camera';
import { Linking, Platform } from 'react-native';
import { NativeSpeech } from '../utils/NativeSpeech';

export type PermissionType = 'camera' | 'microphone' | 'speech';
export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'permanentlyDenied';

class PermissionService {
  /**
   * 获取当前权限状态
   */
  async getStatus(type: PermissionType): Promise<PermissionState> {
    switch (type) {
      case 'camera': {
        const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
        return this.mapStatus(status, canAskAgain);
      }
      case 'microphone': {
        const { status, canAskAgain } = await Camera.getMicrophonePermissionsAsync();
        return this.mapStatus(status, canAskAgain);
      }
      case 'speech': {
        // Since we can't reliably get the status without triggering a prompt,
        // we'll return 'undetermined' and let the request handle it.
        return 'undetermined';
      }
    }
  }

  /**
   * 请求权限
   */
  async request(type: PermissionType): Promise<PermissionState> {
    switch (type) {
      case 'camera': {
        const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
        return this.mapStatus(status, canAskAgain);
      }
      case 'microphone': {
        const { status, canAskAgain } = await Camera.requestMicrophonePermissionsAsync();
        return this.mapStatus(status, canAskAgain);
      }
      case 'speech': {
        // 尝试 start() 来触发系统弹窗
        try {
            const res = await NativeSpeech.start('en-US');
            await NativeSpeech.stop();
            if (res.ok) return 'granted';
            return 'denied';
        } catch (e) {
            return 'denied';
        }
      }
    }
  }

  /**
   * 打开系统设置
   */
  async openSettings(): Promise<void> {
    await Linking.openSettings();
  }

  private mapStatus(status: string, canAskAgain: boolean): PermissionState {
    if (status === 'granted') return 'granted';
    if (status === 'denied') {
      return canAskAgain ? 'denied' : 'permanentlyDenied';
    }
    return 'undetermined';
  }
}

export const permissionService = new PermissionService();
