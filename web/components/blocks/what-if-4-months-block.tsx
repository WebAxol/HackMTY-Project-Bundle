"use client"

import { Card } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { AlertTriangle } from "lucide-react"

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
  {
    month: "Mes 3",
    ingresosActual: 890000,
    ingresosEscenario: 850000,
    utilidadActual: 355000,
    utilidadEscenario: 335000,
    margenActual: 39.9,
    margenEscenario: 35.9,
  },
  {
    month: "Mes 4",
    ingresosActual: 950000,
    ingresosEscenario: 910000,
    utilidadActual: 385000,
    utilidadEscenario: 365000,
    margenActual: 40.5,
    margenEscenario: 36.5,
  },
]

export function WhatIf4MonthsBlock() {
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
      <Card className="p-4 bg-red-50 border-red-500 border-2">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Escenario: Reducción Extendida (4 meses)</h3>
            <p className="text-sm text-red-700">
              Impacto acumulado de reducción sostenida de $40,000 en ingresos y $20,000 en utilidad neta por mes
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Impacto Total en Ingresos</p>
          <p className="text-2xl font-bold text-red-600">-${totalImpactoIngresos.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Impacto Total en Utilidad</p>
          <p className="text-2xl font-bold text-red-600">-${totalImpactoUtilidad.toLocaleString()}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tendencia: Actual vs Escenario (4 meses)</h3>
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
              stroke="#ef4444"
              name="Ingresos Escenario"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Line type="monotone" dataKey="utilidadActual" stroke="#3b82f6" name="Utilidad Actual" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="utilidadEscenario"
              stroke="#f97316"
              name="Utilidad Escenario"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4 bg-amber-50 border-amber-500">
        <h4 className="font-semibold text-amber-900 mb-2">Recomendaciones</h4>
        <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
          <li>Considerar medidas de reducción de costos operativos</li>
          <li>Evaluar estrategias de diversificación de ingresos</li>
          <li>Revisar estructura de precios y márgenes</li>
          <li>Implementar plan de contingencia financiera</li>
        </ul>
      </Card>
    </div>
  )
}
