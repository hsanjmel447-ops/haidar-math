import { SectionHeading } from './section-heading'

export function Quizzes() {
  return (
    <section id="quizzes" className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          title="الاختبارات الإلكترونية"
          description="اختبر مستواك في الرياضيات وتأكد من فهمك للموضوع"
        />

        <div className="mt-10">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-xl font-bold">اختبار الدائرة</h3>

            <p className="mt-2 text-muted-foreground">
              قريباً سنبدأ أول اختبار إلكتروني.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}