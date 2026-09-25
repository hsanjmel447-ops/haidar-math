'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItems, siteConfig } from '@/lib/site-data'

function Logo() {
  return (
    <a href="#home" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-brand font-display text-lg font-extrabold text-brand-foreground">
        ح
      </span>
      <span className="font-display text-base font-bold leading-tight sm:text-lg">
        {siteConfig.name}
      </span>
    </a>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#courses"
            className="hidden rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 sm:inline-flex"
          >
            ابدأ التعلم
          </a>
          <button
            type="button"
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          'overflow-hidden border-t border-border/60 lg:hidden',
          open ? 'max-h-[520px]' : 'max-h-0',
          'transition-[max-height] duration-300 ease-in-out',
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#courses"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-brand-foreground"
          >
            ابدأ التعلم
          </a>
        </nav>
      </div>
    </header>
  )
}
