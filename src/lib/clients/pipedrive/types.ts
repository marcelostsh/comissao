// Tipos da API Pipedrive (não depende do domínio do projeto)

export type PipedriveTokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  scope: string
  api_domain: string
}

export type PipedriveUser = {
  id: number
  name: string
  email: string
  active_flag: boolean
}

export type PipedriveDeal = {
  id: number
  title: string
  value: number
  currency: string
  status: 'open' | 'won' | 'lost' | 'deleted'
  won_time: string | null
  lost_time: string | null
  close_time: string | null
  add_time: string
  update_time: string
  user_id: number
  person_id: number | null
  org_id: number | null
  pipeline_id: number
  stage_id: number
  owner_name: string
}

export type PipedriveApiResponse<T> = {
  success: boolean
  data: T
  additional_data?: {
    pagination?: {
      start: number
      limit: number
      more_items_in_collection: boolean
    }
  }
}

export type PipedriveErrorResponse = {
  success: false
  error: string
  error_info?: string
}

