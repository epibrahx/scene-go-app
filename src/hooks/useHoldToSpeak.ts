import { useRef, useState } from 'react';
import { speechController } from '../core/speechController';
import { permissionService } from '../services/permissionService';

export interface HoldToSpeak {
  recording: boolean;
  /** 按住：请求权限 + 开始听写；返回 ok=false 表示识别不可用（已清理） */
  start: (locale: string) => Promise<{ ok: boolean }>;
  /** 松开：停止并返回转录文本（final 优先，回退 partial；空串=没听清） */
  stop: () => Promise<string>;
}

/**
 * 按住说话（01 屏 HoldMic / 02 屏 MicBtn 共用）。
 * 录音状态、订阅、会话 id 全部收口在这里；转录文本在 stop 时返回，
 * 调用方决定走 generateCard（我说）还是 replyToUtterance（对方说）。
 */
export function useHoldToSpeak(): HoldToSpeak {
  const [recording, setRecording] = useState(false);
  const recordingRef = useRef(false);
  const sessionRef = useRef<string | null>(null);
  const finalRef = useRef('');
  const partialRef = useRef('');
  const unsubRef = useRef<(() => void) | null>(null);

  const start = async (locale: string): Promise<{ ok: boolean }> => {
    if (recordingRef.current) return { ok: true };
    recordingRef.current = true;
    setRecording(true);
    const sessionId = Date.now().toString();
    sessionRef.current = sessionId;
    finalRef.current = '';
    partialRef.current = '';
    const unsubFinal = speechController.onFinal((t) => {
      finalRef.current = t;
    });
    const unsubPartial = speechController.onPartial((t) => {
      partialRef.current = t;
    });
    const unsubError = speechController.onError(() => {});
    unsubRef.current = () => {
      unsubFinal();
      unsubPartial();
      unsubError();
    };
    try {
      await permissionService.request('microphone');
      await speechController.start(locale, sessionId);
      return { ok: true };
    } catch {
      unsubRef.current?.();
      unsubRef.current = null;
      sessionRef.current = null;
      recordingRef.current = false;
      setRecording(false);
      return { ok: false };
    }
  };

  const stop = async (): Promise<string> => {
    if (!recordingRef.current) return '';
    const sessionId = sessionRef.current;
    if (sessionId) {
      try {
        await speechController.stop(sessionId);
        // Native speech recognition may emit the final result after stop resolves.
        await new Promise((resolve) => setTimeout(resolve, 900));
      } catch {
        // 停止失败不阻塞取转录
      }
    }
    unsubRef.current?.();
    unsubRef.current = null;
    sessionRef.current = null;
    recordingRef.current = false;
    setRecording(false);
    return (finalRef.current || partialRef.current).trim();
  };

  return { recording, start, stop };
}
