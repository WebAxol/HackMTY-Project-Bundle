"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ArrowLeft, Plus, X } from "lucide-react"
import { getReports, saveScheduledSend, type Report, type RecurrenceType, type ScheduledSend } from "@/lib/storage"

export default function NewSchedulePage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [selectedReports, setSelectedReports] = useState<string[]>([])
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("09:00")
  const [recurrence, setRecurrence] = useState<RecurrenceType>("once")
  const [recipients, setRecipients] = useState<string[]>([])
  const [newRecipient, setNewRecipient] = useState("")
  const [isBatch, setIsBatch] = useState(false)

  useEffect(() => {
    const loadedReports = getReports()
    setReports(loadedReports)

    // Set default date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setScheduledDate(tomorrow.toISOString().split("T")[0])
  }, [])

  function handleToggleReport(reportId: string) {
    setSelectedReports((prev) => (prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]))
  }

  function handleAddRecipient() {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      setRecipients([...recipients, newRecipient.trim()])
      setNewRecipient("")
    }
  }

  function handleRemoveRecipient(email: string) {
    setRecipients(recipients.filter((r) => r !== email))
  }

  function calculateNextSend(date: string, time: string, recurrenceType: RecurrenceType): string {
    const nextSend = new Date(`${date}T${time}`)
    return nextSend.toISOString()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (selectedReports.length === 0) {
      alert("Selecciona al menos un reporte")
      return
    }

    if (recipients.length === 0) {
      alert("Agrega al menos un destinatario")
      return
    }

    const schedule: ScheduledSend = {
      id: `schedule-${Date.now()}`,
      reportIds: selectedReports,
      scheduledDate: `${scheduledDate}T${scheduledTime}`,
      recurrence,
      recipients,
      isBatch,
      isActive: true,
      createdAt: new Date().toISOString(),
      nextSend: calculateNextSend(scheduledDate, scheduledTime, recurrence),
    }

    saveScheduledSend(schedule)
    router.push("/schedule")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/schedule">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Nueva Programación</h1>
                <p className="text-xs text-muted-foreground">Programa el envío automático de reportes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Reports */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Seleccionar Reportes</h2>
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay reportes disponibles.{" "}
                  <Link href="/editor/new" className="text-primary hover:underline">
                    Crea uno primero
                  </Link>
                </p>
              ) : (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={report.id}
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={() => handleToggleReport(report.id)}
                    />
                    <Label htmlFor={report.id} className="flex-1 cursor-pointer">
                      <div className="font-medium">{report.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {report.blocks.length} bloques • Actualizado{" "}
                        {new Date(report.updatedAt).toLocaleDateString("es-MX")}
                      </div>
                    </Label>
                  </div>
                ))
              )}
            </div>
            {selectedReports.length > 0 && (
              <p className="text-sm text-muted-foreground mt-4">
                {selectedReports.length}{" "}
                {selectedReports.length === 1 ? "reporte seleccionado" : "reportes seleccionados"}
              </p>
            )}
          </Card>

          {/* Schedule Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configuración de Envío</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Fecha de Envío</Label>
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="time">Hora de Envío</Label>
                  <Input
                    id="time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recurrence">Frecuencia</Label>
                <Select value={recurrence} onValueChange={(value) => setRecurrence(value as RecurrenceType)}>
                  <SelectTrigger id="recurrence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Una vez</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {recurrence === "once"
                    ? "El reporte se enviará una sola vez"
                    : `El reporte se enviará ${recurrence === "daily" ? "todos los días" : recurrence === "weekly" ? "cada semana" : recurrence === "biweekly" ? "cada dos semanas" : "cada mes"}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="batch" checked={isBatch} onCheckedChange={(checked) => setIsBatch(checked as boolean)} />
                <Label htmlFor="batch" className="cursor-pointer">
                  Enviar como batch (todos los reportes en un solo email)
                </Label>
              </div>
            </div>
          </Card>

          {/* Recipients */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Destinatarios</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddRecipient()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddRecipient}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {recipients.length > 0 && (
                <div className="space-y-2">
                  {recipients.map((email) => (
                    <div key={email} className="flex items-center justify-between p-2 rounded-lg border border-border">
                      <span className="text-sm">{email}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveRecipient(email)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {recipients.length === 0 && (
                <p className="text-sm text-muted-foreground">Agrega al menos un destinatario para continuar</p>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link href="/schedule">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={selectedReports.length === 0 || recipients.length === 0}>
              Crear Programación
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
