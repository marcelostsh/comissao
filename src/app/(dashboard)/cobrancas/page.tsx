import { Suspense } from 'react'
import { getInvoicesAction } from '@/app/actions/billing'
import { CobrancasClient } from './client'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'Minhas Cobranças | uComis',
}

export default async function CobrancasPage() {
  const invoices = await getInvoicesAction()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Faturamento e Cobranças</h1>
        <p className="text-muted-foreground">Gerencie seus pagamentos, histórico de faturas e status da sua assinatura.</p>
      </div>

      <Suspense fallback={<CobrancasSkeleton />}>
        <CobrancasClient initialInvoices={invoices} />
      </Suspense>
    </div>
  )
}

function CobrancasSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}

