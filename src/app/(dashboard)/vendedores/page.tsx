'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { getSellers } from '@/app/actions/sellers'
import { SellerTable, SellerDialog } from '@/components/sellers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Users } from 'lucide-react'
import type { Seller } from '@/types'

export default function VendedoresPage() {
  const { organization, loading: orgLoading } = useOrganization()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    async function loadSellers() {
      if (!organization) return

      setLoading(true)
      try {
        const data = await getSellers(organization.id)
        setSellers(data)
      } finally {
        setLoading(false)
      }
    }

    if (organization) {
      loadSellers()
    }
  }, [organization])

  // Recarregar quando dialog fechar (após criar/editar)
  useEffect(() => {
    async function reload() {
      if (!organization || dialogOpen) return
      const data = await getSellers(organization.id)
      setSellers(data)
    }
    reload()
  }, [dialogOpen, organization])

  if (orgLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Organização não encontrada
      </div>
    )
  }

  const activeCount = sellers.filter((s) => s.is_active).length
  const inactiveCount = sellers.filter((s) => !s.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-muted-foreground">
            Gerencie os vendedores da sua organização
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Vendedor
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sellers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{inactiveCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Vendedores</CardTitle>
              <CardDescription>
                {showInactive
                  ? 'Mostrando todos os vendedores'
                  : 'Mostrando apenas vendedores ativos'}
              </CardDescription>
            </div>
            {inactiveCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? 'Ocultar inativos' : 'Mostrar inativos'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <SellerTable
              sellers={sellers}
              organizationId={organization.id}
              showInactive={showInactive}
            />
          )}
        </CardContent>
      </Card>

      <SellerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        organizationId={organization.id}
      />
    </div>
  )
}

