"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { calculateRatios } from "@/lib/financial-utils"
import type { FinancialData } from "@/lib/storage"

interface RatiosBlockProps {
  data: FinancialData
}

export function RatiosBlock({ data }: RatiosBlockProps) {
  const ratios = calculateRatios(data)

  const ratioInfo = [
    {
      name: "Liquidez",
      value: ratios.liquidez,
      description: "Capacidad de pagar obligaciones a corto plazo",
      target: 2.0,
      unit: "x",
      good: Number(ratios.liquidez) >= 1.5,
    },
    {
      name: "Margen Neto",
      value: ratios.margenNeto,
      description: "Rentabilidad después de todos los gastos",
      target: 20,
      unit: "%",
      good: Number(ratios.margenNeto) >= 15,
    },
    {
      name: "Rentabilidad (ROA)",
      value: ratios.rentabilidad,
      description: "Retorno sobre activos totales",
      target: 15,
      unit: "%",
      good: Number(ratios.rentabilidad) >= 10,
    },
    {
      name: "Endeudamiento",
      value: ratios.endeudamiento,
      description: "Proporción de activos financiados con deuda",
      target: 50,
      unit: "%",
      good: Number(ratios.endeudamiento) <= 60,
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        {ratioInfo.map((ratio) => (
          <Card key={ratio.name} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold mb-1">{ratio.name}</h4>
                <p className="text-xs text-muted-foreground text-pretty">{ratio.description}</p>
              </div>
              <Badge variant={ratio.good ? "default" : "destructive"}>{ratio.good ? "Bueno" : "Atención"}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {ratio.value}
                  {ratio.unit}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {ratio.target}
                  {ratio.unit} objetivo
                </span>
              </div>

              <Progress
                value={Math.min((Number(ratio.value) / ratio.target) * 100, 100)}
                className="h-2"
                indicatorClassName={ratio.good ? "bg-success" : "bg-destructive"}
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-muted/50">
        <h4 className="font-semibold mb-3">Interpretación General</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="text-pretty">
            <span className="font-semibold text-foreground">Liquidez:</span> Con un ratio de {ratios.liquidez}x, la
            empresa {Number(ratios.liquidez) >= 1.5 ? "tiene buena" : "necesita mejorar su"} capacidad para cubrir
            obligaciones inmediatas.
          </p>
          <p className="text-pretty">
            <span className="font-semibold text-foreground">Rentabilidad:</span> El margen neto de {ratios.margenNeto}%
            indica {Number(ratios.margenNeto) >= 15 ? "una operación rentable" : "oportunidades de mejora"}.
          </p>
          <p className="text-pretty">
            <span className="font-semibold text-foreground">Endeudamiento:</span> Con {ratios.endeudamiento}% de
            endeudamiento, la estructura financiera es{" "}
            {Number(ratios.endeudamiento) <= 60 ? "saludable" : "elevada y requiere atención"}.
          </p>
        </div>
      </Card>
    </div>
  )
}
