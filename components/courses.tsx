import { Check } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { chapters } from '@/lib/site-data'

export function Courses() {
  return (
    <section id="courses" className="container-page scroll-mt-20 py-16 md:py-24">
      <SectionHeading
        eyebrow="الدورات التعليمية"
        title="منهج السادس المهني منظّم حسب الفصول"
        description="محتوى مرتّب فصلاً بفصل يغطّي القطوع المخروطية والمشتقة والتكامل، مع التركيز على فهم الأفكار الأساسية."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {chapters.map((chapter) => (
          <article
            key={chapter.id}
            className="flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-brand/40"
          >
            <span className="inline-flex w-fit items-center rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
              {chapter.order}
            </span>
            <h3 className="mt-4 text-lg font-bold leading-snug">{chapter.title}</h3>
            <ul className="mt-5 space-y-3 border-t border-border pt-5">
              {chapter.topics.map((topic) => (
                <li key={topic} className="flex items-start gap-2.5">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
                    <Check className="size-3" />
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/90">
                    {topic}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}
