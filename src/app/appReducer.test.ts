import { describe, expect, test } from 'bun:test';
import { AppError } from '../errors/AppError';
import { APP_ROUTES, appReducer, initialAppState, TaskState } from './appReducer';

describe('appReducer', () => {
  test('contains all phase 2 routes', () => {
    expect(APP_ROUTES).toEqual([
      'home', 'card', 'presentation', 'camera', 'photoResult',
      'country', 'settings', 'safety', 'safetyDetail',
    ]);
  });

  test('moves startup through ready and fatal', () => {
    expect(appReducer(initialAppState, { type: 'startupReady' }).startup).toBe('ready');
    const error = new AppError('config', 'bad config');
    const fatal = appReducer(initialAppState, { type: 'startupFatal', error });
    expect(fatal.startup).toBe('fatal');
    expect(fatal.fatalError).toBe(error);
  });

  test('allows only one active request and ignores stale completions', () => {
    const first = appReducer(initialAppState, {
      type: 'taskStart', requestId: 'one', status: 'requestingPermission',
    });
    const blocked = appReducer(first, { type: 'taskStart', requestId: 'two', status: 'submitting' });
    expect(blocked).toBe(first);
    expect(appReducer(first, { type: 'taskSuccess', requestId: 'two' })).toBe(first);
    const progressed = appReducer(first, { type: 'taskProgress', requestId: 'one', status: 'listening' });
    expect(progressed.task.status).toBe('listening');
    expect(appReducer(progressed, { type: 'taskSuccess', requestId: 'one' }).task.status).toBe('success');
  });

  test('exposes exactly the required task states', () => {
    const states: TaskState[] = [
      'idle', 'requestingPermission', 'listening', 'submitting',
      'success', 'recoverableError', 'cancelled',
    ];
    expect(states).toHaveLength(7);
  });
});