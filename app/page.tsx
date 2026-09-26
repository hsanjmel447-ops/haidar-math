import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { Courses } from '@/components/courses'
import { LatestLectures } from '@/components/latest-lectures'
import { MinistryQuestions } from '@/components/ministry-questions'
import { PastExams } from '@/components/past-exams'
import { Quizzes } from '@/components/quizzes'
import { NotificationButton } from '@/components/notification-button'
import { Materials } from '@/components/materials'
import { StudentResults } from '@/components/student-results'
import { About } from '@/components/about'
import { Contact } from '@/components/contact'
import { SiteFooter } from '@/components/site-footer'

export default function Page() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <Courses />
        <LatestLectures />
        <MinistryQuestions />
        <PastExams />
        <Quizzes />
        <div className="mx-auto flex max-w-4xl justify-center px-4 py-6">
  <NotificationButton />
</div>
        <Materials />
        <StudentResults />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  )
}