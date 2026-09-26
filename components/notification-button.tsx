'use client'

import { useEffect, useState } from 'react'

export function NotificationButton() {
  const [permission, setPermission] =
    useState<NotificationPermission>('default')

  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (
      !('Notification' in window) ||
      !('serviceWorker' in navigator)
    ) {
      setSupported(false)
      return
    }

    setPermission(Notification.permission)

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('Service Worker registration failed:', error)
    })
  }, [])

  const enableNotifications = async () => {
    try {
      const result = await Notification.requestPermission()
      setPermission(result)

      if (result === 'granted') {
        const registration =
          await navigator.serviceWorker.ready

        await registration.showNotification(
          'حيدر محمد رياضيات',
          {
            body: 'تم تفعيل الإشعارات بنجاح 🔔',
            icon: '/icon-192.png',
          }
        )
      }
    } catch (error) {
      console.error('Notification error:', error)
    }
  }

  if (!supported) {
    return null
  }

  if (permission === 'granted') {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-center font-bold">
        🔔 الإشعارات مفعّلة
      </div>
    )
  }

  if (permission === 'denied') {
    return (
      <div className="rounded-xl border border-border px-5 py-3 text-center">
        الإشعارات محظورة من إعدادات المتصفح
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={enableNotifications}
      className="rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black"
    >
      🔔 تفعيل الإشعارات
    </button>
  )
}