"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, FileText, RotateCcw, Eye } from "lucide-react"
import { getReport, getReportVersions, saveReport, type Report, type ReportVersion } from "@/lib/storage"
import { VersionPreviewDialog } from "@/components/version-preview-dialog"

export default function HistoryPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [versions, setVersions] = useState<ReportVersion[]>([])
  const [previewVersion, setPreviewVersion] = useState<ReportVersion | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    const loadedReport = getReport(reportId)
    if (!loadedReport) {
      router.push("/dashboard")
      return
    }
    setReport(loadedReport)

    const loadedVersions = getReportVersions(reportId)
    setVersions(loadedVersions.sort((a, b) => b.version - a.version))
  }, [reportId, router])

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function handlePreview(version: ReportVersion) {
    setPreviewVersion(version)
    setIsPreviewOpen(true)
  }

  function handleRestore(version: ReportVersion) {
    if (!report) return

    if (confirm(`¿Restaurar a la versión ${version.version}?`)) {
      const restoredReport: Report = {
        ...report,
        blocks: version.blocks,
        version: report.version + 1,
        updatedAt: new Date().toISOString(),
      }
      saveReport(restoredReport)
      setIsPreviewOpen(false)
      router.push(`/editor/${reportId}`)
    }
  }

  function handleRestoreFromPreview() {
    if (!previewVersion) return
    handleRestore(previewVersion)
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
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
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Historial de Versiones</h1>
                <p className="text-xs text-muted-foreground">{report.title}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Current Version */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Versión Actual</h2>
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Versión {report.version}</h3>
                    <Badge>Actual</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{formatDate(report.updatedAt)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{report.blocks.length} bloques</p>
                </div>
              </div>
              <Button asChild>
                <Link href={`/editor/${reportId}`}>Ver Reporte</Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Version History */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Versiones Anteriores</h2>
          {versions.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No hay versiones anteriores</h3>
                  <p className="text-muted-foreground">
                    Las versiones se guardan automáticamente cuando editas el reporte
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <Card key={`${version.reportId}-${version.version}`} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Versión {version.version}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(version.savedAt)}</p>
                        <p className="text-sm text-muted-foreground mt-1">{version.blocks.length} bloques</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => handlePreview(version)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Previsualizar
                      </Button>
                      <Button variant="outline" onClick={() => handleRestore(version)}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Version Preview Dialog */}
      <VersionPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        version={previewVersion}
        reportTitle={report.title}
        financialData={report.financialData}
        onRestore={handleRestoreFromPreview}
      />
    </div>
  )
}
