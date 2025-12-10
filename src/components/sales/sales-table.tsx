'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AlertTriangle, Lock } from 'lucide-react'
import type { SaleWithCommission } from '@/types'

type SelectionType = 'reverse' | 'delete'

type Props = {
  sales: SaleWithCommission[]
  selectionMode?: boolean
  selectionType?: SelectionType
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function SalesTable({
  sales,
  selectionMode = false,
  selectionType = 'reverse',
  selectedIds = new Set(),
  onSelectionChange,
}: Props) {
  // Vendas elegíveis dependem do tipo de seleção
  // Estorno: apenas comissões fechadas
  // Delete: todas as vendas (gestor tem liberdade total)
  const eligibleSales = selectionType === 'reverse'
    ? sales.filter((s) => s.commission?.is_closed)
    : sales

  function handleToggle(saleId: string) {
    if (!onSelectionChange) return
    const newSet = new Set(selectedIds)
    if (newSet.has(saleId)) {
      newSet.delete(saleId)
    } else {
      newSet.add(saleId)
    }
    onSelectionChange(newSet)
  }

  function handleToggleAll() {
    if (!onSelectionChange) return
    if (selectedIds.size === eligibleSales.length) {
      // Desmarcar todos
      onSelectionChange(new Set())
    } else {
      // Marcar todos
      onSelectionChange(new Set(eligibleSales.map((s) => s.id)))
    }
  }

  if (sales.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Nenhuma venda encontrada
      </div>
    )
  }

  const allSelected = eligibleSales.length > 0 && selectedIds.size === eligibleSales.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < eligibleSales.length

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            {selectionMode && (
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onCheckedChange={handleToggleAll}
                  aria-label="Selecionar todas"
                />
              </TableHead>
            )}
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Valor Bruto</TableHead>
            <TableHead className="text-right">Valor Líquido</TableHead>
            <TableHead className="text-right">Comissão</TableHead>
            <TableHead>Origem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const isClosed = sale.commission?.is_closed
            const isDeletedFromSource = !!sale.source_deleted_at
            const isEligible = selectionType === 'reverse' ? isClosed : isDeletedFromSource
            const isSelected = selectedIds.has(sale.id)

            return (
              <TableRow
                key={sale.id}
                className={isSelected ? 'bg-muted/50' : undefined}
              >
                {selectionMode && (
                  <TableCell>
                    {isEligible ? (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(sale.id)}
                        aria-label={`Selecionar ${sale.client_name}`}
                      />
                    ) : (
                      <span className="w-4" />
                    )}
                  </TableCell>
                )}
                <TableCell>{formatDate(sale.sale_date)}</TableCell>
                <TableCell className="font-medium">{sale.client_name}</TableCell>
                <TableCell>{sale.seller?.name || '-'}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.gross_value)}</TableCell>
                <TableCell className="text-right">{formatCurrency(sale.net_value)}</TableCell>
                <TableCell className="text-right">
                  {sale.commission ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          sale.commission.is_closed
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {formatCurrency(sale.commission.amount)}
                          {sale.commission.is_closed && <Lock className="h-3 w-3" />}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <p>{sale.commission.rule_name || 'Regra não definida'}</p>
                          <p>{sale.commission.percentage_applied.toFixed(2)}%</p>
                          <p className="text-muted-foreground">
                            {sale.commission.is_closed ? 'Fechada' : 'Calculada (aberta)'}
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {sale.integration ? (
                    sale.source_deleted_at ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="cursor-help bg-amber-500/20 text-amber-600 border border-amber-500/40 hover:bg-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/40">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {sale.integration.type_name.charAt(0).toUpperCase() + sale.integration.type_name.slice(1)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="left" 
                          className="max-w-xs p-0 bg-zinc-900 dark:bg-zinc-900 border border-amber-500/50 shadow-lg shadow-amber-500/10"
                        >
                          <div className="px-3 py-2 border-b border-amber-500/30 bg-amber-500/10">
                            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                              <AlertTriangle className="h-4 w-4" />
                              Removida da origem
                            </div>
                          </div>
                          <div className="px-3 py-2 space-y-2">
                            <p className="text-zinc-200 text-sm">
                              Esta venda não existe mais no {sale.integration.type_name.charAt(0).toUpperCase() + sale.integration.type_name.slice(1)}.
                            </p>
                            <div className="text-xs space-y-0.5 text-zinc-400">
                              <p>
                                <span className="text-zinc-500">Detectado:</span>{' '}
                                {new Date(sale.source_deleted_at).toLocaleDateString('pt-BR')}
                              </p>
                              {sale.external_id && (
                                <p>
                                  <span className="text-zinc-500">ID original:</span>{' '}
                                  {sale.external_id}
                                </p>
                              )}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Badge variant="outline">
                        {sale.integration.type_name.charAt(0).toUpperCase() + sale.integration.type_name.slice(1)}
                      </Badge>
                    )
                  ) : (
                    <Badge variant="secondary">Manual</Badge>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  )
}

