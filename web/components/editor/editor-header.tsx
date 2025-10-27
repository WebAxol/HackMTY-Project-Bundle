"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Share2, Download } from "lucide-react"
import type { Report } from "@/lib/storage"

interface EditorHeaderProps {
  report: Report
  onUpdateReport: (updates: Partial<Report>) => void
  onSaveVersion: () => void
}

export function EditorHeader({ report, onUpdateReport, onSaveVersion }: EditorHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [title, setTitle] = useState(report.title)

  function handleSaveTitle() {
    if (title.trim()) {
      onUpdateReport({ title: title.trim() })
    }
    setIsEditingTitle(false)
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>

            {isEditingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle()
                  if (e.key === "Escape") {
                    setTitle(report.title)
                    setIsEditingTitle(false)
                  }
                }}
                className="max-w-md"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="text-lg font-semibold hover:text-primary transition-colors truncate"
              >
                {report.title}
              </button>
            )}

            <span className="text-xs text-muted-foreground whitespace-nowrap">v{report.version}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onSaveVersion}>
              <Save className="h-4 w-4 mr-2" />
              Guardar Versión
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/preview/${report.id}`}>
                <Share2 className="h-4 w-4 mr-2" />
                Vista Previa
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href={`/export/${report.id}`}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
