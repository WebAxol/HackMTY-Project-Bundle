"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, RotateCcw } from "lucide-react"
import { BlockContent } from "@/components/editor/block-content"
import type { ReportVersion } from "@/lib/storage"
import type { FinancialData } from "@/lib/types"

interface VersionPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  version: ReportVersion | null
  reportTitle: string
  financialData: FinancialData
  onRestore: () => void
}

export function VersionPreviewDialog({
  open,
  onOpenChange,
  version,
  reportTitle,
  financialData,
  onRestore,
}: VersionPreviewDialogProps) {
  if (!version) return null

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-MX", { dateStyle: "long" })
  }

  function handleDownloadPDF() {
    // Create a temporary container for printing
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const content = document.getElementById("version-preview-content")
    if (!content) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${reportTitle} - Versión ${version.version}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
            }
            h1 { font-size: 28px; margin-bottom: 8px; }
            h2 { font-size: 20px; margin-top: 24px; margin-bottom: 12px; }
            .header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
            .metadata { color: #6b7280; font-size: 14px; }
            .block-separator { margin: 32px 0; border-top: 1px solid #e5e7eb; }
            .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista Previa - Versión {version.version}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div id="version-preview-content">
            {/* Report Header */}
            <div className="header mb-8 pb-6 border-b border-border">
              <h1 className="text-3xl font-bold mb-2">{reportTitle}</h1>
              <div className="metadata flex items-center gap-4 text-sm text-muted-foreground">
                <span>Período: {financialData.periodo}</span>
                <span>•</span>
                <span>Versión: {version.version}</span>
                <span>•</span>
                <span>Guardado: {formatDate(version.savedAt)}</span>
              </div>
            </div>

            {/* Report Blocks */}
            {version.blocks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Esta versión no tiene bloques</p>
              </div>
            ) : (
              <div className="space-y-8">
                {version.blocks.map((block, index) => (
                  <div key={block.id}>
                    {index > 0 && <div className="block-separator border-t border-border my-8" />}
                    <h2 className="text-2xl font-semibold mb-4">{block.title}</h2>
                    <BlockContent block={block} financialData={financialData} />
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="footer mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              <p>Generado con Simulador de Reportes Financieros</p>
              <p className="mt-1">{formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button onClick={onRestore}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar Versión
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
