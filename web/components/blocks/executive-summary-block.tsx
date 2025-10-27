"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertCircle, CheckCircle2, Target } from "lucide-react"
import { formatCurrency, calculateRatios } from "@/lib/financial-utils"
import type { FinancialData } from "@/lib/storage"

interface ExecutiveSummaryBlockProps {
  data: FinancialData
}

export function ExecutiveSummaryBlock({ data }: ExecutiveSummaryBlockProps) {
  const utilidadNeta = data.ingresos - data.gastos
  const ratios = calculateRatios(data)
  const saludFinanciera = Number(ratios.liquidez) >= 1.5 && Number(ratios.margenNeto) >= 15

  const highlights = [
    {
      label: "Ingresos",
      value: formatCurrency(data.ingresos),
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-success",
    },
    {
      label: "Utilidad Neta",
      value: formatCurrency(utilidadNeta),
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-primary",
    },
    {
      label: "Flujo de Caja",
      value: formatCurrency(data.flujoCaja),
      icon: <Target className="h-5 w-5" />,
      color: "text-chart-2",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-2">Resumen Ejecutivo</h3>
          <p className="text-muted-foreground">Período: {data.periodo}</p>
        </div>
        <Badge variant={saludFinanciera ? "default" : "secondary"} className="text-sm">
          {saludFinanciera ? "Salud Financiera: Buena" : "Requiere Atención"}
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        {highlights.map((item) => (
          <Card key={item.label} className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={`${item.color}`}>{item.icon}</div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Executive Summary Text */}
      <Card className="p-6 bg-muted/50">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          Análisis General
        </h4>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="text-pretty">
            Durante el período {data.periodo}, la empresa generó ingresos totales de {formatCurrency(data.ingresos)},
            con gastos operativos de {formatCurrency(data.gastos)}, resultando en una utilidad neta de{" "}
            {formatCurrency(utilidadNeta)}.
          </p>
          <p className="text-pretty">
            El margen de utilidad neta alcanzó {ratios.margenNeto}%, lo que{" "}
            {Number(ratios.margenNeto) >= 15
              ? "refleja una operación eficiente y rentable"
              : "sugiere oportunidades para optimizar costos y mejorar la rentabilidad"}
            .
          </p>
          <p className="text-pretty">
            La posición de liquidez con un ratio de {ratios.liquidez}x{" "}
            {Number(ratios.liquidez) >= 1.5
              ? "demuestra capacidad sólida para cumplir con obligaciones a corto plazo"
              : "indica la necesidad de fortalecer el capital de trabajo"}
            .
          </p>
        </div>
      </Card>

      {/* Recommendations */}
      <Card className="p-6 border-primary/20 bg-primary/5">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Recomendaciones Clave
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span className="text-pretty">
              {Number(ratios.margenNeto) >= 15
                ? "Mantener la eficiencia operativa actual y explorar oportunidades de expansión."
                : "Revisar estructura de costos para identificar áreas de optimización."}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span className="text-pretty">
              {Number(ratios.liquidez) >= 1.5
                ? "Considerar inversiones estratégicas aprovechando la sólida posición de liquidez."
                : "Priorizar la generación de flujo de caja y gestión de capital de trabajo."}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span className="text-pretty">
              Monitorear continuamente los indicadores clave y ajustar estrategias según sea necesario.
            </span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
