import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { getAuthUrl } from '@/lib/clients/pipedrive'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verificar se usuário está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Buscar organização do usuário
  const { data: organization } = await supabase
    .from('organizations')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!organization) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  // Gerar state com org_id para o callback
  const state = Buffer.from(
    JSON.stringify({ organization_id: organization.id })
  ).toString('base64')

  // URL de callback
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const redirectUri = `${baseUrl}/api/pipedrive/callback`

  // Gerar URL de autorização
  const authUrl = getAuthUrl(redirectUri, state)

  return NextResponse.redirect(authUrl)
}

