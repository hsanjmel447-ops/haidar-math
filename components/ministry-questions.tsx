import { FileText, ArrowLeft } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { ministryTopics } from '@/lib/site-data'

export function MinistryQuestions() {
  return (
    <section id="ministry" className="container-page scroll-mt-20 py-16 md:py-24">
      <SectionHeading
        eyebrow="الأسئلة الوزارية"
        title="الأسئلة الوزارية مرتبة حسب الموضوع"
        description="تدرب على مجموعة مختارة من الأسئلة الوزارية مرتبة حسب الموضوع."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ministryTopics.map((topic) => (
          <article
            key={topic.id}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/40"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
              <FileText className="size-5" />
            </span>
            <span className="flex-1 text-base font-bold text-foreground">
              {topic.title}
            </span>
            <ArrowLeft className="size-4 text-muted-foreground transition-all group-hover:-translate-x-1 group-hover:text-brand" />
          </article>
        ))}
      </div>
    </section>
  )
}
