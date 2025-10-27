"use client"

import { Card } from "@/components/ui/card"
import { formatCurrency } from "@/lib/financial-utils"
import type { FinancialData } from "@/lib/storage"

interface BalanceSheetBlockProps {
  data: FinancialData
}

export function BalanceSheetBlock({ data }: BalanceSheetBlockProps) {
  const patrimonio = data.activos - data.pasivos

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Activos */}
        <Card className="p-4 bg-success/5 border-success/20">
          <h4 className="font-semibold mb-4 text-success">Activos</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Activos Corrientes</span>
              <span className="font-semibold">{formatCurrency(data.activos * 0.6)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Activos Fijos</span>
              <span className="font-semibold">{formatCurrency(data.activos * 0.4)}</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="font-semibold">Total Activos</span>
              <span className="text-lg font-bold text-success">{formatCurrency(data.activos)}</span>
            </div>
          </div>
        </Card>

        {/* Pasivos y Patrimonio */}
        <Card className="p-4 bg-destructive/5 border-destructive/20">
          <h4 className="font-semibold mb-4 text-destructive">Pasivos y Patrimonio</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pasivos Corrientes</span>
              <span className="font-semibold">{formatCurrency(data.pasivos * 0.7)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pasivos a Largo Plazo</span>
              <span className="font-semibold">{formatCurrency(data.pasivos * 0.3)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Patrimonio</span>
              <span className="font-semibold">{formatCurrency(patrimonio)}</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-destructive">{formatCurrency(data.activos)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Ecuación Contable */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
          <div className="text-center">
            <p className="text-muted-foreground mb-1">Activos</p>
            <p className="text-xl font-bold text-success">{formatCurrency(data.activos)}</p>
          </div>
          <span className="text-2xl font-bold text-muted-foreground">=</span>
          <div className="text-center">
            <p className="text-muted-foreground mb-1">Pasivos</p>
            <p className="text-xl font-bold text-destructive">{formatCurrency(data.pasivos)}</p>
          </div>
          <span className="text-2xl font-bold text-muted-foreground">+</span>
          <div className="text-center">
            <p className="text-muted-foreground mb-1">Patrimonio</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(patrimonio)}</p>
          </div>
        </div>
      </Card>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground text-pretty">
          El balance general muestra una posición financiera{" "}
          {patrimonio > data.pasivos ? "sólida" : "que requiere atención"} con un patrimonio de{" "}
          {formatCurrency(patrimonio)} y una relación pasivo-patrimonio de{" "}
          {((data.pasivos / patrimonio) * 100).toFixed(1)}%.
        </p>
      </div>
    </div>
  )
}
