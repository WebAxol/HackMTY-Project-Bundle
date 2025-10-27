"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Download, FileText, Mail, Link2 } from "lucide-react"
import { getReport, type Report } from "@/lib/storage"

export default function ExportPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([])
  const [includeCharts, setIncludeCharts] = useState(true)

  useEffect(() => {
    const loadedReport = getReport(reportId)
    if (!loadedReport) {
      router.push("/dashboard")
      return
    }
    setReport(loadedReport)
    setSelectedBlocks(loadedReport.blocks.map((b) => b.id))
  }, [reportId, router])

  function toggleBlock(blockId: string) {
    setSelectedBlocks((prev) => (prev.includes(blockId) ? prev.filter((id) => id !== blockId) : [...prev, blockId]))
  }

  function handleExportPDF() {
    // En una implementación real, aquí se generaría el PDF
    // Por ahora, redirigimos a la vista previa para usar window.print()
    router.push(`/preview/${reportId}`)
  }

  function handleExportJSON() {
    if (!report) return

    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${report.title.replace(/\s+/g, "-")}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleShareEmail() {
    if (!report) return

    const subject = encodeURIComponent(`Reporte Financiero: ${report.title}`)
    const body = encodeURIComponent(
      `Te comparto el reporte financiero "${report.title}".\n\nVer reporte: ${window.location.origin}/preview/${reportId}`,
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando opciones de exportación...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/editor/${reportId}`}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Exportar y Compartir</h1>
              <p className="text-xs text-muted-foreground">{report.title}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Export Options */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Opciones de Exportación
              </h2>

              <div className="space-y-4">
                <Button onClick={handleExportPDF} className="w-full justify-start" size="lg">
                  <FileText className="h-5 w-5 mr-3" />
                  Exportar como PDF
                </Button>

                <Button
                  onClick={handleExportJSON}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-3" />
                  Descargar JSON
                </Button>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charts"
                      checked={includeCharts}
                      onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                    />
                    <Label htmlFor="charts" className="text-sm cursor-pointer">
                      Incluir gráficos en exportación
                    </Label>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compartir Reporte
              </h2>

              <div className="space-y-4">
                <Button
                  onClick={handleShareEmail}
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  size="lg"
                >
                  <Mail className="h-5 w-5 mr-3" />
                  Compartir por Email
                </Button>

                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/preview/${reportId}`)
                    alert("Enlace copiado al portapapeles")
                  }}
                  variant="outline"
                  className="w-full justify-start"
                  size="lg"
                >
                  <Link2 className="h-5 w-5 mr-3" />
                  Copiar Enlace
                </Button>
              </div>
            </Card>
          </div>

          {/* Block Selection */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Seleccionar Bloques</h2>
            <p className="text-sm text-muted-foreground mb-4">Elige qué bloques incluir en la exportación</p>

            <div className="space-y-3">
              {report.blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={block.id}
                    checked={selectedBlocks.includes(block.id)}
                    onCheckedChange={() => toggleBlock(block.id)}
                  />
                  <Label htmlFor={block.id} className="flex-1 cursor-pointer">
                    <p className="font-medium">{block.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{block.type.replace("-", " ")}</p>
                  </Label>
                </div>
              ))}

              {report.blocks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No hay bloques en este reporte</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bloques seleccionados:</span>
                <span className="font-semibold">
                  {selectedBlocks.length} de {report.blocks.length}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview Info */}
        <Card className="p-6 mt-6 bg-primary/5 border-primary/20">
          <h3 className="font-semibold mb-2">Vista Previa Disponible</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Puedes ver cómo se verá tu reporte antes de exportarlo o compartirlo.
          </p>
          <Button asChild variant="outline">
            <Link href={`/preview/${reportId}`}>Ver Vista Previa</Link>
          </Button>
        </Card>
      </main>
    </div>
  )
}
