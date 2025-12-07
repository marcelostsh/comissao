import {
  createPipedriveClient,
  refreshAccessToken,
  type PipedriveDeal,
} from '@/lib/clients/pipedrive'
import { integrationRepository } from '@/lib/repositories/integration-repository'
import { createClient } from '@/lib/supabase-server'

// Verifica se token está expirado (com margem de 5 minutos)
function isTokenExpired(expiresAt: string): boolean {
  const expiresDate = new Date(expiresAt)
  const now = new Date()
  const marginMs = 5 * 60 * 1000 // 5 minutos
  return expiresDate.getTime() - marginMs <= now.getTime()
}

export const pipedriveSyncService = {
  /**
   * Obtém client Pipedrive com token válido (renova se necessário)
   */
  async getClient(organizationId: string) {
    const integration = await integrationRepository.findByOrganizationAndType(
      organizationId,
      'pipedrive'
    )

    if (!integration) {
      throw new Error('Pipedrive integration not found')
    }

    // Renovar token se expirado
    if (isTokenExpired(integration.expires_at)) {
      const newTokens = await refreshAccessToken(integration.refresh_token)
      const expiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString()

      await integrationRepository.update(integration.id, {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token,
        expires_at: expiresAt,
        provider_account_id: newTokens.api_domain,
      })

      return createPipedriveClient(newTokens.api_domain, newTokens.access_token)
    }

    return createPipedriveClient(
      integration.provider_account_id!,
      integration.access_token
    )
  },

  /**
   * Sincroniza deals ganhos do Pipedrive para tabela sales
   */
  async syncWonDeals(organizationId: string) {
    const client = await this.getClient(organizationId)
    const supabase = await createClient()

    // Buscar todos os deals ganhos
    const deals = await client.getAllWonDeals()

    if (deals.length === 0) {
      return { synced: 0, skipped: 0 }
    }

    // Buscar external_ids já existentes
    const { data: existingSales } = await supabase
      .from('sales')
      .select('external_id')
      .eq('organization_id', organizationId)
      .in(
        'external_id',
        deals.map((d) => String(d.id))
      )

    const existingIds = new Set(existingSales?.map((s) => s.external_id) || [])

    // Filtrar apenas deals novos
    const newDeals = deals.filter((d) => !existingIds.has(String(d.id)))

    if (newDeals.length === 0) {
      return { synced: 0, skipped: deals.length }
    }

    // Transformar deals em sales
    const salesToInsert = newDeals.map((deal) => ({
      organization_id: organizationId,
      external_id: String(deal.id),
      client_name: deal.title,
      gross_value: deal.value,
      net_value: deal.value, // Será recalculado com tax_deduction_rate depois
      sale_date: deal.won_time ? deal.won_time.split(' ')[0] : deal.close_time?.split(' ')[0] || new Date().toISOString().split('T')[0],
      // seller_id será vinculado manualmente ou via mapeamento
    }))

    // Inserir em batch
    const { error } = await supabase.from('sales').insert(salesToInsert)

    if (error) {
      throw new Error(`Failed to sync deals: ${error.message}`)
    }

    return {
      synced: newDeals.length,
      skipped: existingIds.size,
    }
  },

  /**
   * Busca usuários do Pipedrive (vendedores)
   */
  async getUsers(organizationId: string) {
    const client = await this.getClient(organizationId)
    return client.getUsers()
  },

  /**
   * Busca deals do Pipedrive (sem salvar)
   */
  async getDeals(organizationId: string, status?: 'open' | 'won' | 'lost' | 'all_not_deleted') {
    const client = await this.getClient(organizationId)
    const { deals } = await client.getDeals({ status })
    return deals
  },
}

