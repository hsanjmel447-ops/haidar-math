self.addEventListener('push', function (event) {
  const data = event.data
    ? event.data.json()
    : {
        title: 'حيدر محمد رياضيات',
        body: 'لديك إشعار جديد',
      }

  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/',
    },
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'حيدر محمد رياضيات',
      options
    )
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.openWindow(url)
  )
})