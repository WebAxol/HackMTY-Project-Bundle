"use client"

import type React from "react"
import { useEffect, useState } from "react"

import { useDraggable } from "@dnd-kit/core"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Database, Newspaper, ChevronDown, ChevronRight } from "lucide-react"
import type { ReportBlock } from "@/lib/storage"
import type { BlockQueryHistoryEntry, QueryableBlockType } from "@/lib/types"
import { getBlockQueryHistory } from "@/lib/storage"

const blockTypes: Array<{
  type: ReportBlock["type"]
  title: string
  description: string
  icon: React.ReactNode
  borderColor?: string
}> = [
  {
    type: "summary-2-months",
    title: "Resumen de los últimos dos meses",
    description: "Análisis financiero de los últimos 2 meses",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    type: "what-if",
    title: "What IF",
    description: "Simula y analiza diferentes escenarios financieros y su impacto",
    icon: <TrendingUp className="h-5 w-5" />,
    borderColor: "border-purple-500",
  },
  {
    type: "query",
    title: "Consulta SQL",
    description: "Ejecuta consultas SQL y visualiza resultados de la base de datos",
    icon: <Database className="h-5 w-5" />,
    borderColor: "border-cyan-500",
  },
  {
    type: "top-news",
    title: "Top News",
    description: "Noticias financieras más relevantes",
    icon: <Newspaper className="h-5 w-5" />,
    borderColor: "border-blue-500",
  },
]

interface BlocksSidebarProps {
  selectedToolId?: string | null
  hasTopNewsBeenQueried?: boolean
  hasWhatIfBeenQueried?: boolean
  hasQueryBeenQueried?: boolean
  historyRefreshTrigger?: number
}

export function BlocksSidebar({
  selectedToolId,
  hasTopNewsBeenQueried = false,
  hasWhatIfBeenQueried = false,
  hasQueryBeenQueried = false,
  historyRefreshTrigger = 0,
}: BlocksSidebarProps) {
  const [topNewsJustAppeared, setTopNewsJustAppeared] = useState(false)
  const [whatIfJustAppeared, setWhatIfJustAppeared] = useState(false)
  const [queryJustAppeared, setQueryJustAppeared] = useState(false)

  // Query history state
  const [topNewsHistory, setTopNewsHistory] = useState<BlockQueryHistoryEntry[]>([])
  const [whatIfHistory, setWhatIfHistory] = useState<BlockQueryHistoryEntry[]>([])
  const [queryHistory, setQueryHistory] = useState<BlockQueryHistoryEntry[]>([])

  // Expanded state for each block type
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({
    "top-news": false,
    "what-if": false,
    "query": false,
  })

  // Filter blocks based on whether they have been queried
  // Initially NO blocks are shown
  // Blocks only appear AFTER their respective tool queries are sent
  const visibleBlocks = blockTypes.filter((b) => {
    if (b.type === "top-news") {
      return hasTopNewsBeenQueried
    }
    if (b.type === "what-if") {
      return hasWhatIfBeenQueried
    }
    if (b.type === "query") {
      return hasQueryBeenQueried
    }
    // For now, hide all other blocks until their query logic is implemented
    return false
  })

  // Track when Top News first appears to add fade-in animation
  useEffect(() => {
    if (hasTopNewsBeenQueried && !topNewsJustAppeared) {
      setTopNewsJustAppeared(true)
    }
  }, [hasTopNewsBeenQueried, topNewsJustAppeared])

  // Track when What IF first appears to add fade-in animation
  useEffect(() => {
    if (hasWhatIfBeenQueried && !whatIfJustAppeared) {
      setWhatIfJustAppeared(true)
    }
  }, [hasWhatIfBeenQueried, whatIfJustAppeared])

  // Track when Query first appears to add fade-in animation
  useEffect(() => {
    if (hasQueryBeenQueried && !queryJustAppeared) {
      setQueryJustAppeared(true)
    }
  }, [hasQueryBeenQueried, queryJustAppeared])

  // Load query history from localStorage
  useEffect(() => {
    setTopNewsHistory(getBlockQueryHistory("top-news"))
    setWhatIfHistory(getBlockQueryHistory("what-if"))
    setQueryHistory(getBlockQueryHistory("query"))
  }, [historyRefreshTrigger])

  const toggleBlockExpanded = (blockType: string) => {
    setExpandedBlocks((prev) => ({
      ...prev,
      [blockType]: !prev[blockType],
    }))
  }

  return (
    <aside className="w-80 border-r border-border bg-card overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-1">Bloques Disponibles</h2>
        <p className="text-sm text-muted-foreground mb-4">Arrastra bloques al canvas</p>

        <div className="space-y-3">
          {visibleBlocks.map((block) => {
            const history =
              block.type === "top-news" ? topNewsHistory :
              block.type === "what-if" ? whatIfHistory :
              block.type === "query" ? queryHistory :
              []

            const isExpanded = expandedBlocks[block.type] || false
            const hasHistory = history.length > 0

            return (
              <div key={block.type} className="space-y-2">
                {/* Block header with expand/collapse */}
                <div className="flex items-center gap-2">
                  {hasHistory && (
                    <button
                      onClick={() => toggleBlockExpanded(block.type)}
                      className="p-1 hover:bg-accent rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <div className="flex-1">
                    <DraggableBlock
                      block={block}
                      shouldAnimate={
                        (block.type === "top-news" && topNewsJustAppeared) ||
                        (block.type === "what-if" && whatIfJustAppeared) ||
                        (block.type === "query" && queryJustAppeared)
                      }
                    />
                  </div>
                </div>

                {/* History items (when expanded) */}
                {isExpanded && hasHistory && (
                  <div className="ml-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {history.map((entry, index) => (
                      <HistoryBlock
                        key={entry.id}
                        entry={entry}
                        isCurrent={index === history.length - 1}
                        blockIcon={block.icon}
                        borderColor={block.borderColor}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

function DraggableBlock({
  block,
  shouldAnimate = false,
}: {
  block: {
    type: ReportBlock["type"]
    title: string
    description: string
    icon: React.ReactNode
    borderColor?: string
  }
  shouldAnimate?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${block.type}`,
  })

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-2 ${
        block.borderColor || "border-border"
      } ${isDragging ? "opacity-50" : ""} ${shouldAnimate ? "animate-in fade-in slide-in-from-left-4 duration-500" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {block.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 text-balance">{block.title}</h3>
          <p className="text-xs text-muted-foreground text-pretty">{block.description}</p>
        </div>
      </div>
    </Card>
  )
}

function HistoryBlock({
  entry,
  isCurrent,
  blockIcon,
  borderColor,
}: {
  entry: BlockQueryHistoryEntry
  isCurrent: boolean
  blockIcon: React.ReactNode
  borderColor?: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `history-${entry.id}`,
    data: {
      type: entry.blockType,
      historyEntry: entry,
    },
  })

  // Determine block type name for display
  const blockTypeName =
    entry.blockType === "top-news" ? "Top News" :
    entry.blockType === "what-if" ? "What IF" :
    "Consulta SQL"

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border ${
        borderColor || "border-border"
      } ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {blockIcon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-xs">
              {blockTypeName} {entry.version}
            </h4>
            {isCurrent && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                CURRENT
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 text-pretty">
            {entry.title}
          </p>
        </div>
      </div>
    </Card>
  )
}
