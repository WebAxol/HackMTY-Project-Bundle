"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { AlertCircle } from "lucide-react"

const whatIfData = [
  {
    month: "Mes 1",
    ingresosActual: 850000,
    ingresosEscenario: 810000,
    utilidadActual: 330000,
    utilidadEscenario: 310000,
    margenActual: 38.8,
    margenEscenario: 34.8,
  },
  {
    month: "Mes 2",
    ingresosActual: 920000,
    ingresosEscenario: 880000,
    utilidadActual: 370000,
    utilidadEscenario: 350000,
    margenActual: 40.2,
    margenEscenario: 36.2,
  },
]

export function WhatIf2MonthsBlock() {
  const totalImpactoIngresos = whatIfData.reduce(
    (sum, month) => sum + (month.ingresosActual - month.ingresosEscenario),
    0,
  )
  const totalImpactoUtilidad = whatIfData.reduce(
    (sum, month) => sum + (month.utilidadActual - month.utilidadEscenario),
    0,
  )

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-green-50 border-green-500 border-2">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Escenario: Reducción Moderada (2 meses)</h3>
            <p className="text-sm text-green-700">
              Impacto de reducción de $40,000 en ingresos y $20,000 en utilidad neta por mes
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Impacto en Ingresos</p>
          <p className="text-2xl font-bold text-red-600">-${totalImpactoIngresos.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Impacto en Utilidad</p>
          <p className="text-2xl font-bold text-red-600">-${totalImpactoUtilidad.toLocaleString()}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comparación: Actual vs Escenario</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={whatIfData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ingresosActual" stroke="#10b981" name="Ingresos Actual" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="ingresosEscenario"
              stroke="#10b981"
              name="Ingresos Escenario"
              strokeDasharray="5 5"
            />
            <Line type="monotone" dataKey="utilidadActual" stroke="#3b82f6" name="Utilidad Actual" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="utilidadEscenario"
              stroke="#3b82f6"
              name="Utilidad Escenario"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
