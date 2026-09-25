import { Trophy } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { studentResults } from '@/lib/site-data'

export function StudentResults() {
  return (
    <section id="results" className="scroll-mt-20 bg-card/30 py-16 md:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="نتائج طلابنا"
          title="نتائج طلابنا"
          description="سيتم عرض نتائج الطلاب الحقيقية في هذا القسم عند توفّرها."
        />

        {studentResults.length > 0 ? (
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {studentResults.map((result) => (
              <figure
                key={result.id}
                className="flex flex-col rounded-2xl border border-border bg-card p-6"
              >
                <Trophy className="size-7 text-brand" />
                <figcaption className="mt-4 text-lg font-bold text-foreground">
                  {result.name}
                </figcaption>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {result.detail}
                </p>
              </figure>
            ))}
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand/10 text-brand">
              <Trophy className="size-7" />
            </span>
            <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground">
              هذا القسم مخصّص لعرض نتائج طلابنا الحقيقية، وسيتم تحديثه قريباً بأسماء
              ونتائج الطلاب المتفوقين.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
