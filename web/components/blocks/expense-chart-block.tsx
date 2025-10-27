"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/financial-utils"
import type { FinancialData } from "@/lib/storage"

interface ExpenseChartBlockProps {
  data: FinancialData
}


export function ExpenseChartBlock({ data }: ExpenseChartBlockProps) {
  // Simulación de distribución de gastos
  const expenseData = [
    { categoria: "Operaciones", monto: data.gastos * 0.4, porcentaje: 40 },
    { categoria: "Personal", monto: data.gastos * 0.35, porcentaje: 35 },
    { categoria: "Marketing", monto: data.gastos * 0.15, porcentaje: 15 },
    { categoria: "Tecnología", monto: data.gastos * 0.1, porcentaje: 10 },
  ]

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ChartContainer
          config={{
            monto: {
              label: "Monto",
              color: "hsl(var(--chart-1))",
            },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expenseData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="categoria" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="monto" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {expenseData.map((item) => (
          <div key={item.categoria} className="text-center">
            <p className="text-sm text-muted-foreground mb-1">{item.categoria}</p>
            <p className="text-lg font-bold">{formatCurrency(item.monto)}</p>
            <p className="text-xs text-muted-foreground">{item.porcentaje}%</p>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground text-pretty">
          Total de gastos: <span className="font-semibold text-foreground">{formatCurrency(data.gastos)}</span>.
          Operaciones representa el mayor gasto con {formatCurrency(expenseData[0].monto)}, seguido por Personal con{" "}
          {formatCurrency(expenseData[1].monto)}.
        </p>
      </div>
    </div>
  )
}
