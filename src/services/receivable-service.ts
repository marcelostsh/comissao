'use server'

import { createReceivablesBatch, deleteReceivablesBySaleId, type CreateReceivableInput } from '@/repositories/receivable-repository'

type GenerateReceivablesInput = {
  saleId: string
  supplierId: string
  userId: string
  saleDate: string
  grossValue: number
  commissionValue: number
  paymentCondition: string | null
}

/**
 * Gera recebíveis a partir de uma venda.
 * 
 * - Se à vista (sem payment_condition): gera 1 recebível na data da venda
 * - Se parcelado (30/60/90): gera N recebíveis com datas calculadas
 * 
 * @param input Dados da venda
 * @returns Lista de recebíveis criados
 */
export async function generateReceivablesFromSale(input: GenerateReceivablesInput) {
  const { saleId, supplierId, userId, saleDate, grossValue, commissionValue, paymentCondition } = input

  // Parse da condição de pagamento
  const days = parsePaymentCondition(paymentCondition)
  const installmentCount = days.length

  // Calcular valor por parcela
  const installmentValue = grossValue / installmentCount
  const commissionPerInstallment = commissionValue / installmentCount

  // Calcular datas de vencimento
  const baseDate = new Date(saleDate + 'T12:00:00')

  const receivables: CreateReceivableInput[] = days.map((dayOffset) => {
    const dueDate = addDays(baseDate, dayOffset)
    return {
      personal_sale_id: saleId,
      supplier_id: supplierId,
      due_date: formatDateISO(dueDate),
      expected_amount: commissionPerInstallment,
      installment_value: installmentValue,
    }
  })

  // Criar em batch
  return createReceivablesBatch(receivables, userId)
}

/**
 * Regenera recebíveis de uma venda (usado em edição).
 * Deleta os existentes e cria novos.
 */
export async function regenerateReceivablesFromSale(input: GenerateReceivablesInput) {
  // Deletar existentes
  await deleteReceivablesBySaleId(input.saleId)

  // Criar novos
  return generateReceivablesFromSale(input)
}

// =====================================================
// UTILS
// =====================================================

/**
 * Parse da condição de pagamento.
 * "30/60/90" → [30, 60, 90]
 * "" ou null → [0] (à vista)
 */
function parsePaymentCondition(condition: string | null): number[] {
  if (!condition || condition.trim() === '') {
    return [0] // À vista
  }

  const parts = condition
    .split('/')
    .map(p => parseInt(p.trim()))
    .filter(n => !isNaN(n) && n >= 0)

  return parts.length > 0 ? parts : [0]
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

