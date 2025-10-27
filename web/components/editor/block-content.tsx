"use client"

import type { ReportBlock } from "@/lib/storage"
import type { FinancialData } from "@/lib/types"
import { IncomeSummaryBlock } from "@/components/blocks/income-summary-block"
import { ExpenseChartBlock } from "@/components/blocks/expense-chart-block"
import { BalanceSheetBlock } from "@/components/blocks/balance-sheet-block"
import { CashFlowBlock } from "@/components/blocks/cash-flow-block"
import { RatiosBlock } from "@/components/blocks/ratios-block"
import { ExecutiveSummaryBlock } from "@/components/blocks/executive-summary-block"
import { Summary2MonthsBlock } from "@/components/blocks/summary-2-months-block"
import { WhatIfBlock } from "@/components/blocks/what-if-block"
import { QueryBlock } from "@/components/blocks/query-block"
import { TopNewsBlock } from "@/components/blocks/top-news-block"

interface BlockContentProps {
  block: ReportBlock
  financialData: FinancialData
}

export function BlockContent({ block, financialData }: BlockContentProps) {
  switch (block.type) {
    case "income-summary":
      return <IncomeSummaryBlock data={financialData} />
    case "expense-chart":
      return <ExpenseChartBlock data={financialData} />
    case "balance-sheet":
      return <BalanceSheetBlock data={financialData} />
    case "cash-flow":
      return <CashFlowBlock data={financialData} />
    case "ratios":
      return <RatiosBlock data={financialData} />
    case "executive-summary":
      return <ExecutiveSummaryBlock data={financialData} />
    case "summary-2-months":
      return <Summary2MonthsBlock />
    case "what-if":
      return <WhatIfBlock data={block.data} />
    case "query":
      return <QueryBlock data={block.data} />
    case "top-news":
      return <TopNewsBlock data={block.data} />
    default:
      return <div className="text-muted-foreground">Tipo de bloque desconocido</div>
  }
}
