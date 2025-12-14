import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getPersonalSales } from '@/app/actions/personal-sales'
import { PersonalSaleTable } from '@/components/sales'

export default async function MinhasVendasPage() {
  const sales = await getPersonalSales()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Minhas Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie suas vendas e acompanhe suas comissões
          </p>
        </div>
        <Button asChild>
          <Link href="/minhasvendas/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Link>
        </Button>
      </div>

      <PersonalSaleTable sales={sales} />
    </div>
  )
}
