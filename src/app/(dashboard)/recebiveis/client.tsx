'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  Search,
  FilterX
} from 'lucide-react'
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
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date)
}

function getMonthYear(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date)
}

function InstallmentDots({ current, total, status }: { current: number, total: number, status: string }) {
  return (
    <div className="flex gap-1 mt-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full transition-colors",
            i + 1 < current ? "bg-green-500" : 
            i + 1 === current ? (status === 'overdue' ? "bg-destructive animate-pulse" : "bg-primary") : 
            "bg-muted"
          )}
        />
      ))}
    </div>
  )
}

export function ReceivablesClient({ receivables, stats }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [showReceived, setShowReceived] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue' | 'received'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const filteredReceivables = useMemo(() => {
    return receivables.filter(r => {
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'pending' && (r.status === 'pending' || r.status === 'overdue')) ||
        (filterStatus === 'overdue' && r.status === 'overdue') ||
        (filterStatus === 'received' && r.status === 'received')
      
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = !searchTerm || 
        r.client_name?.toLowerCase().includes(searchLower) ||
        r.supplier_name?.toLowerCase().includes(searchLower)
      
      return matchesStatus && matchesSearch
    })
  }, [receivables, filterStatus, searchTerm])

  // Separar pendentes (inclui atrasados se não filtrado especificamente)
  const displayPending = useMemo(() => {
    return filteredReceivables.filter(r => r.status !== 'received')
  }, [filteredReceivables])

  const displayReceived = useMemo(() => {
    return filteredReceivables.filter(r => r.status === 'received')
  }, [filteredReceivables])

  // Agrupar pendentes por mês
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, ReceivableRow[]> = {}
    
    for (const r of displayPending) {
      const monthKey = getMonthYear(r.due_date)
      if (!groups[monthKey]) {
        groups[monthKey] = []
      }
      groups[monthKey].push(r)
    }
    
    return groups
  }, [displayPending])

  const handleMarkReceived = async (receivable: ReceivableRow) => {
    const key = `${receivable.personal_sale_id}-${receivable.installment_number}`
    setLoading(key)
    try {
      const result = await markReceivableAsReceived(
        receivable.personal_sale_id,
        receivable.installment_number,
        receivable.expected_commission
      )
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

  const handleUndoReceived = async (receivable: ReceivableRow) => {
    const key = `${receivable.personal_sale_id}-${receivable.installment_number}`
    setLoading(key)
    try {
      const result = await undoReceivableReceived(
        receivable.personal_sale_id,
        receivable.installment_number
      )
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-primary">Recebíveis</h1>
        <p className="text-muted-foreground text-lg">Gerencie seu fluxo de comissões com precisão.</p>
      </div>

      {/* Cards de Totais - Interativos */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <button 
          onClick={() => setFilterStatus('all')}
          className={cn(
            "text-left transition-all duration-200",
            filterStatus === 'all' ? "scale-[1.02]" : "opacity-80 hover:opacity-100"
          )}
        >
          <Card className={cn("h-full border-2", filterStatus === 'all' ? "border-primary/50 shadow-md" : "border-transparent")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Projetado</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalPending + stats.totalReceived)}</div>
            </CardContent>
          </Card>
        </button>

        <button 
          onClick={() => setFilterStatus('pending')}
          className={cn(
            "text-left transition-all duration-200",
            filterStatus === 'pending' ? "scale-[1.02]" : "opacity-80 hover:opacity-100"
          )}
        >
          <Card className={cn("h-full border-2", filterStatus === 'pending' ? "border-blue-500/50 shadow-md" : "border-transparent")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">A Receber</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalPending)}</div>
              <p className="text-[10px] font-medium text-muted-foreground mt-1">
                {stats.countPending} {stats.countPending === 1 ? 'PARCELA' : 'PARCELAS'}
              </p>
            </CardContent>
          </Card>
        </button>

        <button 
          onClick={() => setFilterStatus('overdue')}
          className={cn(
            "text-left transition-all duration-200",
            filterStatus === 'overdue' ? "scale-[1.02]" : "opacity-80 hover:opacity-100"
          )}
        >
          <Card className={cn(
            "h-full border-2", 
            filterStatus === 'overdue' ? "border-destructive/50 shadow-md" : "border-transparent",
            stats.totalOverdue > 0 && filterStatus !== 'overdue' && "border-destructive/20"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Atrasados</CardTitle>
              <AlertTriangle className={cn('h-4 w-4', stats.totalOverdue > 0 ? 'text-destructive animate-bounce' : 'text-muted-foreground')} />
            </CardHeader>
            <CardContent>
              <div className={cn('text-2xl font-bold', stats.totalOverdue > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                {formatCurrency(stats.totalOverdue)}
              </div>
              <p className="text-[10px] font-medium text-muted-foreground mt-1">
                {stats.countOverdue} {stats.countOverdue === 1 ? 'PARCELA' : 'PARCELAS'}
              </p>
            </CardContent>
          </Card>
        </button>

        <button 
          onClick={() => setFilterStatus('received')}
          className={cn(
            "text-left transition-all duration-200",
            filterStatus === 'received' ? "scale-[1.02]" : "opacity-80 hover:opacity-100"
          )}
        >
          <Card className={cn("h-full border-2", filterStatus === 'received' ? "border-green-500/50 shadow-md" : "border-transparent")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recebidos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalReceived)}</div>
              <p className="text-[10px] font-medium text-muted-foreground mt-1">
                {stats.countReceived} {stats.countReceived === 1 ? 'PARCELA' : 'PARCELAS'}
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Toolbar: Busca e Reset de Filtro */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar cliente ou fornecedor..." 
            className="pl-9 bg-background border-none shadow-sm focus-visible:ring-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {(filterStatus !== 'all' || searchTerm) && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setFilterStatus('all'); setSearchTerm('') }}
            className="text-muted-foreground hover:text-primary"
          >
            <FilterX className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>

      {/* Estado vazio */}
      {isEmpty && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="mb-4 h-16 w-16 text-muted-foreground/20" />
            <h3 className="text-xl font-semibold">Nenhum recebível por aqui</h3>
            <p className="text-muted-foreground max-w-[300px] mt-2">
              As projeções aparecem conforme você cadastra novas vendas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de Pendentes por Mês */}
      {!isEmpty && Object.keys(groupedByMonth).length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([month, items]) => (
            <div key={month} className="space-y-3">
              <div className="flex items-center gap-4 px-1">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{month}</h3>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              
              <div className="grid gap-3">
                {items.map((receivable) => {
                  const isOverdue = receivable.status === 'overdue'
                  const isToday = receivable.due_date === today
                  const key = `${receivable.personal_sale_id}-${receivable.installment_number}`
                  const isLoading = loading === key

                  return (
                    <Card 
                      key={key} 
                      className={cn(
                        "group transition-all duration-200 hover:shadow-md border-l-4 overflow-hidden",
                        isOverdue ? "border-l-destructive bg-destructive/5" : 
                        isToday ? "border-l-orange-500 bg-orange-500/5 shadow-sm" : 
                        "border-l-transparent"
                      )}
                    >
                      <CardContent className="p-0">
                        <div className="flex items-center gap-4 p-4">
                          {/* Ação Principal: Checkbox */}
                          <div className="flex flex-col items-center gap-2">
                            <Checkbox
                              checked={false}
                              disabled={isLoading}
                              onCheckedChange={() => handleMarkReceived(receivable)}
                              className="h-6 w-6 border-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                          </div>

                          {/* Data e Status */}
                          <div className="flex flex-col items-center justify-center min-w-[60px] border-r pr-4 border-border/50">
                            <span className={cn(
                              "text-lg font-bold leading-none",
                              isOverdue ? "text-destructive" : isToday ? "text-orange-600" : "text-foreground"
                            )}>
                              {formatDate(receivable.due_date).split('/')[0]}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">
                              {new Date(receivable.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                            </span>
                            {isToday && (
                              <Badge className="mt-1 px-1 py-0 text-[8px] bg-orange-500 hover:bg-orange-500 border-none">HOJE</Badge>
                            )}
                          </div>

                          {/* Info Cliente/Produto */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-semibold text-base truncate">
                                {receivable.client_name || 'Cliente Final'}
                              </h4>
                              {isOverdue && (
                                <Badge variant="destructive" className="h-4 text-[10px] font-bold px-1.5 uppercase">Atrasado</Badge>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <span className="font-medium text-foreground/80">{receivable.supplier_name || 'Direto'}</span>
                                <span className="text-muted-foreground/30">•</span>
                                <span className="text-xs">Parcela {receivable.installment_number} de {receivable.total_installments}</span>
                              </div>
                              <InstallmentDots 
                                current={receivable.installment_number} 
                                total={receivable.total_installments} 
                                status={receivable.status}
                              />
                            </div>
                          </div>

                          {/* Valor da Comissão (O que importa) */}
                          <div className="text-right">
                            <div className="text-xs font-bold uppercase text-muted-foreground/60 leading-tight">Comissão</div>
                            <div className={cn(
                              "text-xl font-black font-mono tracking-tight",
                              isOverdue ? "text-destructive" : "text-green-600"
                            )}>
                              {formatCurrency(receivable.expected_commission || 0)}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tighter">
                              venda: {formatCurrency(receivable.installment_value || 0)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recebidos (colapsável e filtrado) */}
      {(displayReceived.length > 0 || filterStatus === 'received') && (
        <div className="pt-4 space-y-4">
          <Button
            variant="outline"
            className="w-full justify-between h-12 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => setShowReceived(!showReceived)}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-semibold">Histórico de Recebidos</span>
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 hover:bg-green-100 border-none">
                {displayReceived.length}
              </Badge>
            </div>
            {showReceived ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showReceived && (
            <div className="grid gap-3">
              {displayReceived.map((receivable) => {
                const key = `${receivable.personal_sale_id}-${receivable.installment_number}`
                const isLoading = loading === key

                return (
                  <Card 
                    key={key} 
                    className="group transition-all duration-200 border-l-4 border-l-green-500 bg-green-50/30 opacity-75 hover:opacity-100"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center gap-4 p-4">
                        <Checkbox
                          checked={true}
                          disabled={isLoading}
                          onCheckedChange={() => handleUndoReceived(receivable)}
                          className="h-6 w-6 border-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />

                        <div className="flex flex-col items-center justify-center min-w-[60px] border-r pr-4 border-border/50 opacity-60">
                          <span className="text-lg font-bold leading-none line-through">{formatDate(receivable.due_date).split('/')[0]}</span>
                          <span className="text-[10px] font-bold uppercase text-muted-foreground">
                            {new Date(receivable.due_date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base truncate line-through text-muted-foreground">
                            {receivable.client_name || 'Cliente Final'}
                          </h4>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Recebido em {receivable.received_at ? formatDate(receivable.received_at) : '-'}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold uppercase text-muted-foreground/60 leading-tight">Recebido</div>
                          <div className="text-xl font-black font-mono tracking-tight text-green-700/80">
                            {formatCurrency(receivable.received_amount || receivable.expected_commission || 0)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
