import { getReceivables, getReceivablesStats } from '@/app/actions/receivables'
import { ReceivablesClient } from '../recebiveis/client'

export default async function VendedorHomePage() {
  const [receivables, stats] = await Promise.all([
    getReceivables(),
    getReceivablesStats(),
  ])

  return (
    <div className="space-y-6">
      <ReceivablesClient receivables={receivables} stats={stats} isHome />
    </div>
  )
}
