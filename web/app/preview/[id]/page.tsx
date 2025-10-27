"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2 } from "lucide-react"
import { getReport, type Report } from "@/lib/storage"
import { BlockContent } from "@/components/editor/block-content"

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    const loadedReport = getReport(reportId)
    if (!loadedReport) {
      router.push("/dashboard")
      return
    }
    setReport(loadedReport)
    setShareUrl(`${window.location.origin}/preview/${reportId}`)
  }, [reportId, router])

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl)
    alert("Enlace copiado al portapapeles")
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando vista previa...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/editor/${reportId}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{report.title}</h1>
                <p className="text-xs text-muted-foreground">Vista Previa</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCopyLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Copiar Enlace
              </Button>
              <Button onClick={() => window.print()}>
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-card rounded-lg border border-border p-8 print:border-0 print:p-0">
          {/* Report Header */}
          <div className="mb-8 pb-6 border-b border-border">
            <h1 className="text-3xl font-bold mb-2">{report.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Período: {report.financialData.periodo}</span>
              <span>•</span>
              <span>Versión: {report.version}</span>
              <span>•</span>
              <span>Generado: {new Date(report.updatedAt).toLocaleDateString("es-MX")}</span>
            </div>
          </div>

          {/* Report Blocks */}
          {report.blocks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Este reporte no tiene bloques aún</p>
            </div>
          ) : (
            <div className="space-y-8">
              {report.blocks.map((block, index) => (
                <div key={block.id} className="print:break-inside-avoid">
                  {index > 0 && <div className="border-t border-border my-8" />}
                  <h2 className="text-2xl font-semibold mb-4">{block.title}</h2>
                  <BlockContent block={block} financialData={report.financialData} />
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>Generado con Simulador de Reportes Financieros</p>
            <p className="mt-1">{new Date().toLocaleDateString("es-MX", { dateStyle: "long" })}</p>
          </div>
        </div>
      </main>
    </div>
  )
}
