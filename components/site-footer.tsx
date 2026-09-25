import { MonitorPlay, Send } from 'lucide-react'
import { navItems, siteConfig } from '@/lib/site-data'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/30">
      <div className="container-page py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center gap-2.5 md:justify-start">
              <span className="grid size-9 place-items-center rounded-xl bg-brand font-display text-lg font-extrabold text-brand-foreground">
                ح
              </span>
              <span className="font-display text-lg font-bold">{siteConfig.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              منصة تعليمية لتدريس الرياضيات لطلاب السادس المهني في العراق.
            </p>
          </div>

          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-center sm:grid-cols-3 md:text-right">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={siteConfig.social.youtube}
              aria-label="يوتيوب"
              className="grid size-10 place-items-center rounded-xl border border-border transition-colors hover:bg-muted hover:text-brand"
            >
              <MonitorPlay className="size-5" />
            </a>
            <a
              href={siteConfig.social.telegram}
              aria-label="تليجرام"
              className="grid size-10 place-items-center rounded-xl border border-border transition-colors hover:bg-muted hover:text-brand"
            >
              <Send className="size-5" />
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name} — جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  )
}
