import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';

const ANDROID_CHANNEL_ID = 'lifesync-default';

export type Priority = 'min' | 'low' | 'default' | 'high' | 'max';

export function mapPriorityToImportance(priority: Priority | undefined): number {
  switch (priority) {
    case 'min': return 0;
    case 'low': return 2;
    case 'high': return 4;
    case 'max': return 5;
    case 'default':
    default: return 3;
  }
}

type InstantParams = {
  title: string;
  body: string;
  channelId?: string;
  priority?: Priority;
  silent?: boolean;
};

function isNative() {
  try { return Capacitor.isNativePlatform?.() === true; } catch { return false; }
}

async function ensureChannel(channelId = 'default', priority: Priority = 'default') {
  if (!isNative()) return;
  try {
    await LocalNotifications.createChannel?.({
      id: channelId,
      name: channelId,
      description: 'LifeSync notifications',
      importance: mapPriorityToImportance(priority),
      visibility: 1,
      lights: true,
      vibration: true,
    } as any);
  } catch { /* noop */ }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative()) {
    try {
      const check = await LocalNotifications.checkPermissions?.();
      if (check?.display === 'granted') return true;
      const res = await LocalNotifications.requestPermissions?.();
      return res?.display === 'granted';
    } catch {
      return false;
    }
  }

  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

export async function showInstantNotification(
  a: string | InstantParams,
  b?: string
): Promise<void> {
  const params: InstantParams = typeof a === 'string'
    ? { title: a, body: String(b ?? ''), priority: 'default', channelId: 'default', silent: false }
    : { priority: 'default', channelId: 'default', silent: false, ...a };

  if (isNative()) {
    try {
      await ensureChannel(params.channelId, params.priority);
      await LocalNotifications.schedule?.({
        notifications: [{
          id: Date.now() % 2147483647,
          title: params.title,
          body: params.body,
          schedule: undefined,
          extra: {},
          channelId: params.channelId,
          smallIcon: 'ic_stat_name',
        }],
      } as any);
    } catch (e) {
      console.warn('[notifications] native schedule failed, falling back to web', e);
      // fallback to web path below
    }
  }

  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(params.title, { body: params.body, silent: !!params.silent });
  }
}

export async function isPermissionGranted(): Promise<boolean> {
  if (isNative()) {
    try {
      const { display } = await LocalNotifications.checkPermissions();
      return display === 'granted';
    } catch {
      return false;
    }
  }
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

export async function scheduleNotification(
  title: string,
  body: string,
  when: Date
): Promise<void> {
  if (!isNative()) {
    // Web fallback: no reliable scheduling; show a best-effort immediate notification if due
    if (when.getTime() <= Date.now()) {
      await showInstantNotification(title, body);
    }
    return;
  }
  const schedule: ScheduleOptions = {
    notifications: [
      {
        id: Number(String(Date.now()).slice(-9)),
        title,
        body,
        schedule: { at: when },
        channelId: ANDROID_CHANNEL_ID,
      },
    ],
  };
  await LocalNotifications.schedule(schedule);
}

export async function ensureServiceWorkerRegistered() {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('/sw.js'); } catch {}
  }
}
