'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'

export type ReceivableRow = {
  id: string
  user_id: string
  personal_sale_id: string | null
  supplier_id: string | null
  due_date: string
  expected_amount: number | null
  installment_value: number | null
  received_amount: number | null
  status: 'pending' | 'received' | 'overdue' | 'partial'
  received_at: string | null
  notes: string | null
  created_at: string
  sale: {
    id: string
    client_name: string | null
  } | null
  supplier: {
    id: string
    name: string
  } | null
}

export type ReceivablesStats = {
  totalPending: number
  totalOverdue: number
  totalReceived: number
  countPending: number
  countOverdue: number
  countReceived: number
}

export async function getReceivables(): Promise<ReceivableRow[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data, error } = await supabase
    .from('receivables')
    .select(`
      *,
      sale:personal_sales(id, client_name),
      supplier:personal_suppliers(id, name)
    `)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getReceivablesStats(): Promise<ReceivablesStats> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('receivables')
    .select('due_date, expected_amount, status')
    .eq('user_id', user.id)

  if (error) throw error

  const rows = data || []
  
  const pending = rows.filter(r => r.status === 'pending')
  const overdue = pending.filter(r => r.due_date < today)
  const pendingNotOverdue = pending.filter(r => r.due_date >= today)
  const received = rows.filter(r => r.status === 'received')

  return {
    totalPending: pendingNotOverdue.reduce((sum, r) => sum + (r.expected_amount || 0), 0),
    totalOverdue: overdue.reduce((sum, r) => sum + (r.expected_amount || 0), 0),
    totalReceived: received.reduce((sum, r) => sum + (r.expected_amount || 0), 0),
    countPending: pendingNotOverdue.length,
    countOverdue: overdue.length,
    countReceived: received.length,
  }
}

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function markReceivableAsReceived(
  id: string,
  receivedAmount?: number
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    // Buscar o recebível para pegar o expected_amount se não foi informado
    const { data: receivable, error: fetchError } = await supabase
      .from('receivables')
      .select('expected_amount')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !receivable) {
      return { success: false, error: 'Recebível não encontrado' }
    }

    const amount = receivedAmount ?? receivable.expected_amount ?? 0

    const { error } = await supabase
      .from('receivables')
      .update({
        status: 'received',
        received_amount: amount,
        received_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/recebiveis')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error marking receivable as received:', err)
    return { success: false, error: 'Erro ao marcar como recebido' }
  }
}

export async function updateReceivableNotes(
  id: string,
  notes: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { error } = await supabase
      .from('receivables')
      .update({ notes })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/recebiveis')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error updating receivable notes:', err)
    return { success: false, error: 'Erro ao atualizar observação' }
  }
}

export async function undoReceivableReceived(id: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuário não autenticado' }
    }

    const { error } = await supabase
      .from('receivables')
      .update({
        status: 'pending',
        received_amount: null,
        received_at: null,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/recebiveis')
    return { success: true, data: undefined }
  } catch (err) {
    console.error('Error undoing receivable received:', err)
    return { success: false, error: 'Erro ao desfazer recebimento' }
  }
}

