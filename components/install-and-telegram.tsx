'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export function InstallAndTelegram() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  useEffect(() => {
    const navigatorWithStandalone = window.navigator as Navigator & {
      standalone?: boolean
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      navigatorWithStandalone.standalone === true

    setIsInstalled(standalone)

    const ios =
      /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
      navigatorWithStandalone.standalone !== true

    setIsIOS(ios)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setInstallPrompt(null)
    }

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt
    )

    window.addEventListener(
      'appinstalled',
      handleInstalled
    )

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )

      window.removeEventListener(
        'appinstalled',
        handleInstalled
      )
    }
  }, [])

  async function handleInstall() {
    if (isInstalled) return

    if (installPrompt) {
      await installPrompt.prompt()

      const choice = await installPrompt.userChoice

      if (choice.outcome === 'accepted') {
        setInstallPrompt(null)
      }

      return
    }

    if (isIOS) {
      setShowIOSHelp(true)
      return
    }

    alert(
      'لتثبيت المنصة، افتح قائمة المتصفح واختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق".'
    )
  }

  return (
    <section
      dir="rtl"
      className="mx-auto max-w-4xl px-4 py-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">

        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalled}
          className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-center transition hover:bg-zinc-800 disabled:opacity-70"
        >
          <div className="text-2xl">📲</div>

          <div className="mt-1 font-bold">
            {isInstalled
              ? 'المنصة مثبتة ✓'
              : 'تثبيت المنصة'}
          </div>

          <div className="mt-1 text-sm text-zinc-400">
            أضف المنصة إلى الشاشة الرئيسية
          </div>
        </button>

        <a
          href="https://t.me/fnon_6383"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 text-center transition hover:bg-zinc-800"
        >
          <div className="text-2xl">✈️</div>

          <div className="mt-1 font-bold">
            قناة التليگرام
          </div>

          <div className="mt-1 text-sm text-zinc-400">
            تابع المحاضرات والتنبيهات
          </div>
        </a>

      </div>

      {showIOSHelp && (
        <div className="mt-4 rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
          <div className="font-bold">
            تثبيت المنصة على الآيفون
          </div>

          <div className="mt-3 leading-8 text-zinc-300">
            ١. اضغط زر المشاركة في Safari.
            <br />
            ٢. اختر «إضافة إلى الشاشة الرئيسية».
            <br />
            ٣. اضغط «إضافة».
          </div>

          <button
            type="button"
            onClick={() => setShowIOSHelp(false)}
            className="mt-4 rounded-xl bg-white px-4 py-2 font-bold text-black"
          >
            فهمت
          </button>
        </div>
      )}
    </section>
  )
}
