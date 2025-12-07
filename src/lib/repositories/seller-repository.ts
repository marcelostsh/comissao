import { createClient } from '@/lib/supabase-server'
import type { Seller, CreateSellerInput, UpdateSellerInput } from '@/types'

export const sellerRepository = {
  async findById(id: string): Promise<Seller | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  },

  async findByOrganization(organizationId: string): Promise<Seller[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (error) throw new Error(error.message)
    return data
  },

  async findActiveByOrganization(organizationId: string): Promise<Seller[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(error.message)
    return data
  },

  async findByPipedriveId(organizationId: string, pipedriveId: number): Promise<Seller | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('pipedrive_id', pipedriveId)
      .single()

    if (error) return null
    return data
  },

  async create(input: CreateSellerInput): Promise<Seller> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .insert({
        ...input,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async update(id: string, input: UpdateSellerInput): Promise<Seller> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sellers')
      .update(input)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    // Soft delete - marca como inativo
    const { error } = await supabase
      .from('sellers')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  async hardDelete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },
}

