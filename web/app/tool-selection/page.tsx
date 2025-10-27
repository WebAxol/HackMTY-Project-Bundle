"use client"

import type React from "react"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight, Database, TrendingUp, Newspaper, FileText, ArrowRight, Check, X, Send } from "lucide-react"
import Image from "next/image"
import type { MCPTool, PlacedTool } from "@/lib/types"

const MCP_TOOLS: MCPTool[] = [
  {
    id: "sql-query",
    name: "SQL Query",
    description:
      "Ejecuta consultas SQL personalizadas para extraer datos específicos de tu base de datos financiera. Ideal para análisis detallados y reportes personalizados.",
    icon: "database",
    category: "Datos",
  },
  {
    id: "what-if",
    name: "What If",
    description:
      "Simula diferentes escenarios financieros y proyecta resultados. Analiza el impacto de cambios en variables clave como ingresos, gastos o inversiones.",
    icon: "trending-up",
    category: "Análisis",
  },
  {
    id: "top-noticias",
    name: "Top Noticias",
    description:
      "Obtén las noticias financieras más relevantes del día. Mantente informado sobre eventos que pueden impactar tus decisiones financieras.",
    icon: "newspaper",
    category: "Información",
  },
  {
    id: "resumen",
    name: "Resumen",
    description:
      "Genera un resumen ejecutivo automático de tus datos financieros. Incluye métricas clave, tendencias y recomendaciones basadas en IA.",
    icon: "file-text",
    category: "Reportes",
  },
]

const ICON_MAP = {
  database: Database,
  "trending-up": TrendingUp,
  newspaper: Newspaper,
  "file-text": FileText,
}

