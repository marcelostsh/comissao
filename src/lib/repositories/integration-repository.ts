import { createClient } from '@/lib/supabase-server'
import type {
  Integration,
  IntegrationType,
  IntegrationWithType,
  CreateIntegrationInput,
  UpdateIntegrationInput,
} from '@/types'

export const integrationRepository = {
  async findById(id: string): Promise<Integration | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async findByOrganization(organizationId: string): Promise<IntegrationWithType[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integrations')
      .select('*, integration_type:integration_types(*)')
      .eq('organization_id', organizationId)

    if (error) throw new Error(error.message)
    return data as IntegrationWithType[]
  },

  async findByOrganizationAndType(
    organizationId: string,
    typeName: string
  ): Promise<IntegrationWithType | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integrations')
      .select('*, integration_type:integration_types!inner(*)')
      .eq('organization_id', organizationId)
      .eq('integration_types.name', typeName)
      .single()

    if (error) return null
    return data as IntegrationWithType
  },

  async getIntegrationTypeByName(name: string): Promise<IntegrationType | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integration_types')
      .select('*')
      .eq('name', name)
      .single()

    if (error) return null
    return data
  },

  async create(input: CreateIntegrationInput): Promise<Integration> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integrations')
      .insert(input)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, input: UpdateIntegrationInput): Promise<Integration> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integrations')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async upsertByOrganizationAndType(
    organizationId: string,
    integrationTypeId: string,
    input: Omit<CreateIntegrationInput, 'organization_id' | 'integration_type_id'>
  ): Promise<Integration> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integrations')
      .upsert(
        {
          organization_id: organizationId,
          integration_type_id: integrationTypeId,
          ...input,
        },
        {
          onConflict: 'organization_id,integration_type_id',
        }
      )
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}

