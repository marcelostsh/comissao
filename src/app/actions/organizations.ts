'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { commissionEngine } from '@/lib/commission-engine'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').optional(),
  tax_deduction_rate: z
    .number()
    .min(0, 'Taxa deve ser no mínimo 0%')
    .max(100, 'Taxa deve ser no máximo 100%')
    .nullable()
    .optional(),
})

export async function updateOrganization(
  id: string,
  input: z.infer<typeof updateOrganizationSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = updateOrganizationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  try {
    const supabase = await createClient()

    const updateData: Record<string, unknown> = {}
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name
    if (parsed.data.tax_deduction_rate !== undefined) {
      updateData.tax_deduction_rate = parsed.data.tax_deduction_rate
    }

    const { error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar organização:', error)
      return { success: false, error: 'Erro ao atualizar organização' }
    }

    revalidatePath('/configuracoes')
    return { success: true, data: { id } }
  } catch (err) {
    console.error('Erro ao atualizar organização:', err)
    return { success: false, error: 'Erro ao atualizar organização' }
  }
}

/**
 * Recalcula o net_value das vendas do mês atual
 * usando a taxa de dedução atual
 */
export async function recalculateSalesNetValue(
  organizationId: string,
  period?: string // formato: "2025-12"
): Promise<ActionResult<{ updated: number }>> {
  try {
    const supabase = await createClient()

    // Buscar taxa atual da organização
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('tax_deduction_rate')
      .eq('id', organizationId)
      .single()

    if (orgError) {
      return { success: false, error: 'Erro ao buscar organização' }
    }

    const taxRate = Number(org.tax_deduction_rate) || 0

    // Determinar período (default: mês atual)
    const targetPeriod = period || getCurrentPeriod()
    const startDate = `${targetPeriod}-01`
    const [year, month] = targetPeriod.split('-').map(Number)
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    // Buscar vendas do período
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, gross_value')
      .eq('organization_id', organizationId)
      .gte('sale_date', startDate)
      .lte('sale_date', endDate)

    if (salesError) {
      return { success: false, error: 'Erro ao buscar vendas' }
    }

    if (!sales || sales.length === 0) {
      return { success: true, data: { updated: 0 } }
    }

    // Recalcular e atualizar cada venda
    let updated = 0
    for (const sale of sales) {
      const newNetValue = commissionEngine.applyTaxDeduction(sale.gross_value, taxRate)
      
      const { error: updateError } = await supabase
        .from('sales')
        .update({ net_value: newNetValue })
        .eq('id', sale.id)

      if (!updateError) {
        updated++
      }
    }

    revalidatePath('/vendas')
    return { success: true, data: { updated } }
  } catch (err) {
    console.error('Erro ao recalcular vendas:', err)
    return { success: false, error: 'Erro ao recalcular vendas' }
  }
}

function getCurrentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