export default function ToolSelectionPage() {
  const router = useRouter()
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  const [placedTools, setPlacedTools] = useState<PlacedTool[]>([])
  const [draggedTool, setDraggedTool] = useState<MCPTool | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const CANVAS_CENTER_X = 250
  const CANVAS_CENTER_Y = 225
  const PLACEMENT_RADIUS = 180 // Increased radius to avoid overlap with center rectangle

  function toggleExpand(toolId: string) {
    setExpandedTools((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(toolId)) {
        newSet.delete(toolId)
      } else {
        newSet.add(toolId)
      }
      return newSet
    })
  }

  function handleDragStart(tool: MCPTool) {
    setDraggedTool(tool)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (!draggedTool || !canvasRef.current) return

    const isAlreadyPlaced = placedTools.some((tool) => tool.toolId === draggedTool.id)
    if (isAlreadyPlaced) {
      setDraggedTool(null)
      return
    }

    const currentToolCount = placedTools.length
    // Distribute tools evenly around the circle, starting from top (-90 degrees)
    const angle = (currentToolCount * 2 * Math.PI) / 4 - Math.PI / 2
    const newX = CANVAS_CENTER_X + Math.cos(angle) * PLACEMENT_RADIUS
    const newY = CANVAS_CENTER_Y + Math.sin(angle) * PLACEMENT_RADIUS

    const newPlacedTool: PlacedTool = {
      id: `placed-${Date.now()}`,
      toolId: draggedTool.id,
      x: newX,
      y: newY,
    }

    setPlacedTools([...placedTools, newPlacedTool])
    setDraggedTool(null)
  }

  function removePlacedTool(id: string) {
    setPlacedTools(placedTools.filter((tool) => tool.id !== id))
  }

  const availableTools = MCP_TOOLS.filter((tool) => !placedTools.some((placed) => placed.toolId === tool.id))

  function handleCreateReport() {
    // Save the builder state and navigate to editor
    const builderId = `builder-${Date.now()}`
    localStorage.setItem(
      "reportBuilder",
      JSON.stringify({
        id: builderId,
        selectedTools: placedTools,
        createdAt: new Date().toISOString(),
      }),
    )
    router.push("/editor/new")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/banorte-logo.png" alt="Banorte" width={120} height={40} className="h-10 w-auto" />
            <div className="border-l border-border pl-3">
              <h1 className="text-xl font-semibold mb-2 text-balance">Selección de Herramientas</h1>
              <p className="text-xs text-muted-foreground">Construye tu reporte personalizado</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/")}>
            Cancelar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Tools list */}
          <div className="relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-balance">Herramientas Disponibles</h2>
              <p className="text-muted-foreground text-pretty">
                Selecciona y arrastra las herramientas que deseas incluir en tu reporte
              </p>
            </div>

            <div className="space-y-4">
              {availableTools.map((tool) => {
                const Icon = ICON_MAP[tool.icon as keyof typeof ICON_MAP]
                const isExpanded = expandedTools.has(tool.id)

                return (
                  <Card
                    key={tool.id}
                    className="overflow-hidden transition-all hover:shadow-md cursor-move"
                    draggable
                    onDragStart={() => handleDragStart(tool)}
                  >
                    <div className="p-4 flex items-start gap-4 cursor-pointer" onClick={() => toggleExpand(tool.id)}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-balance">{tool.name}</h3>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {tool.category}
                        </Badge>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                        <p className="text-sm text-muted-foreground text-pretty">{tool.description}</p>
                      </div>
                    )}
                  </Card>
                )
              })}
              {availableTools.length === 0 && (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">Todas las herramientas han sido agregadas al reporte</p>
                </Card>
              )}
            </div>
          </div>

          {/* Right side - Report canvas */}
          <div className="lg:sticky lg:top-8 lg:self-start relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2 text-balance">Construye tu Reporte</h2>
              <p className="text-muted-foreground text-pretty">
                Arrastra las herramientas aquí para incluirlas en tu reporte
              </p>
            </div>

            <Card className="p-8 min-h-[500px] relative bg-gradient-to-br from-card to-muted/20">
              <div
                ref={canvasRef}
                className="relative w-full h-[450px] border-2 border-dashed border-border rounded-lg bg-background/50"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                {/* Placement circle guide */}
                <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                  <circle
                    cx={CANVAS_CENTER_X}
                    cy={CANVAS_CENTER_Y}
                    r={PLACEMENT_RADIUS}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="1"
                    strokeDasharray="8,8"
                    opacity="0.3"
                  />
                </svg>

                {/* Center rectangle */}
                <div
                  className="absolute bg-primary/10 border-2 border-primary rounded-lg flex items-center justify-center"
                  style={{
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "120px",
                    height: "80px",
                  }}
                >
                  <div className="text-center">
                    <FileText className="h-8 w-8 text-primary mx-auto mb-1" />
                    <p className="text-xs font-semibold text-primary">Reporte</p>
                  </div>
                </div>

                {/* Placed tools */}
                {placedTools.map((placedTool) => {
                  const tool = MCP_TOOLS.find((t) => t.id === placedTool.toolId)
                  if (!tool) return null

                  const Icon = ICON_MAP[tool.icon as keyof typeof ICON_MAP]

                  const lineStartX = CANVAS_CENTER_X
                  const lineStartY = CANVAS_CENTER_Y
                  const lineEndX = placedTool.x
                  const lineEndY = placedTool.y

                  return (
                    <div key={placedTool.id}>
                      {/* Connection line */}
                      <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
                        <line
                          x1={lineStartX}
                          y1={lineStartY}
                          x2={lineEndX}
                          y2={lineEndY}
                          stroke="hsl(var(--primary))"
                          strokeWidth="2"
                          strokeDasharray="5,5"
                          opacity="0.6"
                        />
                      </svg>

                      {/* Tool node */}
                      <div
                        className="absolute bg-card border-2 border-primary rounded-lg p-3 shadow-lg cursor-pointer hover:shadow-xl transition-shadow group"
                        style={{
                          left: `${placedTool.x - 40}px`,
                          top: `${placedTool.y - 30}px`,
                          width: "80px",
                        }}
                        onClick={() => removePlacedTool(placedTool.id)}
                      >
                        <Icon className="h-6 w-6 text-primary mx-auto mb-1" />
                        <p className="text-xs font-medium text-center text-balance leading-tight">{tool.name}</p>
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge variant="destructive" className="text-xs px-1 py-0">
                            ✕
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {placedTools.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-muted-foreground text-center text-sm">
                      Arrastra herramientas aquí para comenzar
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <div className="mt-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <Input placeholder="Escribe tu mensaje..." className="flex-1" />
                  <Button size="icon" variant="outline" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <Check className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </Card>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {placedTools.length}{" "}
                {placedTools.length === 1 ? "herramienta seleccionada" : "herramientas seleccionadas"}
              </p>
              <Button size="lg" onClick={handleCreateReport} disabled={placedTools.length === 0}>
                Crear Resumen
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
