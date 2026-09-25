import { Play, MonitorPlay } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { lectures, siteConfig } from '@/lib/site-data'

export function LatestLectures() {
  return (
    <section id="lectures" className="scroll-mt-20 bg-card/30 py-16 md:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="المحاضرات المجانية"
          title="المحاضرات المجانية"
          description="ابدأ التعلم الآن. ستُضاف هنا المحاضرات المجانية تباعاً وتُربط بفيديوهات قناة اليوتيوب الرسمية."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {lectures.map((lecture) => {
            const href = lecture.youtubeUrl || siteConfig.social.youtube
            return (
              <a
                key={lecture.id}
                href={href}
                className="group block overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-brand/40"
              >
                <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-muted to-background">
                  <div className="bg-grid absolute inset-0 opacity-40" aria-hidden="true" />
                  <span className="relative grid size-14 place-items-center rounded-full bg-brand text-brand-foreground transition-transform group-hover:scale-110">
                    <Play className="size-6 translate-x-px" />
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-bold leading-snug">{lecture.title}</h3>
                  <span className="mt-2 inline-block text-xs font-medium text-muted-foreground">
                    قريباً على يوتيوب
                  </span>
                </div>
              </a>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          <a
            href={siteConfig.social.youtube}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <MonitorPlay className="size-5 text-brand" />
            شاهد جميع المحاضرات على يوتيوب
          </a>
        </div>
      </div>
    </section>
  )
}
