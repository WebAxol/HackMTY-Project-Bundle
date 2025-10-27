"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { WhatIfData } from "@/lib/types"

interface WhatIfBlockProps {
  data?: WhatIfData
}

// Helper function to detect if a What-IF query is feasible based on text analysis
export function detectFeasibility(data: WhatIfData): boolean | null {
  const unfeasibleKeywords = [
    'unfeasible',
    'not feasible',
    'not possible',
    'infeasible',
    'cannot be',
    'impossible',
    'no es viable',
    'no viable',
    'no es posible',
    'imposible'
  ]

  // Check title
  if (data.title) {
    const titleLower = data.title.toLowerCase()
    if (unfeasibleKeywords.some(keyword => titleLower.includes(keyword))) {
      return false
    }
  }

  // Check description
  if (data.description) {
    const descriptionLower = data.description.toLowerCase()
    if (unfeasibleKeywords.some(keyword => descriptionLower.includes(keyword))) {
      return false
    }
  }

  // Check first text section if exists
  if (data.data && Array.isArray(data.data)) {
    const firstTextSection = data.data.find(section => section.type === 'text')
    if (firstTextSection && 'content' in firstTextSection) {
      const contentLower = firstTextSection.content.toLowerCase()
      if (unfeasibleKeywords.some(keyword => contentLower.includes(keyword))) {
        return false
      }
    }

    // If we have data sections (charts/tables), assume feasible
    const hasDataSections = data.data.some(section => section.type === 'chart' || section.type === 'table')
    if (hasDataSections) {
      return true
    }
  }

  // Cannot determine - return null
  return null
}

export function WhatIfBlock({ data }: WhatIfBlockProps) {
  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay datos de análisis What IF disponibles
      </div>
    )
  }

  // Debug logging
  console.log("WhatIfBlock received data:", JSON.stringify(data, null, 2))

  // Detect feasibility
  const feasibility = detectFeasibility(data)

  // Determine colors based on feasibility
  const borderColor = feasibility === false
    ? "border-red-500"
    : feasibility === true
    ? "border-green-500"
    : "border-purple-500"

  const bgColor = feasibility === false
    ? "bg-red-50"
    : feasibility === true
    ? "bg-green-50"
    : "bg-purple-50"

  const iconColor = feasibility === false
    ? "text-red-600"
    : feasibility === true
    ? "text-green-600"
    : "text-purple-600"

  const titleColor = feasibility === false
    ? "text-red-900"
    : feasibility === true
    ? "text-green-900"
    : "text-purple-900"

  const descriptionColor = feasibility === false
    ? "text-red-700"
    : feasibility === true
    ? "text-green-700"
    : "text-purple-700"

  return (
    <div className={`border-2 ${borderColor} rounded-lg p-4 space-y-4 animate-in fade-in duration-500`}>
      {/* Header */}
      <Card className={`p-4 ${bgColor} border-0`}>
        <div className="flex items-start gap-3">
          <TrendingUp className={`h-6 w-6 ${iconColor} mt-1 flex-shrink-0`} />
          <div className="flex-1">
            <h3 className={`font-semibold ${titleColor} text-lg mb-1`}>{data.title || "Análisis What-If"}</h3>
            <p className={`${descriptionColor} text-sm`}>{data.description || "Sin descripción disponible"}</p>
          </div>
        </div>
      </Card>

      {/* Content Sections */}
      {data.data && Array.isArray(data.data) && data.data.map((section, idx) => {
        if (section.type === "text") {
          return (
            <Card key={idx} className="p-6 animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
              <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">{section.content}</p>
            </Card>
          )
        }

        if (section.type === "table") {
          return (
            <Card key={idx} className="p-6 animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      {section.columns.map((column, colIdx) => (
                        <th
                          key={colIdx}
                          className="text-left p-3 font-semibold text-sm text-gray-700 bg-gray-50"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-3 text-sm text-gray-900">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )
        }

        if (section.type === "chart") {
          // Type guard to ensure we have chart data
          if (!("chart_type" in section) || !("x_axis" in section) || !("y_axis" in section)) {
            return (
              <Card key={idx} className="p-6 animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                <p className="text-red-600">Error: Datos de gráfica incompletos</p>
              </Card>
            )
          }

          if (section.chart_type === "xy") {
            // Transform the data into the format Recharts expects
            const chartData = section.x_axis.values.map((label, i) => ({
              name: label,
              value: section.y_axis.values[i] || 0,
            }))

            return (
              <Card key={idx} className="p-6 animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                <h4 className="text-lg font-semibold mb-4">{section.y_axis.label}</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                    <XAxis
                      dataKey="name"
                      label={{ value: section.x_axis.label, position: "insideBottom", offset: -5 }}
                      className="text-sm"
                    />
                    <YAxis
                      label={{ value: section.y_axis.label, angle: -90, position: "insideLeft" }}
                      className="text-sm"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      formatter={(value: number) =>
                        value.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
                      }
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      fill="#8b5cf6"
                      name={section.y_axis.label}
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                      animationBegin={idx * 100}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )
          }

          // Unsupported chart type
          return (
            <Card key={idx} className="p-6 animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
              <p className="text-amber-600">Tipo de gráfica no soportado: {section.chart_type}</p>
            </Card>
          )
        }

        // Unknown section type
        return (
          <Card key={idx} className="p-6 animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
            <p className="text-muted-foreground">Tipo de contenido desconocido</p>
          </Card>
        )
      })}
    </div>
  )
}
