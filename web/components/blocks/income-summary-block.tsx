"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/lib/financial-utils"
import type { FinancialData } from "@/lib/storage"

interface IncomeSummaryBlockProps {
  data: FinancialData
}

export function IncomeSummaryBlock({ data }: IncomeSummaryBlockProps) {
  const utilidadNeta = data.ingresos - data.gastos
  const margenUtilidad = (utilidadNeta / data.ingresos) * 100
  const variacionMensual = 12.5 // Simulado

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-success/5 border-success/20">
          <p className="text-sm text-muted-foreground mb-1">Ingresos Totales</p>
          <p className="text-2xl font-bold text-success">{formatCurrency(data.ingresos)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-success">
            <TrendingUp className="h-3 w-3" />
            <span>{formatPercentage(variacionMensual)} vs mes anterior</span>
          </div>
        </Card>

        <Card className="p-4 bg-primary/5 border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Utilidad Neta</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(utilidadNeta)}</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>Margen: {margenUtilidad.toFixed(1)}%</span>
          </div>
        </Card>

        <Card className="p-4 bg-chart-3/5 border-chart-3/20">
          <p className="text-sm text-muted-foreground mb-1">Margen de Utilidad</p>
          <p className="text-2xl font-bold text-chart-3">{margenUtilidad.toFixed(2)}%</p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <span>Objetivo: 40%</span>
          </div>
        </Card>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="font-semibold mb-2">Análisis</h4>
        <p className="text-sm text-muted-foreground text-pretty">
          Los ingresos totales para el período {data.periodo} alcanzaron {formatCurrency(data.ingresos)}, generando una
          utilidad neta de {formatCurrency(utilidadNeta)} con un margen de {margenUtilidad.toFixed(1)}%.
          {margenUtilidad > 30 ? " El margen se encuentra en niveles saludables." : " Se recomienda optimizar costos."}
        </p>
      </div>
    </div>
  )
}
