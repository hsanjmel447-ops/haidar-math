'use client'

import { useState } from 'react'
import { SectionHeading } from './section-heading'

type Step = {
  text: string
  math?: boolean
}

type Question = {
  question: string
  steps: Step[]
}

const questions: Question[] = [
  {
    question:
      'جد إحداثيات المركز وطول نصف قطر الدائرة التي معادلتها (x + 5)² + (y - 3)² = 36',
    steps: [
      { text: '(x - h)² + (y - k)² = r²', math: true },
      { text: 'بالمقارنة نجد أن:' },
      { text: 'h = -5', math: true },
      { text: 'k = 3', math: true },
      { text: 'r = 6', math: true },
      { text: '(h, k) = (-5, 3)   ,   r = 6', math: true },
    ],
  },

  {
    question:
      'جد إحداثيات المركز وطول نصف قطر الدائرة التي معادلتها (x - 4)² + y² = 9',
    steps: [
      { text: '(x - h)² + (y - k)² = r²', math: true },
      { text: 'h = 4', math: true },
      { text: 'k = 0', math: true },
      { text: '(h, k) = (4, 0)   ,   r = 3', math: true },
    ],
  },

  {
    question:
      'جد معادلة الدائرة التي تمس المحورين وتمر بالنقطة (2,4)',
    steps: [
      { text: 'أفرض المركز (r, r)' },
      { text: '(x - h)² + (y - k)² = r²', math: true },
      { text: 'أعوض بالقانون:' },
      { text: '(2 - r)² + (4 - r)² = r²', math: true },
      { text: 'أفتح مربع الحدانية:' },
      { text: '4 - 4r + r² + 16 - 8r + r² = r²', math: true },
      { text: 'r² - 12r + 20 = 0', math: true },
      { text: '(r - 10)(r - 2) = 0', math: true },
      { text: 'r = 10   ,   r = 2', math: true },
      { text: 'h = 10   ,   h = 2', math: true },
      { text: 'k = 10   ,   k = 2', math: true },
      { text: '(x - h)² + (y - k)² = r²', math: true },
      { text: '(x - 10)² + (y - 10)² = 100', math: true },
      { text: '(x - 2)² + (y - 2)² = 4', math: true },
    ],
  },

  {
    question:
      'جد معادلة الدائرة التي تمس المحورين ونصف قطرها 4 وحدات وتقع في الربع الرابع',
    steps: [
      { text: 'r = 4', math: true },
      { text: 'h = 4', math: true },
      { text: 'k = -4', math: true },
      { text: '(x - h)² + (y - k)² = r²', math: true },
      { text: '(x - 4)² + (y + 4)² = 16', math: true },
      { text: 'لأنها في الربع الرابع' },
    ],
  },

  {
    question:
      'دائرة مركزها (2,a) ونصف قطرها 4 وحدات وتمس المحور (x)، جد قيمة a ومعادلة الدائرة',
    steps: [
      { text: '(x - h)² + (y - k)² = r²', math: true },
      { text: '(x - 2)² + (y - a)² = 16', math: true },
      { text: 'a = 4', math: true },
      { text: '(x - 2)² + (y - 4)² = 16', math: true },
    ],
  },

  {
    question:
      'جد معادلة الدائرة التي مركزها النقطة C(2,-1) وتمر بنقطة الأصل (0,0)',
    steps: [
      { text: 'قانون الجذر:' },
      { text: 'r = √((x - h)² + (y - k)²)', math: true },
      { text: 'نعوض:' },
      { text: 'r = √((0 - 2)² + (0 + 1)²)', math: true },
      { text: 'r = √((-2)² + (+1)²)', math: true },
      { text: 'r = √(4 + 1)', math: true },
      { text: 'r = √5', math: true },
      { text: 'قانون الدائرة:' },
      { text: '(x - h)² + (y - k)² = r²', math: true },
      { text: 'نعوض بدون جذر:' },
      { text: '(x - 2)² + (y + 1)² = 5', math: true },
    ],
  },
]

function formatQuestion(text: string) {
  const equationStart = text.indexOf('(')

  if (equationStart === -1) {
    return text
  }

  const arabicPart = text.slice(0, equationStart)
  const mathPart = text.slice(equationStart)

  return (
    <>
      <span>{arabicPart}</span>
      <span
        dir="ltr"
        className="mt-3 block font-mono text-[19px] sm:text-2xl"
      >
        {mathPart}
      </span>
    </>
  )
}

export function Quizzes() {
  const [current, setCurrent] = useState(0)
  const [showSolution, setShowSolution] = useState(false)

  const question = questions[current]

  const nextQuestion = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setShowSolution(false)
    }
  }

  const previousQuestion = () => {
    if (current > 0) {
      setCurrent(current - 1)
      setShowSolution(false)
    }
  }

  return (
    <section id="quizzes" className="py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4">

        <SectionHeading
          title="الاختبارات الإلكترونية"
          description="اختبر نفسك بالأسئلة الوزارية وشاهد الحل الكامل خطوة بخطوة"
        />

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 sm:p-7">

          <div className="mb-6 text-sm text-muted-foreground">
            السؤال {current + 1} من {questions.length}
          </div>

          <div
            dir="rtl"
            className="text-right text-[20px] font-bold leading-[1.9] sm:text-2xl"
          >
            {formatQuestion(question.question)}
          </div>

          <button
            type="button"
            onClick={() => setShowSolution(!showSolution)}
            className="mt-7 rounded-xl bg-yellow-400 px-7 py-3 text-lg font-bold text-black"
          >
            {showSolution ? 'إخفاء الحل' : 'عرض الحل'}
          </button>

          {showSolution && (
            <div className="mt-7 rounded-2xl border border-border bg-background p-4 sm:p-6">

              <h4 className="mb-5 text-right text-xl font-bold">
                الحل:
              </h4>

              <div className="space-y-3">
                {question.steps.map((step, index) => (
                  <div
                    key={index}
                    dir={step.math ? 'ltr' : 'rtl'}
                    className={
                      step.math
                        ? 'overflow-x-auto rounded-lg border border-border/60 bg-card px-3 py-3 text-left font-mono text-[17px] leading-8 sm:text-xl'
                        : 'px-1 py-1 text-right text-[17px] leading-8 sm:text-lg'
                    }
                  >
                    {step.text}
                  </div>
                ))}
              </div>

            </div>
          )}

          <div className="mt-8 grid grid-cols-2 gap-3">

            <button
              type="button"
              onClick={previousQuestion}
              disabled={current === 0}
              className="rounded-xl border border-border px-3 py-3 text-base font-bold disabled:opacity-30 sm:text-lg"
            >
              السؤال السابق
            </button>

            <button
              type="button"
              onClick={nextQuestion}
              disabled={current === questions.length - 1}
              className="rounded-xl border border-border px-3 py-3 text-base font-bold disabled:opacity-30 sm:text-lg"
            >
              السؤال التالي
            </button>

          </div>

        </div>
      </div>
    </section>
  )
}