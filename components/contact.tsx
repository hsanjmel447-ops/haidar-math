import { MonitorPlay, Send } from 'lucide-react'
import { siteConfig } from '@/lib/site-data'

export function Contact() {
  return (
    <section id="contact" className="container-page scroll-mt-20 py-16 md:py-24">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 text-center sm:px-12 md:py-16">
        <div
          className="pointer-events-none absolute -top-24 right-1/2 h-72 w-72 translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            تواصل معنا
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            انضم إلى المنصة وابدأ رحلتك
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            تابع المحاضرات الجديدة والأسئلة الوزارية أولاً بأول عبر قنواتنا الرسمية.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={siteConfig.social.youtube}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 sm:w-auto"
            >
              <MonitorPlay className="size-5" />
              قناة اليوتيوب
            </a>
            <a
              href={siteConfig.social.telegram}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/40 px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-muted sm:w-auto"
            >
              <Send className="size-5 text-brand" />
              قناة تليجرام
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
