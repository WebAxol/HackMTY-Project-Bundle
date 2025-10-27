"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, Plus, ArrowLeft, MoreVertical, Trash2, Edit, Clock, Users, FileText } from "lucide-react"
import {
  getScheduledSends,
  updateScheduledSendStatus,
  deleteScheduledSend,
  getReports,
  type ScheduledSend,
} from "@/lib/storage"

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduledSend[]>([])
  const [reports, setReports] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    loadSchedules()
    loadReportTitles()
  }, [])

  function loadSchedules() {
    const loadedSchedules = getScheduledSends()
    setSchedules(loadedSchedules.sort((a, b) => new Date(a.nextSend).getTime() - new Date(b.nextSend).getTime()))
  }

  function loadReportTitles() {
    const allReports = getReports()
    const titleMap = new Map<string, string>()
    allReports.forEach((report) => {
      titleMap.set(report.id, report.title)
    })
    setReports(titleMap)
  }

  function handleToggleActive(id: string, isActive: boolean) {
    updateScheduledSendStatus(id, isActive)
    loadSchedules()
  }

  function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar esta programación?")) {
      deleteScheduledSend(id)
      loadSchedules()
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function getRecurrenceLabel(recurrence: string) {
    const labels: Record<string, string> = {
      once: "Una vez",
      daily: "Diario",
      weekly: "Semanal",
      biweekly: "Quincenal",
      monthly: "Mensual",
    }
    return labels[recurrence] || recurrence
  }

  const activeSchedules = schedules.filter((s) => s.isActive)
  const upcomingSchedules = schedules.filter((s) => s.isActive && new Date(s.nextSend) > new Date())

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Calendario de Envíos</h1>
                  <p className="text-xs text-muted-foreground">Programa envíos automáticos</p>
                </div>
              </div>
            </div>
            <Button asChild>
              <Link href="/schedule/new">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Programación
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Programaciones</p>
                <p className="text-2xl font-bold">{schedules.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Activas</p>
                <p className="text-2xl font-bold">{activeSchedules.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Próximos Envíos</p>
                <p className="text-2xl font-bold">{upcomingSchedules.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10 text-chart-3">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Schedules List */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Programaciones</h2>
        </div>

        {schedules.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No hay programaciones aún</h3>
                <p className="text-muted-foreground mb-4">Comienza programando el envío automático de tus reportes</p>
                <Button asChild>
                  <Link href="/schedule/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Programación
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{schedule.isBatch ? "Envío en Batch" : "Envío Individual"}</h3>
                          <Badge variant={schedule.isActive ? "default" : "secondary"}>
                            {schedule.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                          <Badge variant="outline">{getRecurrenceLabel(schedule.recurrence)}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {schedule.reportIds.length} {schedule.reportIds.length === 1 ? "reporte" : "reportes"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Reportes incluidos:</p>
                        <div className="space-y-1">
                          {schedule.reportIds.slice(0, 3).map((reportId) => (
                            <div key={reportId} className="flex items-center gap-2 text-sm">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                              <span className="line-clamp-1">{reports.get(reportId) || "Reporte eliminado"}</span>
                            </div>
                          ))}
                          {schedule.reportIds.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{schedule.reportIds.length - 3} más</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Destinatarios:</p>
                        <div className="space-y-1">
                          {schedule.recipients.slice(0, 3).map((recipient, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="line-clamp-1">{recipient}</span>
                            </div>
                          ))}
                          {schedule.recipients.length > 3 && (
                            <p className="text-xs text-muted-foreground">+{schedule.recipients.length - 3} más</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-muted-foreground">Próximo envío: </span>
                        <span className="font-semibold">{formatDate(schedule.nextSend)}</span>
                      </div>
                      {schedule.lastSent && (
                        <div>
                          <span className="text-muted-foreground">Último envío: </span>
                          <span>{formatDate(schedule.lastSent)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={schedule.isActive}
                      onCheckedChange={(checked) => handleToggleActive(schedule.id, checked)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/schedule/edit/${schedule.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(schedule.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
