'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar, AlertTriangle, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { markReceivableAsReceived, undoReceivableReceived, type ReceivableRow, type ReceivablesStats } from '@/app/actions/receivables'
import { toast } from 'sonner'

type Props = {
  receivables: ReceivableRow[]
  stats: ReceivablesStats
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

function getMonthYear(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

function isOverdue(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(dateStr + 'T12:00:00')
  return date < today
}

export function ReceivablesClient({ receivables, stats }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showReceived, setShowReceived] = useState(false)

  // Separar por status
  const pendingReceivables = useMemo(() => {
    return receivables.filter(r => r.status === 'pending')
  }, [receivables])

  const receivedReceivables = useMemo(() => {
    return receivables.filter(r => r.status === 'received')
  }, [receivables])

  // Agrupar pendentes por mês
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, ReceivableRow[]> = {}
    
    for (const r of pendingReceivables) {
      const monthKey = getMonthYear(r.due_date)
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(r)
    }
    
    return groups
  }, [pendingReceivables])

  const handleMarkReceived = async (id: string) => {
    setLoading(id)
    try {
      const result = await markReceivableAsReceived(id)
      if (result.success) {
        toast.success('Marcado como recebido')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erro ao marcar como recebido')
    } finally {
      setLoading(null)
    }
  }

  const handleUndoReceived = async (id: string) => {
    setLoading(id)
    try {
      const result = await undoReceivableReceived(id)
      if (result.success) {
        toast.success('Recebimento desfeito')
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Erro ao desfazer recebimento')
    } finally {
      setLoading(null)
    }
  }

  const isEmpty = receivables.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recebíveis</h1>
        <p className="text-muted-foreground">Acompanhe seus pagamentos e comissões</p>
      </div>

      {/* Cards de Totais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.countPending} {stats.countPending === 1 ? 'parcela' : 'parcelas'}
            </p>
          </CardContent>
        </Card>

        <Card className={cn(stats.totalOverdue > 0 && 'border-destructive/50')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
            <AlertTriangle className={cn('h-4 w-4', stats.totalOverdue > 0 ? 'text-destructive' : 'text-muted-foreground')} />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', stats.totalOverdue > 0 && 'text-destructive')}>
              {formatCurrency(stats.totalOverdue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.countOverdue} {stats.countOverdue === 1 ? 'parcela' : 'parcelas'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebidos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalReceived)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.countReceived} {stats.countReceived === 1 ? 'parcela' : 'parcelas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estado vazio */}
      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="font-semibold">Nenhum recebível</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre vendas para ver a projeção de recebíveis.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Pendentes por Mês */}
      {!isEmpty && Object.keys(groupedByMonth).length > 0 && (
        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([month, items]) => (
            <div key={month} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground capitalize">{month}</h3>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {items.map((receivable) => {
                      const overdue = isOverdue(receivable.due_date)
                      const isLoading = loading === receivable.id

                      return (
                        <div
                          key={receivable.id}
                          className={cn(
                            'flex items-center gap-4 p-4',
                            overdue && 'bg-destructive/5'
                          )}
                        >
                          {/* Checkbox */}
                          <Checkbox
                            checked={false}
                            disabled={isLoading}
                            onCheckedChange={() => handleMarkReceived(receivable.id)}
                            className="h-5 w-5"
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn('font-medium', overdue && 'text-destructive')}>
                                {formatDate(receivable.due_date)}
                              </span>
                              {overdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Atrasado
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {receivable.sale?.client_name || 'Cliente não informado'}
                              {receivable.supplier && (
                                <span className="text-muted-foreground/70">
                                  {' · '}{receivable.supplier.name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Valores */}
                          <div className="text-right">
                            <div className="font-mono font-semibold text-green-600">
                              {formatCurrency(receivable.expected_amount || 0)}
                            </div>
                            {receivable.installment_value && (
                              <div className="text-xs text-muted-foreground font-mono">
                                de {formatCurrency(receivable.installment_value)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Recebidos (colapsável) */}
      {receivedReceivables.length > 0 && (
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-between text-muted-foreground"
            onClick={() => setShowReceived(!showReceived)}
          >
            <span>Recebidos ({receivedReceivables.length})</span>
            {showReceived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showReceived && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {receivedReceivables.map((receivable) => {
                    const isLoading = loading === receivable.id

                    return (
                      <div
                        key={receivable.id}
                        className="flex items-center gap-4 p-4 opacity-60"
                      >
                        {/* Checkbox marcado */}
                        <Checkbox
                          checked={true}
                          disabled={isLoading}
                          onCheckedChange={() => handleUndoReceived(receivable.id)}
                          className="h-5 w-5"
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium line-through">
                              {formatDate(receivable.due_date)}
                            </span>
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">
                              Recebido
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {receivable.sale?.client_name || 'Cliente não informado'}
                          </div>
                        </div>

                        {/* Valores */}
                        <div className="text-right">
                          <div className="font-mono font-semibold">
                            {formatCurrency(receivable.received_amount || receivable.expected_amount || 0)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

