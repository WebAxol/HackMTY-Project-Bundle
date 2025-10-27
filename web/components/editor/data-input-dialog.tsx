"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { FinancialData } from "@/lib/storage"

interface DataInputDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  financialData: FinancialData
  onSave: (data: FinancialData) => void
}

export function DataInputDialog({ open, onOpenChange, financialData, onSave }: DataInputDialogProps) {
  const [data, setData] = useState<FinancialData>(financialData)

  function handleSave() {
    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Datos Financieros</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ingresos">Ingresos Totales</Label>
            <Input
              id="ingresos"
              type="number"
              value={data.ingresos}
              onChange={(e) => setData({ ...data, ingresos: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gastos">Gastos Totales</Label>
            <Input
              id="gastos"
              type="number"
              value={data.gastos}
              onChange={(e) => setData({ ...data, gastos: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activos">Activos</Label>
            <Input
              id="activos"
              type="number"
              value={data.activos}
              onChange={(e) => setData({ ...data, activos: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pasivos">Pasivos</Label>
            <Input
              id="pasivos"
              type="number"
              value={data.pasivos}
              onChange={(e) => setData({ ...data, pasivos: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flujoCaja">Flujo de Caja</Label>
            <Input
              id="flujoCaja"
              type="number"
              value={data.flujoCaja}
              onChange={(e) => setData({ ...data, flujoCaja: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="periodo">Período</Label>
            <Input
              id="periodo"
              type="month"
              value={data.periodo}
              onChange={(e) => setData({ ...data, periodo: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar Datos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
