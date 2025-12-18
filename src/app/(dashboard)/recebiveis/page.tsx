import { getReceivables, getReceivablesStats } from '@/app/actions/receivables'
import { ReceivablesClient } from './client'

export default async function RecebiveisPage() {
  const [receivables, stats] = await Promise.all([
    getReceivables(),
    getReceivablesStats(),
  ])

  return <ReceivablesClient receivables={receivables} stats={stats} />
}
