import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { exchangeCodeForTokens, createPipedriveClient } from '@/lib/clients/pipedrive'
import { integrationRepository } from '@/lib/repositories/integration-repository'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  // Erro do Pipedrive
  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/configuracoes?error=${encodeURIComponent(error)}`
    )
  }

  // Validar parâmetros
  if (!code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/configuracoes?error=missing_params`
    )
  }

  // Decodificar state
  let organizationId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    organizationId = decoded.organization_id
  } catch {
    return NextResponse.redirect(
      `${baseUrl}/configuracoes?error=invalid_state`
    )
  }

  // Verificar se usuário está autenticado e é dono da organização
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login`)
  }

  const { data: organization } = await supabase
    .from('organizations')
    .select('id')
    .eq('id', organizationId)
    .eq('owner_id', user.id)
    .single()

  if (!organization) {
    return NextResponse.redirect(
      `${baseUrl}/configuracoes?error=unauthorized`
    )
  }

  try {
    // Trocar code por tokens
    const redirectUri = `${baseUrl}/api/pipedrive/callback`
    const tokens = await exchangeCodeForTokens(code, redirectUri)

    // Buscar info da conta (company domain)
    const client = createPipedriveClient(tokens.api_domain, tokens.access_token)
    const currentUser = await client.getCurrentUser()

    // Buscar tipo de integração
    const integrationType = await integrationRepository.getIntegrationTypeByName('pipedrive')
    if (!integrationType) {
      throw new Error('Integration type not found')
    }

    // Calcular expires_at
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Salvar/atualizar integração
    await integrationRepository.upsertByOrganizationAndType(
      organizationId,
      integrationType.id,
      {
        provider_account_id: tokens.api_domain,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
      }
    )

    return NextResponse.redirect(
      `${baseUrl}/configuracoes?success=pipedrive_connected`
    )
  } catch (err) {
    console.error('Pipedrive callback error:', err)
    return NextResponse.redirect(
      `${baseUrl}/configuracoes?error=connection_failed`
    )
  }
}

