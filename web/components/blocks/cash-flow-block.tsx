"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card } from "@/components/ui/card"
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { formatCurrency } from "@/lib/financial-utils"
import type { FinancialData } from "@/lib/storage"

interface CashFlowBlockProps {
  data: FinancialData
}

export function CashFlowBlock({ data }: CashFlowBlockProps) {
  // Simulación de flujo de caja mensual
  const cashFlowData = [
    { mes: "Ene", flujo: data.flujoCaja * 0.7 },
    { mes: "Feb", flujo: data.flujoCaja * 0.8 },
    { mes: "Mar", flujo: data.flujoCaja * 0.9 },
    { mes: "Abr", flujo: data.flujoCaja * 0.95 },
    { mes: "May", flujo: data.flujoCaja * 1.0 },
    { mes: "Jun", flujo: data.flujoCaja * 1.1 },
  ]

  const actividades = [
    { tipo: "Operaciones", monto: data.flujoCaja * 0.7, positivo: true },
    { tipo: "Inversión", monto: data.flujoCaja * -0.3, positivo: false },
    { tipo: "Financiamiento", monto: data.flujoCaja * 0.6, positivo: true },
  ]

  return (
    <div className="space-y-4">
      <div className="h-64">
        <ChartContainer
          config={{
            flujo: {
              label: "Flujo de Caja",
              color: "hsl(var(--chart-2))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="mes" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="flujo"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {actividades.map((actividad) => (
          <Card key={actividad.tipo} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-muted-foreground">{actividad.tipo}</p>
              {actividad.positivo ? (
                <ArrowUpRight className="h-4 w-4 text-success" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              )}
            </div>
            <p className={`text-xl font-bold ${actividad.positivo ? "text-success" : "text-destructive"}`}>
              {formatCurrency(Math.abs(actividad.monto))}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Flujo de Caja Neto</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(data.flujoCaja)}</p>
          </div>
          <div className="flex items-center gap-2 text-success">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm font-semibold">+15.3%</span>
          </div>
        </div>
      </Card>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground text-pretty">
          El flujo de caja neto es de {formatCurrency(data.flujoCaja)}, mostrando una tendencia positiva. Las
          operaciones generan {formatCurrency(actividades[0].monto)} mientras que las inversiones requieren{" "}
          {formatCurrency(Math.abs(actividades[1].monto))}.
        </p>
      </div>
    </div>
  )
}
