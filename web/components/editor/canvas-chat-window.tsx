"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Send, Sparkles, Database, TrendingUp, Newspaper, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ParticleCard, GlobalSpotlight } from "@/components/MagicBento"
import { mcpClient } from "@/lib/mcp-client"
import type { TopNewsData, WhatIfData, QueryData } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { saveBlockQuery } from "@/lib/storage"

interface ChatTool {
  id: string
  name: string
  icon: typeof Database
  description: string
}

const CHAT_TOOLS: ChatTool[] = [
  {
    id: "sql-query",
    name: "SQL Query",
    icon: Database,
    description: "Ejecuta consultas SQL personalizadas",
  },
  {
    id: "what-if",
    name: "What IF",
    icon: TrendingUp,
    description: "Simula escenarios financieros futuros",
  },
  {
    id: "top-news",
    name: "Top News",
    icon: Newspaper,
    description: "Obtén noticias financieras relevantes",
  },
]

interface CanvasChatWindowProps {
  onAddTopNewsBlock?: (data: TopNewsData) => void
  onAddWhatIfBlock?: (data: WhatIfData) => void
  onAddQueryBlock?: (data: QueryData) => void
  onToolChange?: (toolId: string | null) => void
  onHistoryUpdate?: () => void
}

export function CanvasChatWindow({ onAddTopNewsBlock, onAddWhatIfBlock, onAddQueryBlock, onToolChange, onHistoryUpdate }: CanvasChatWindowProps) {
  const [inputValue, setInputValue] = useState("")
  const [selectedTool, setSelectedTool] = useState<ChatTool | null>(null)
  const [isToolsOpen, setIsToolsOpen] = useState(false)
  const [isToolFadingOut, setIsToolFadingOut] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const handleSend = async () => {
    if (!inputValue.trim()) return

    // Handle Top News tool
    if (selectedTool?.id === "top-news") {
      setIsLoading(true)
      try {
        // Call MCP server with get_company_news tool
        const result = await mcpClient.callTool({
          name: "get_company_news",
          arguments: {
            query: inputValue,
          },
        })

        // Save to history
        if (result) {
          saveBlockQuery("top-news", inputValue, result as TopNewsData)

          // Notify parent to refresh history
          if (onHistoryUpdate) {
            onHistoryUpdate()
          }

          // Add the block with the data
          if (onAddTopNewsBlock) {
            onAddTopNewsBlock(result as TopNewsData)
            toast({
              title: "Noticias cargadas",
              description: "Las noticias más relevantes han sido añadidas al reporte",
            })
          }
        }

        setInputValue("")
      } catch (error) {
        console.error("Error calling MCP tool:", error)
        toast({
          title: "Error",
          description: "No se pudieron obtener las noticias. Verifica la conexión con el servidor MCP.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    // Handle What IF tool
    else if (selectedTool?.id === "what-if") {
      setIsLoading(true)
      try {
        // Call MCP server with what_if_analysis tool
        const result = await mcpClient.callTool({
          name: "what_if_analysis",
          arguments: {
            query: inputValue,
          },
        })

        // Save to history
        if (result) {
          saveBlockQuery("what-if", inputValue, result as WhatIfData)

          // Notify parent to refresh history
          if (onHistoryUpdate) {
            onHistoryUpdate()
          }

          // Add the block with the data
          if (onAddWhatIfBlock) {
            onAddWhatIfBlock(result as WhatIfData)
            toast({
              title: "Análisis What IF completado",
              description: "El análisis de escenarios ha sido generado correctamente",
            })
          }
        }

        setInputValue("")
      } catch (error) {
        console.error("Error calling MCP tool:", error)
        toast({
          title: "Error",
          description: "No se pudo completar el análisis What IF. Verifica la conexión con el servidor MCP.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    // Handle SQL Query tool
    else if (selectedTool?.id === "sql-query") {
      setIsLoading(true)
      try {
        // Call MCP server with list of available SQL tools
        const result = await mcpClient.sendChatWithTools(inputValue, [
          "get_database_schema",
          "describe_table",
          "list_tables",
          "execute_select_query",
        ])

        // Save to history
        if (result) {
          saveBlockQuery("query", inputValue, result as QueryData)

          // Notify parent to refresh history
          if (onHistoryUpdate) {
            onHistoryUpdate()
          }

          // Add the block with the data
          if (onAddQueryBlock) {
            onAddQueryBlock(result as QueryData)
            toast({
              title: "Consulta completada",
              description: "Los resultados de la consulta SQL han sido generados correctamente",
            })
          }
        }

        setInputValue("")
      } catch (error) {
        console.error("Error calling MCP tool:", error)
        toast({
          title: "Error",
          description: "No se pudo completar la consulta SQL. Verifica la conexión con el servidor MCP.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      // Handle other tools or general messages
      console.log("Sending message:", inputValue, "with tool:", selectedTool?.id)
      setInputValue("")
    }
  }

  const handleSelectTool = (tool: ChatTool) => {
    setSelectedTool(tool)
    setIsToolsOpen(false)
    // Notify parent about tool change
    if (onToolChange) {
      onToolChange(tool.id)
    }
  }

  const handleDeselectTool = () => {
    setIsToolFadingOut(true)
    setTimeout(() => {
      setSelectedTool(null)
      setIsToolFadingOut(false)
      // Notify parent about tool change
      if (onToolChange) {
        onToolChange(null)
      }
    }, 200) // Duration of fade-out animation
  }

  return (
    <>
      <GlobalSpotlight
        gridRef={chatContainerRef}
        enabled={true}
        spotlightRadius={300}
        glowColor="132, 0, 255"
      />
      <style jsx>{`
        .magic-chat-wrapper {
          --glow-x: 50%;
          --glow-y: 50%;
          --glow-intensity: 0;
          --glow-radius: 200px;
          --glow-color: 132, 0, 255;
        }

        .card--border-glow::after {
          content: '';
          position: absolute;
          inset: 0;
          padding: 2px;
          background: radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y),
              rgba(var(--glow-color), calc(var(--glow-intensity) * 0.8)) 0%,
              rgba(var(--glow-color), calc(var(--glow-intensity) * 0.4)) 30%,
              transparent 60%);
          border-radius: inherit;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: subtract;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          pointer-events: none;
          transition: opacity 0.3s ease;
          z-index: 1;
        }
      `}</style>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 magic-chat-wrapper bento-section" ref={chatContainerRef}>
        <Card className="rounded-none border-x-0 border-b-0">
        {/* Input area */}
        <div className="p-4 bg-background">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3">
              {/* Tools button/selector */}
              <div className="flex items-center gap-2">
                <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size={selectedTool ? "icon" : "default"}
                      className={cn(
                        "transition-all h-10",
                        selectedTool ? "w-10" : ""
                      )}
                    >
                      <Sparkles className="h-5 w-5" />
                      {!selectedTool && <span className="ml-2">Tools</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2" align="start" side="top">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold px-2 py-1 text-muted-foreground">
                        Selecciona una herramienta
                      </p>
                      {CHAT_TOOLS.map((tool) => {
                        const Icon = tool.icon
                        return (
                          <button
                            key={tool.id}
                            onClick={() => handleSelectTool(tool)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-accent transition-colors text-left group"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{tool.name}</p>
                              <p className="text-xs text-muted-foreground">{tool.description}</p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Selected tool chip */}
                {selectedTool && (
                  <Badge
                    className={cn(
                      "h-10 px-3 bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 cursor-pointer transition-all duration-200",
                      isToolFadingOut ? "opacity-0 scale-95" : "opacity-100 scale-100 animate-in fade-in zoom-in-95 duration-200"
                    )}
                    onClick={handleDeselectTool}
                  >
                    {(() => {
                      const Icon = selectedTool.icon
                      return <Icon className="h-4 w-4" />
                    })()}
                    <span>{selectedTool.name}</span>
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </div>

              {/* Chat input with MagicBento effects */}
              <ParticleCard
                className="flex-1 max-w-2xl card"
                enableTilt={false}
                enableMagnetism={false}
                clickEffect={true}
                particleCount={0}
                glowColor="132, 0, 255"
              >
                <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 border border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder={
                      selectedTool
                        ? `Pregunta algo usando ${selectedTool.name}...`
                        : "Escribe tu pregunta..."
                    }
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="rounded-full h-8 w-8 flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </ParticleCard>
            </div>
          </div>
        </div>
      </Card>
    </div>
    </>
  )
}
