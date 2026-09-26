'use client'

import { useState } from 'react'
import { SectionHeading } from './section-heading'

const questions = [
  {
    question:
      'جد إحداثيات المركز وطول نصف قطر الدائرة التي معادلتها (x + 5)² + (y - 3)² = 36',
    solution: [
      '(x - h)² + (y - k)² = r²',
      'h = -5',
      'k = 3',
      'r = 6',
      '(h, k) = (-5, 3) ، r = 6',
    ],
  },
  {
    question:
      'جد إحداثيات المركز وطول نصف قطر الدائرة التي معادلتها (x - 4)² + y² = 9',
    solution: [
      '(x - h)² + (y - k)² = r²',
      'h = 4',
      'k = 0',
      '(h, k) = (4, 0) ، r = 3',
    ],
  },
  {
    question:
      'جد معادلة الدائرة التي تمس المحورين وتمر بالنقطة (2,4)',
    solution: [
      'أفرض المركز (r, r)',
      '(x - h)² + (y - k)² = r²',
      '(2 - r)² + (4 - r)² = r²',
      '4 - 4r + r² + 16 - 8r + r² = r²',
      'r² - 12r + 20 = 0',
      '(r - 10)(r - 2) = 0',
      'r = 10 ، r = 2',
      'h = 10 ، h = 2',
      'k = 10 ، k = 2',
      '(x - 10)² + (y - 10)² = 100',
      '(x - 2)² + (y - 2)² = 4',
    ],
  },
  {
    question:
      'جد معادلة الدائرة التي تمس المحورين ونصف قطرها 4 وحدات وتقع في الربع الرابع',
    solution: [
      'r = 4',
      'h = 4',
      'k = -4',
      '(x - h)² + (y - k)² = r²',
      '(x - 4)² + (y + 4)² = 16',
      'لأنها في الربع الرابع',
    ],
  },
  {
    question:
      'دائرة مركزها (2,a) ونصف قطرها 4 وحدات وتمس المحور (x)، جد قيمة a ومعادلة الدائرة',
    solution: [
      '(x - h)² + (y - k)² = r²',
      '(x - 2)² + (y - a)² = 16',
      'a = 4',
      '(x - 2)² + (y - 4)² = 16',
    ],
  },
  {
    question:
      'جد معادلة الدائرة التي مركزها النقطة C(2,-1) وتمر بنقطة الأصل (0,0)',
    solution: [
      'قانون الجذر:',
      'r = √((x - h)² + (y - k)²)',
      'نعوض:',
      'r = √((0 - 2)² + (0 + 1)²)',
      'r = √((-2)² + (+1)²)',
      'r = √(4 + 1)',
      'r = √5',
      'قانون الدائرة:',
      '(x - h)² + (y - k)² = r²',
      'نعوض بدون جذر:',
      '(x - 2)² + (y + 1)² = 5',
    ],
  },
]

export function Quizzes() {
  const [current, setCurrent] = useState(0)
  const [showSolution, setShowSolution] = useState(false)

  const question = questions[current]

  function nextQuestion() {
    if (current < questions.length - 1) {
      setCurrent(current + 1)
      setShowSolution(false)
    }
  }

  function previousQuestion() {
    if (current > 0) {
      setCurrent(current - 1)
      setShowSolution(false)
    }
  }

  return (
    <section id="quizzes" className="py-20">
      <div className="mx-auto max-w-4xl px-4">
        <SectionHeading
          title="الاختبارات الإلكترونية"
          description="اختبر نفسك بالأسئلة الوزارية وشاهد الحل الكامل خطوة بخطوة"
        />

        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <div className="mb-5 text-sm text-muted-foreground">
            السؤال {current + 1} من {questions.length}
          </div>

          <h3 className="text-xl font-bold leading-9">
            {question.question}
          </h3>

          <button
            onClick={() => setShowSolution(!showSolution)}
            className="mt-6 rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black"
          >
            {showSolution ? 'إخفاء الحل' : 'عرض الحل'}
          </button>

          {showSolution && (
            <div className="mt-6 rounded-xl border border-border bg-background p-5">
              <h4 className="mb-4 text-lg font-bold">الحل:</h4>

              <div dir="rtl" className="space-y-3 text-lg">
                {question.solution.map((step, index) => (
                  <div key={index}>{step}</div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              onClick={previousQuestion}
              disabled={current === 0}
              className="rounded-xl border border-border px-5 py-3 font-bold disabled:opacity-30"
            >
              السؤال السابق
            </button>

            <button
              onClick={nextQuestion}
              disabled={current === questions.length - 1}
              className="rounded-xl border border-border px-5 py-3 font-bold disabled:opacity-30"
            >
              السؤال التالي
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}