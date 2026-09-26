'use client'

import { useState } from 'react'
import { SectionHeading } from './section-heading'

export function Quizzes() {
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <section id="quizzes" className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <SectionHeading
          title="تدريب الأسئلة الوزارية"
          description="حل السؤال بنفسك أولاً، ثم اعرض الإجابة للتأكد من حلك"
        />

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-sm text-muted-foreground">
            السؤال الأول
          </p>

          <h3 className="text-xl font-bold leading-9">
            جد معادلة الدائرة التي مركزها النقطة C(-2,3) ونصف قطرها 4 وحدات.
          </h3>

          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-primary-foreground"
          >
            {showAnswer ? 'إخفاء الإجابة' : 'عرض الإجابة'}
          </button>

          {showAnswer && (
            <div className="mt-6 rounded-xl border border-border p-5">
              <p className="mb-3 font-bold">الإجابة:</p>

              <p dir="ltr" className="text-center text-xl font-bold">
                (x + 2)² + (y - 3)² = 16
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}