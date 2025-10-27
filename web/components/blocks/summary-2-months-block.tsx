"use client"

import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const dummyData = [
  {
    month: "Mes 1",
    ingresos: 850000,
    gastos: 520000,
    utilidadNeta: 330000,
    margenUtilidad: 38.8,
  },
  {
    month: "Mes 2",
    ingresos: 920000,
    gastos: 550000,
    utilidadNeta: 370000,
    margenUtilidad: 40.2,
  },
]

export function Summary2MonthsBlock() {
  const totalIngresos = dummyData.reduce((sum, month) => sum + month.ingresos, 0)
  const totalGastos = dummyData.reduce((sum, month) => sum + month.gastos, 0)
  const totalUtilidad = dummyData.reduce((sum, month) => sum + month.utilidadNeta, 0)
  const avgMargen = dummyData.reduce((sum, month) => sum + month.margenUtilidad, 0) / dummyData.length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Ingresos Totales</p>
          <p className="text-2xl font-bold text-green-600">${totalIngresos.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Gastos Totales</p>
          <p className="text-2xl font-bold text-red-600">${totalGastos.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Utilidad Neta</p>
          <p className="text-2xl font-bold text-primary">${totalUtilidad.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Margen Promedio</p>
          <p className="text-2xl font-bold">{avgMargen.toFixed(1)}%</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comparación Mensual</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dummyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="ingresos" fill="hsl(var(--chart-1))" name="Ingresos" />
            <Bar dataKey="gastos" fill="hsl(var(--chart-2))" name="Gastos" />
            <Bar dataKey="utilidadNeta" fill="hsl(var(--chart-3))" name="Utilidad Neta" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
