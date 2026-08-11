/**
 * 路由与任务状态（与 DESIGN-v2.1.pen 的 11 屏一一对应）。
 * 无导航库，纯 State 驱动。
 */
import { AppError } from '../errors/AppError';

export type Route =
  | 'home' // 01 IDLE 待机 · 触发入口
  | 'card' // 02 表达卡 · 成卡结果
  | 'presentation' // 03 全屏大字展示
  | 'camera' // 04 内联相机
  | 'photoResult' // 05 图片解读 · 拍图识别
  | 'country' // 06 国家选择
  | 'safety' // 07 安全卡
  | 'safetyDetail' // 08 安全详情
  | 'locationSwitch' // 09 位置切换
  | 'safetyInfo' // 10 安全信息 · 26 国
  | 'settings'; // 13 更多（设置聚合）

export type TaskStatus = 'idle' | 'listening' | 'submitting' | 'requestingPermission' | 'error';

export interface AppState {
  route: Route;
  task: TaskStatus;
  taskError: AppError | null;
}

export const initialAppState: AppState = {
  route: 'home',
  task: 'idle',
  taskError: null,
};

export type AppAction =
  | { type: 'navigate'; route: Route }
  | { type: 'taskStart'; status: TaskStatus }
  | { type: 'taskSuccess' }
  | { type: 'taskError'; error: AppError }
  | { type: 'taskReset' };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'navigate':
      return { ...state, route: action.route, taskError: null };
    case 'taskStart':
      return { ...state, task: action.status, taskError: null };
    case 'taskSuccess':
      return { ...state, task: 'idle' };
    case 'taskError':
      return { ...state, task: 'error', taskError: action.error };
    case 'taskReset':
      return { ...state, task: 'idle', taskError: null };
  }
}
