import { mapPriorityToImportance, requestNotificationPermission, showInstantNotification } from '@/services/notifications'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}))

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    requestPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    checkPermissions: vi.fn().mockResolvedValue({ display: 'granted' }),
    schedule: vi.fn().mockResolvedValue(undefined),
    createChannel: vi.fn().mockResolvedValue(undefined),
  },
}))

class MockNotification {
  static permission: NotificationPermission = 'default'
  static requestPermission = vi.fn(async () => {
    MockNotification.permission = 'granted'
    return 'granted' as const
  })
  constructor(public title: string, public options?: NotificationOptions) {}
}

describe('notifications', () => {
  it('maps priority to importance', () => {
    expect(mapPriorityToImportance('min')).toBe(0)
    expect(mapPriorityToImportance('low')).toBe(2)
    expect(mapPriorityToImportance('default')).toBe(3)
    expect(mapPriorityToImportance('high')).toBe(4)
    expect(mapPriorityToImportance('max')).toBe(5)
  })
})

describe('notifications (web fallback)', () => {
  beforeEach(() => {
    // @ts-expect-error override global
    global.Notification = MockNotification as any
    MockNotification.permission = 'default'
    MockNotification.requestPermission.mockClear()
  })

  it('requests permission on web', async () => {
    const granted = await requestNotificationPermission()
    expect(MockNotification.requestPermission).toHaveBeenCalled()
    expect(granted).toBe(true)
  })

  it('shows instant notification when granted', async () => {
    MockNotification.permission = 'granted'
    const ctorSpy = vi.spyOn(global as any, 'Notification')
    await showInstantNotification('Test', 'Body')
    expect(ctorSpy).toHaveBeenCalledWith('Test', { body: 'Body', silent: false })
    ctorSpy.mockRestore()
  })
})

