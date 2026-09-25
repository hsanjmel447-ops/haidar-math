import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { Courses } from '@/components/courses'
import { LatestLectures } from '@/components/latest-lectures'
import { MinistryQuestions } from '@/components/ministry-questions'
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
        <Materials />
        <StudentResults />
        <About />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  )
}
