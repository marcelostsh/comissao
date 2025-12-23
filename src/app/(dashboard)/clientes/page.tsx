import { getPersonalClients } from '@/app/actions/personal-clients'
import { ClientesClient } from './client'

export default async function ClientesPage() {
  const clients = await getPersonalClients()

  return <ClientesClient initialClients={clients} />
}
