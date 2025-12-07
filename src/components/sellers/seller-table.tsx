'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, RotateCcw } from 'lucide-react'
import { deleteSeller, reactivateSeller } from '@/app/actions/sellers'
import { toast } from 'sonner'
import type { Seller } from '@/types'
import { SellerDialog } from './seller-dialog'

type Props = {
  sellers: Seller[]
  organizationId: string
  showInactive?: boolean
}

export function SellerTable({ sellers, organizationId, showInactive = false }: Props) {
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null)

  const filteredSellers = showInactive
    ? sellers
    : sellers.filter((s) => s.is_active)

  async function handleDelete(id: string) {
    const result = await deleteSeller(id)
    if (result.success) {
      toast.success('Vendedor desativado')
    } else {
      toast.error(result.error)
    }
  }

  async function handleReactivate(id: string) {
    const result = await reactivateSeller(id)
    if (result.success) {
      toast.success('Vendedor reativado')
    } else {
      toast.error(result.error)
    }
  }

  if (filteredSellers.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8">
        Nenhum vendedor cadastrado
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Pipedrive ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSellers.map((seller) => (
            <TableRow key={seller.id}>
              <TableCell className="font-medium">{seller.name}</TableCell>
              <TableCell>{seller.email || '-'}</TableCell>
              <TableCell>
                {seller.pipedrive_id ? (
                  <Badge variant="secondary">{seller.pipedrive_id}</Badge>
                ) : (
                  <span className="text-muted-foreground">Não vinculado</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={seller.is_active ? 'default' : 'outline'}>
                  {seller.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingSeller(seller)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    {seller.is_active ? (
                      <DropdownMenuItem
                        onClick={() => handleDelete(seller.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Desativar
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReactivate(seller.id)}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reativar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SellerDialog
        open={!!editingSeller}
        onOpenChange={(open) => !open && setEditingSeller(null)}
        organizationId={organizationId}
        seller={editingSeller}
      />
    </>
  )
}

