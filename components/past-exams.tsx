'use client'

import { useState } from 'react'
import { SectionHeading } from './section-heading'

type Exam = {
  title: string
  file: string
}

type Year = {
  year: string
  exams: Exam[]
}

const years: Year[] = [
  {
    year: '2022',
    exams: [
      {
        title: 'الدور التمهيدي',
        file: '/past-exams/2022/preliminary.jpeg',
      },
      {
        title: 'الدور الأول',
        file: '/past-exams/2022/first-round.jpeg',
      },
      {
        title: 'الدور الثاني',
        file: '/past-exams/2022/second-round.jpeg',
      },
    ],
  },
  {
    year: '2023',
    exams: [
      {
        title: 'الدور التمهيدي',
        file: '/past-exams/2023/preliminary.jpeg',
      },
      {
        title: 'الدور الأول',
        file: '/past-exams/2023/first-round.jpeg',
      },
      {
        title: 'الدور الثاني',
        file: '/past-exams/2023/second-round.jpeg',
      },
      {
        title: 'الدور الثالث',
        file: '/past-exams/2023/third-round.jpeg',
      },
    ],
  },
  {
    year: '2024',
    exams: [
      {
        title: 'الدور التمهيدي',
        file: '/past-exams/2024/preliminary.jpeg',
      },
      {
        title: 'الدور الأول',
        file: '/past-exams/2024/first-round.jpeg',
      },
      {
        title: 'الدور الثالث',
        file: '/past-exams/2024/third-round.jpeg',
      },
    ],
  },
  {
    year: '2026',
    exams: [
      {
        title: 'الدور التمهيدي',
        file: '/past-exams/2026/preliminary.jpeg',
      },
      {
        title: 'الدور الأول',
        file: '/past-exams/2026/first-round.jpeg',
      },
      {
        title: 'الدور الثاني',
        file: '/past-exams/2026/second-round.jpeg',
      },
      {
        title: 'الدور الثالث',
        file: '/past-exams/2026/third-round.jpeg',
      },
    ],
  },
]

export function PastExams() {
  const [selectedYear, setSelectedYear] = useState('2026')

  const currentYear = years.find((item) => item.year === selectedYear)

  return (
    <section id="past-exams" className="py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <SectionHeading
          title="الأسئلة الوزارية للسنوات السابقة"
          description="اختر السنة والدور لعرض ورقة الأسئلة الوزارية"
        />

        <div
          dir="rtl"
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {years.map((item) => (
            <button
              key={item.year}
              type="button"
              onClick={() => setSelectedYear(item.year)}
              className={`rounded-xl border px-4 py-4 text-lg font-bold transition-colors ${
                selectedYear === item.year
                  ? 'border-yellow-400 bg-yellow-400 text-black'
                  : 'border-border bg-card hover:border-yellow-400/50'
              }`}
            >
              {item.year}
            </button>
          ))}
        </div>

        {currentYear && (
          <div className="mt-8">
            <h3
              dir="rtl"
              className="mb-5 text-right text-2xl font-bold"
            >
              أسئلة سنة {currentYear.year}
            </h3>

            <div
              dir="rtl"
              className="grid gap-4 sm:grid-cols-2"
            >
              {currentYear.exams.map((exam) => (
                <a
                  key={exam.file}
                  href={exam.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-border bg-card p-5 text-right transition-colors hover:border-yellow-400/50"
                >
                  <div className="text-lg font-bold">
                    {exam.title}
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    اضغط لعرض الأسئلة
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}