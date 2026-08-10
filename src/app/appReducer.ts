import { AppError } from '../errors/AppError';

export const APP_ROUTES = [
  'home',
  'card',
  'presentation',
  'camera',
  'photoResult',
  'country',
  'settings',
  'safety',
  'safetyDetail',
] as const;

export type AppRoute = (typeof APP_ROUTES)[number];
export type StartupState = 'booting' | 'ready' | 'fatal';
export type TaskState =
  | 'idle'
  | 'requestingPermission'
  | 'listening'
  | 'submitting'
  | 'success'
  | 'recoverableError'
  | 'cancelled';

export interface AppTask {
  status: TaskState;
  requestId: string | null;
  error: AppError | null;
}

export interface AppState {
  route: AppRoute;
  startup: StartupState;
  fatalError: AppError | null;
  task: AppTask;
}

export const initialAppState: AppState = {
  route: 'home',
  startup: 'booting',
  fatalError: null,
  task: { status: 'idle', requestId: null, error: null },
};

type ActiveTaskState = Extract<TaskState, 'requestingPermission' | 'listening' | 'submitting'>;

export type AppAction =
  | { type: 'startupReady' }
  | { type: 'startupFatal'; error: AppError }
  | { type: 'navigate'; route: AppRoute }
  | { type: 'taskStart'; requestId: string; status: ActiveTaskState }
  | { type: 'taskProgress'; requestId: string; status: ActiveTaskState }
  | { type: 'taskSuccess'; requestId: string }
  | { type: 'taskError'; requestId: string; error: AppError }
  | { type: 'taskCancel'; requestId: string }
  | { type: 'taskReset' };

export function isTaskActive(task: AppTask): boolean {
  return task.status === 'requestingPermission' || task.status === 'listening' || task.status === 'submitting';
}

function ownsRequest(state: AppState, requestId: string): boolean {
  return state.task.requestId === requestId;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'startupReady':
      return { ...state, startup: 'ready', fatalError: null };
    case 'startupFatal':
      return { ...state, startup: 'fatal', fatalError: action.error };
    case 'navigate':
      return { ...state, route: action.route };
    case 'taskStart':
      if (!action.requestId || isTaskActive(state.task)) return state;
      return { ...state, task: { status: action.status, requestId: action.requestId, error: null } };
    case 'taskProgress':
      if (!ownsRequest(state, action.requestId) || !isTaskActive(state.task)) return state;
      return { ...state, task: { ...state.task, status: action.status } };
    case 'taskSuccess':
      if (!ownsRequest(state, action.requestId) || !isTaskActive(state.task)) return state;
      return { ...state, task: { status: 'success', requestId: action.requestId, error: null } };
    case 'taskError':
      if (!ownsRequest(state, action.requestId) || !isTaskActive(state.task)) return state;
      return { ...state, task: { status: 'recoverableError', requestId: action.requestId, error: action.error } };
    case 'taskCancel':
      if (!ownsRequest(state, action.requestId) || !isTaskActive(state.task)) return state;
      return { ...state, task: { status: 'cancelled', requestId: action.requestId, error: null } };
    case 'taskReset':
      return { ...state, task: { status: 'idle', requestId: null, error: null } };
    default:
      return state;
  }
}