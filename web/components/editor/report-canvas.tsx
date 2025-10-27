"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableBlock } from "./sortable-block"
import { Card } from "@/components/ui/card"
import { FileText } from "lucide-react"
import type { Report } from "@/lib/storage"

interface ReportCanvasProps {
  report: Report
  onRemoveBlock: (blockId: string) => void
}

export function ReportCanvas({ report, onRemoveBlock }: ReportCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: "canvas",
  })

  return (
    <main ref={setNodeRef} className="flex-1 overflow-y-auto bg-muted/30 p-8">
      <div className="max-w-4xl mx-auto">
        {report.blocks.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Canvas vacío</h3>
                <p className="text-muted-foreground text-pretty">
                  Arrastra bloques desde el panel lateral para comenzar a construir tu reporte
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {report.blocks.map((block) => (
              <SortableBlock key={block.id} block={block} report={report} onRemove={onRemoveBlock} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
