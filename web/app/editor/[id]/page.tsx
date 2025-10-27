"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent, closestCenter } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { EditorHeader } from "@/components/editor/editor-header"
import { BlocksSidebar } from "@/components/editor/blocks-sidebar"
import { ReportCanvas } from "@/components/editor/report-canvas"
import { DataInputDialog } from "@/components/editor/data-input-dialog"
import { CanvasChatWindow } from "@/components/editor/canvas-chat-window"
import { getReport, saveReport, saveReportVersion, type Report, type ReportBlock } from "@/lib/storage"
import { generateMockData } from "@/lib/financial-utils"
import type { TopNewsData, WhatIfData, QueryData } from "@/lib/types"

export default function EditorPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showDataDialog, setShowDataDialog] = useState(false)
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [hasTopNewsBeenQueried, setHasTopNewsBeenQueried] = useState(false)
  const [pendingTopNewsData, setPendingTopNewsData] = useState<TopNewsData | null>(null)
  const [hasWhatIfBeenQueried, setHasWhatIfBeenQueried] = useState(false)
  const [pendingWhatIfData, setPendingWhatIfData] = useState<WhatIfData | null>(null)
  const [hasQueryBeenQueried, setHasQueryBeenQueried] = useState(false)
  const [pendingQueryData, setPendingQueryData] = useState<QueryData | null>(null)
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0)

  useEffect(() => {
    if (reportId === "new") {
      // Create new report
      const newReport: Report = {
        id: `report-${Date.now()}`,
        title: "Nuevo Reporte Financiero",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        blocks: [],
        financialData: generateMockData(),
        version: 1,
      }
      setReport(newReport)
    } else {
      // Load existing report
      const loadedReport = getReport(reportId)
      if (!loadedReport) {
        router.push("/dashboard")
        return
      }
      setReport(loadedReport)
    }
  }, [reportId, router])

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over || !report) return

    // If dragging from history
    if (active.id.toString().startsWith("history-")) {
      const historyEntry = active.data.current?.historyEntry
      if (historyEntry) {
        addBlock(historyEntry.blockType, historyEntry.data)
      }
    }
    // If dragging from sidebar to canvas
    else if (active.id.toString().startsWith("sidebar-")) {
      const blockType = active.id.toString().replace("sidebar-", "") as ReportBlock["type"]

      // If dragging Top News block, pass the stored data
      if (blockType === "top-news" && pendingTopNewsData) {
        addBlock(blockType, pendingTopNewsData)
      }
      // If dragging What IF block, pass the stored data
      else if (blockType === "what-if" && pendingWhatIfData) {
        addBlock(blockType, pendingWhatIfData)
      }
      // If dragging Query block, pass the stored data
      else if (blockType === "query" && pendingQueryData) {
        addBlock(blockType, pendingQueryData)
      } else {
        addBlock(blockType)
      }
    }
    // If reordering blocks in canvas
    else if (active.id !== over.id) {
      const oldIndex = report.blocks.findIndex((b) => b.id === active.id)
      const newIndex = report.blocks.findIndex((b) => b.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = [...report.blocks]
        const [movedBlock] = newBlocks.splice(oldIndex, 1)
        newBlocks.splice(newIndex, 0, movedBlock)

        // Update positions
        const updatedBlocks = newBlocks.map((block, index) => ({
          ...block,
          position: index,
        }))

        updateReport({ blocks: updatedBlocks })
      }
    }
  }

  function addBlock(type: ReportBlock["type"], data?: any) {
    if (!report) return

    const blockTitles: Record<ReportBlock["type"], string> = {
      "income-summary": "Resumen de Ingresos",
      "expense-chart": "Gráfico de Gastos",
      "balance-sheet": "Balance General",
      "cash-flow": "Flujo de Efectivo",
      ratios: "Análisis de Ratios",
      "executive-summary": "Resumen Ejecutivo",
      "summary-2-months": "Resumen de los últimos dos meses",
      "what-if": "Análisis What IF",
      query: "Consulta SQL",
      "top-news": "Top News",
    }

    const newBlock: ReportBlock = {
      id: `block-${Date.now()}`,
      type,
      title: blockTitles[type],
      position: report.blocks.length,
      data,
    }

    updateReport({ blocks: [...report.blocks, newBlock] })
  }

  function removeBlock(blockId: string) {
    if (!report) return

    const updatedBlocks = report.blocks
      .filter((b) => b.id !== blockId)
      .map((block, index) => ({
        ...block,
        position: index,
      }))

    updateReport({ blocks: updatedBlocks })
  }

  function updateReport(updates: Partial<Report>) {
    if (!report) return

    const updatedReport: Report = {
      ...report,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    setReport(updatedReport)
    saveReport(updatedReport)
  }

  function handleSaveVersion() {
    if (!report) return

    saveReportVersion({
      reportId: report.id,
      version: report.version,
      savedAt: new Date().toISOString(),
      blocks: report.blocks,
    })

    updateReport({ version: report.version + 1 })
  }

  function handleToolChange(toolId: string | null) {
    setSelectedToolId(toolId)
  }

  function handleAddTopNewsBlock(data: TopNewsData) {
    // Store the fetched data for later use when user drags block to canvas
    setPendingTopNewsData(data)

    // Mark that Top News has been queried at least once (shows block in sidebar)
    setHasTopNewsBeenQueried(true)
  }

  function handleAddWhatIfBlock(data: WhatIfData) {
    // Store the fetched data for later use when user drags block to canvas
    setPendingWhatIfData(data)

    // Mark that What IF has been queried at least once (shows block in sidebar)
    setHasWhatIfBeenQueried(true)
  }

  function handleAddQueryBlock(data: QueryData) {
    // Store the fetched data for later use when user drags block to canvas
    setPendingQueryData(data)

    // Mark that Query has been queried at least once (shows block in sidebar)
    setHasQueryBeenQueried(true)
  }

  function handleHistoryUpdate() {
    // Trigger history refresh in sidebar
    setHistoryRefreshTrigger((prev) => prev + 1)
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Cargando editor...</p>
      </div>
    )
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-background flex flex-col">
        <EditorHeader
          report={report}
          onUpdateReport={updateReport}
          onSaveVersion={handleSaveVersion}
        />

        <div className="flex-1 flex overflow-hidden relative">
          <BlocksSidebar
            selectedToolId={selectedToolId}
            hasTopNewsBeenQueried={hasTopNewsBeenQueried}
            hasWhatIfBeenQueried={hasWhatIfBeenQueried}
            hasQueryBeenQueried={hasQueryBeenQueried}
            historyRefreshTrigger={historyRefreshTrigger}
          />

          <SortableContext items={report.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <ReportCanvas report={report} onRemoveBlock={removeBlock} />
          </SortableContext>
        </div>

        {/* Canvas Chat Window - Fixed at bottom */}
        <CanvasChatWindow
          onToolChange={handleToolChange}
          onAddTopNewsBlock={handleAddTopNewsBlock}
          onAddWhatIfBlock={handleAddWhatIfBlock}
          onAddQueryBlock={handleAddQueryBlock}
          onHistoryUpdate={handleHistoryUpdate}
        />

        <DragOverlay>{activeId ? <div className="opacity-50">Arrastrando...</div> : null}</DragOverlay>

        <DataInputDialog
          open={showDataDialog}
          onOpenChange={setShowDataDialog}
          financialData={report.financialData}
          onSave={(data) => {
            updateReport({ financialData: data })
            setShowDataDialog(false)
          }}
        />
      </div>
    </DndContext>
  )
}
