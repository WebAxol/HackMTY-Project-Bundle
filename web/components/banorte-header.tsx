import type React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface BanorteHeaderProps {
  title?: string
  subtitle?: string
  showActions?: boolean
  actions?: React.ReactNode
}

export function BanorteHeader({ title, subtitle, showActions = true, actions }: BanorteHeaderProps) {
  return (
    <header className="bg-card/80 backdrop-blur-md border border-border/50 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image src="/banorte-logo.png" alt="Banorte" width={140} height={45} className="h-11 w-auto" priority />
            </Link>
            {(title || subtitle) && (
              <div className="hidden md:flex items-center border-l-2 border-primary/20 pl-4 ml-2">
                {title && <h1 className="text-xl font-semibold text-balance leading-tight">{title}</h1>}
                {subtitle && <p className="text-xs text-muted-foreground ml-6 mt-1">{subtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showActions && (
              <div className="flex items-center gap-2">
                {actions || (
                  <>
                    <Button variant="outline" asChild className="hidden sm:flex bg-transparent">
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <Button asChild className="shadow-sm">
                      <Link href="/editor/new">Nuevo Reporte</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
