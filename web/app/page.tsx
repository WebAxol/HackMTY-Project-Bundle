"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Plus, Search, MoreVertical, Trash2, Eye, Clock, Calendar } from "lucide-react"
import { getReports, deleteReport, type Report } from "@/lib/storage"
import { formatCurrency } from "@/lib/financial-utils"
import Image from "next/image"

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredReports, setFilteredReports] = useState<Report[]>([])

  useEffect(() => {
    loadReports()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredReports(reports)
    } else {
      const filtered = reports.filter((report) => report.title.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredReports(filtered)
    }
  }, [searchQuery, reports])

  function loadReports() {
    const loadedReports = getReports()
    setReports(loadedReports.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()))
  }

  function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar este reporte?")) {
      deleteReport(id)
      loadReports()
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/banorte-logo.png" alt="Banorte" width={120} height={40} className="h-10 w-auto" />
            <div className="border-l border-border pl-3">
              <h1 className="text-xl font-semibold text-balance">Reportes Financieros</h1>
              <p className="text-xs text-muted-foreground">Generador Automático</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/schedule">
                <Calendar className="h-4 w-4 mr-2" />
                Calendario
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Reportes Financieros Banorte</h2>
          <p className="text-lg text-muted-foreground mb-8 text-pretty">
            Crea, personaliza y comparte reportes financieros profesionales
          </p>
          <Button size="lg" asChild className="shadow-lg">
            <Link href="/editor/new">
              <Plus className="h-5 w-5 mr-2" />
              Crear Reporte
            </Link>
          </Button>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-balance">Reportes Anteriores</h3>
              <p className="text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {reports.length} {reports.length === 1 ? "reporte guardado" : "reportes guardados"}
              </p>
            </div>
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de reporte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 shadow-sm"
              />
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <Card className="p-16 text-center">
              <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-2xl font-semibold mb-3 text-balance">
                    {searchQuery ? "No se encontraron reportes" : "Aún no tienes reportes"}
                  </h4>
                  <p className="text-muted-foreground mb-6 text-balance">
                    {searchQuery
                      ? "Intenta con otro término de búsqueda"
                      : "Crea tu primer reporte financiero profesional"}
                  </p>
                  {!searchQuery && (
                    <Button size="lg" asChild>
                      <Link href="/editor/new">
                        <Plus className="h-5 w-5 mr-2" />
                        Crear Primer Reporte
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="p-6 group hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-balance line-clamp-2 mb-1">{report.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          Versión {report.version}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/editor/${report.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver/Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/history/${report.id}`}>
                            <Clock className="h-4 w-4 mr-2" />
                            Ver Historial
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(report.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3 mb-5 p-4 rounded-lg bg-muted/30">
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm font-medium text-muted-foreground">Componentes</span>
                      <Badge variant="outline" className="font-semibold">
                        {report.blocks.length} bloques
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Última modificación</span>
                      <span className="text-foreground font-semibold">{formatDate(report.updatedAt)}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
