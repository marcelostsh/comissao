'use server'

import { integrationRepository } from '@/lib/repositories/integration-repository'
import { pipedriveSyncService } from '@/lib/services/pipedrive-sync-service'
import { revalidatePath } from 'next/cache'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function getIntegrations(organizationId: string) {
  return integrationRepository.findByOrganization(organizationId)
}

export async function getPipedriveIntegration(organizationId: string) {
  return integrationRepository.findByOrganizationAndType(organizationId, 'pipedrive')
}

export async function disconnectIntegration(
  integrationId: string
): Promise<ActionResult<void>> {
  try {
    await integrationRepository.delete(integrationId)
    revalidatePath('/configuracoes')
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: 'Erro ao desconectar integração' }
  }
}

export async function syncPipedriveDeals(
  organizationId: string
): Promise<ActionResult<{ synced: number; skipped: number }>> {
  try {
    const result = await pipedriveSyncService.syncWonDeals(organizationId)
    revalidatePath('/vendas')
    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao sincronizar deals'
    return { success: false, error: message }
  }
}

export async function getPipedriveUsers(organizationId: string) {
  try {
    return await pipedriveSyncService.getUsers(organizationId)
  } catch (err) {
    return []
  }
}

export async function getPipedriveDeals(
  organizationId: string,
  status?: 'open' | 'won' | 'lost' | 'all_not_deleted'
) {
  try {
    return await pipedriveSyncService.getDeals(organizationId, status)
  } catch (err) {
    return []
  }
}

