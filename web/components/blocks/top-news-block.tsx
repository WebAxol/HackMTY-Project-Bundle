"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Newspaper } from "lucide-react"

export interface TopNewsData {
  title: string
  description: string
  data: Array<{
    type: "table"
    columns: string[]
    rows: Array<Array<string>>
  }>
}

interface TopNewsBlockProps {
  data?: TopNewsData
}

export function TopNewsBlock({ data }: TopNewsBlockProps) {
  if (!data) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No hay datos de noticias disponibles
      </div>
    )
  }

  const getImpactColor = (impact: string): string => {
    const lowerImpact = impact.toLowerCase()
    if (lowerImpact.includes("high") || lowerImpact.includes("threat") || lowerImpact.includes("alto")) {
      return "bg-red-100 text-red-800 border-red-300"
    }
    if (lowerImpact.includes("moderate") || lowerImpact.includes("risk") || lowerImpact.includes("moderado")) {
      return "bg-orange-100 text-orange-800 border-orange-300"
    }
    if (lowerImpact.includes("opportunity") || lowerImpact.includes("oportunidad")) {
      return "bg-green-100 text-green-800 border-green-300"
    }
    return "bg-gray-100 text-gray-800 border-gray-300"
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header */}
      <Card className="p-4 bg-blue-50 border-blue-500 border-2">
        <div className="flex items-start gap-3">
          <Newspaper className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 text-lg mb-1">{data.title || "Noticias Principales"}</h3>
            <p className="text-blue-700 text-sm">{data.description || "Sin descripción disponible"}</p>
          </div>
        </div>
      </Card>

      {/* News Table */}
      {data.data && Array.isArray(data.data) && data.data.map((tableData, idx) => {
        if (tableData.type !== "table") return null

        return (
          <Card key={idx} className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    {tableData.columns.map((column, colIdx) => (
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
                  {tableData.rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {row.map((cell, cellIdx) => {
                        const columnName = tableData.columns[cellIdx]
                        const isLink = columnName.toLowerCase() === "link"
                        const isImpact = columnName.toLowerCase() === "impact"

                        return (
                          <td key={cellIdx} className="p-3 text-sm">
                            {isLink ? (
                              <a
                                href={cell}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 group"
                              >
                                <span className="truncate max-w-[200px]">Ver artículo</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </a>
                            ) : isImpact ? (
                              <Badge
                                variant="outline"
                                className={`${getImpactColor(cell)} font-medium`}
                              >
                                {cell}
                              </Badge>
                            ) : (
                              <span className="text-gray-900">{cell}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
