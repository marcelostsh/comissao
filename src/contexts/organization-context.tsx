'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuth } from './auth-context'

type Organization = {
  id: string
  name: string
  email: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

type OrganizationContextType = {
  organization: Organization | null
  loading: boolean
  refresh: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, isConfigured } = useAuth()
  const supabase = createClient()

  const fetchOrganization = async () => {
    if (!user || !supabase) {
      setOrganization(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching organization:', error)
      setOrganization(null)
      setLoading(false)
      return
    }

    if (!data) {
      // Nenhuma organização encontrada - criar uma padrão
      const orgName = user.user_metadata?.full_name 
        || user.user_metadata?.name 
        || user.email?.split('@')[0] 
        || 'Minha Organização'
      
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .upsert({ 
          name: orgName, 
          owner_id: user.id,
          email: user.email 
        }, { onConflict: 'owner_id', ignoreDuplicates: true })
        .select()
        .maybeSingle()

      if (createError) {
        console.error('Error creating organization:', createError)
        setOrganization(null)
      } else if (newOrg) {
        setOrganization(newOrg)
      } else {
        // Já foi criada por outra chamada - buscar novamente
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle()
        setOrganization(existingOrg)
      }
    } else {
      setOrganization(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    fetchOrganization()
  }, [user, isConfigured])

  const refresh = async () => {
    await fetchOrganization()
  }

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        loading,
        refresh,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
