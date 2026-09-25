import { siteConfig, aboutText } from '@/lib/site-data'

export function About() {
  return (
    <section id="about" className="container-page scroll-mt-20 py-16 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="relative order-2 lg:order-1">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8">
            <div className="bg-grid absolute inset-0 opacity-40" aria-hidden="true" />
            <div className="relative">
              <span className="grid size-16 place-items-center rounded-2xl bg-brand font-display text-3xl font-extrabold text-brand-foreground">
                ح
              </span>
              <p className="mt-6 font-display text-xl font-bold">
                {siteConfig.teacher}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                مدرّس رياضيات — السادس المهني
              </p>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            عن الأستاذ
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            نبذة عن الأستاذ حيدر محمد
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            {aboutText}
          </p>
        </div>
      </div>
    </section>
  )
}
