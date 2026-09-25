import { FileText, Download, Eye } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { materialCategories } from '@/lib/site-data'

export function Materials() {
  return (
    <section id="materials" className="container-page scroll-mt-20 py-16 md:py-24">
      <SectionHeading
        eyebrow="الملازم والملخصات"
        title="ملازم وملخصات جاهزة للتحميل"
        description="ملازم الفصول وملخصات القوانين والمراجعات السريعة والتمارين، تُضاف ملفاتها تباعاً."
      />

      <div className="mt-12 space-y-12">
        {materialCategories.map((category) => (
          <div key={category.id}>
            <div className="flex flex-col gap-1 border-b border-border pb-4">
              <h3 className="text-lg font-bold">{category.title}</h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </div>

            {category.items.length > 0 ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-brand/40"
                  >
                    <div className="grid aspect-[4/3] place-items-center border-b border-border bg-muted/40">
                      {item.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.coverImage || '/placeholder.svg'}
                          alt={item.title}
                          className="size-full object-cover"
                        />
                      ) : (
                        <FileText className="size-10 text-brand/60" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h4 className="text-base font-bold leading-snug">{item.title}</h4>
                      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                      {item.fileUrl ? (
                        <div className="mt-4 flex gap-2">
                          <a
                            href={item.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
                          >
                            <Eye className="size-4" />
                            عرض
                          </a>
                          <a
                            href={item.fileUrl}
                            download
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
                          >
                            <Download className="size-4" />
                            تحميل
                          </a>
                        </div>
                      ) : (
                        <span className="mt-4 inline-flex w-fit items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                          قريباً
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 grid place-items-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
                <FileText className="size-8 text-muted-foreground/60" />
                <p className="mt-3 text-sm text-muted-foreground">
                  ستُضاف الملفات هنا قريباً.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
