"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FileText, Plus, Search, MoreVertical, Trash2, Eye, Clock, Calendar, TrendingUp, BarChart3 } from "lucide-react"
import { getReports, deleteReport, type Report } from "@/lib/storage"
import { formatCurrency } from "@/lib/financial-utils"
import { BanorteHeader } from "@/components/banorte-header"

export default function DashboardPage() {
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
    <div className="min-h-screen bg-background">
      <BanorteHeader
        title="Dashboard Financiero"
        subtitle="Gestión de Reportes"
        actions={
          <>
            <Button variant="outline" asChild className="hidden sm:flex bg-transparent">
              <Link href="/schedule">
                <Calendar className="h-4 w-4 mr-2" />
                Calendario
              </Link>
            </Button>
            <Button asChild className="shadow-sm">
              <Link href="/editor/new">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Reporte
              </Link>
            </Button>
          </>
        }
      />

      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-8">
            <div className="animate-slide-up">
              <h2 className="text-3xl font-bold mb-2 text-balance">Mis Reportes Financieros</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                {reports.length} {reports.length === 1 ? "reporte activo" : "reportes activos"}
              </p>
            </div>
            <div className="relative w-full lg:w-96 animate-slide-up">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre de reporte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 p-6 hover:scale-[1.02] animate-scale-in">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Total de Reportes</p>
                  <p className="text-3xl font-bold text-foreground">{reports.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Documentos generados</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 p-6 hover:scale-[1.02] animate-scale-in"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Este Mes</p>
                  <p className="text-3xl font-bold text-foreground">
                    {
                      reports.filter((r) => {
                        const reportDate = new Date(r.createdAt)
                        const now = new Date()
                        return (
                          reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear()
                        )
                      }).length
                    }
                  </p>
                  <p className="text-xs text-success mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Reportes nuevos
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Plus className="h-7 w-7" />
                </div>
              </div>
            </div>

            <div
              className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 p-6 hover:scale-[1.02] animate-scale-in"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Última Actualización</p>
                  <p className="text-lg font-semibold text-foreground">
                    {reports.length > 0 ? formatDate(reports[0].updatedAt) : "Sin actividad"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Modificación reciente</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-chart-3/10 text-chart-3">
                  <Clock className="h-7 w-7" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <Card className="bg-card rounded-xl border border-border shadow-lg hover:shadow-xl transition-all duration-300 p-16 text-center animate-scale-in">
            <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-balance">
                  {searchQuery ? "No se encontraron reportes" : "Comienza tu análisis financiero"}
                </h3>
                <p className="text-muted-foreground mb-6 text-balance">
                  {searchQuery
                    ? "Intenta con otro término de búsqueda o ajusta los filtros"
                    : "Crea tu primer reporte financiero profesional con nuestro editor interactivo"}
                </p>
                {!searchQuery && (
                  <Button size="lg" asChild className="shadow-md">
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
            {filteredReports.map((report, index) => (
              <Card
                key={report.id}
                className="bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 p-6 group animate-scale-in hover:scale-[1.02]"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-balance line-clamp-2 mb-1">{report.title}</h3>
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
                  <div className="flex items-center justify-between">
      
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
      </main>
    </div>
  )
}
