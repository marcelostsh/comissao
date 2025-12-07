// OAuth helpers para Pipedrive (não depende do domínio do projeto)

import type { PipedriveTokenResponse } from './types'

const OAUTH_AUTHORIZE_URL = 'https://oauth.pipedrive.com/oauth/authorize'
const OAUTH_TOKEN_URL = 'https://oauth.pipedrive.com/oauth/token'

export function getAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.PIPEDRIVE_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
  })
  return `${OAUTH_AUTHORIZE_URL}?${params}`
}

export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<PipedriveTokenResponse> {
  const credentials = Buffer.from(
    `${process.env.PIPEDRIVE_CLIENT_ID}:${process.env.PIPEDRIVE_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Pipedrive OAuth error: ${error}`)
  }

  return response.json()
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<PipedriveTokenResponse> {
  const credentials = Buffer.from(
    `${process.env.PIPEDRIVE_CLIENT_ID}:${process.env.PIPEDRIVE_CLIENT_SECRET}`
  ).toString('base64')

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Pipedrive refresh token error: ${error}`)
  }

  return response.json()
}

