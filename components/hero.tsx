import Image from 'next/image'
import { Play } from 'lucide-react'
import { siteConfig } from '@/lib/site-data'

export function Hero() {
  return (
    <section id="home" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 right-1/2 h-[520px] w-[520px] translate-x-1/2 rounded-full bg-brand/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container-page relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="text-center lg:text-right">
          <span className="inline-flex items-center rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            رياضيات السادس المهني — العراق
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.15] text-balance sm:text-5xl md:text-6xl">
            {siteConfig.teacher}
          </h1>
          <p className="mt-3 font-display text-xl font-bold text-brand sm:text-2xl md:text-3xl">
            {siteConfig.tagline}
          </p>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground lg:mx-0 sm:text-lg">
            تعلم الرياضيات خطوة بخطوة واستعد للامتحان بثقة.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <a
              href="#courses"
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-brand-foreground transition-opacity hover:opacity-90 sm:w-auto"
            >
              ابدأ التعلم
            </a>
            <a
              href="#lectures"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/50 px-6 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
            >
              <Play className="size-4 text-brand" />
              شاهد المحاضرات المجانية
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card">
            <Image
              src="/hero-math.png"
              alt="رسم توضيحي لمفاهيم الرياضيات"
              width={720}
              height={720}
              priority
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  )
}
