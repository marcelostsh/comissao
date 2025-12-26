'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/contexts/user-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Pencil, Eye, EyeOff, Server, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { PlanSelectionDialog } from '@/components/billing/plan-selection-dialog'
import { ProfileForm } from '@/components/profile/profile-form'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getEnvironmentVariables, EnvironmentVariable } from '@/app/actions/profiles'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export default function MinhaContaPage() {
  const { signOut } = useAuth()
  const { profile } = useUser()
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([])
  const [envVarsLoading, setEnvVarsLoading] = useState(false)
  const [envVarsOpen, setEnvVarsOpen] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const loadEnvVars = async () => {
    if (envVars.length > 0) return // já carregou
    setEnvVarsLoading(true)
    const result = await getEnvironmentVariables()
    if (result.success && result.data) {
      setEnvVars(result.data)
    }
    setEnvVarsLoading(false)
  }

  const handleEnvVarsToggle = (open: boolean) => {
    setEnvVarsOpen(open)
    if (open) loadEnvVars()
  }

  const maskValue = (value: string | undefined) => {
    if (!value) return '(não configurada)'
    if (value.length <= 12) return '••••••••'
    return `${value.slice(0, 6)}...${value.slice(-6)}`
  }

  const copyToClipboard = async (key: string, value: string | undefined) => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const formatDocument = (value: string | null) => {
    if (!value) return ''
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    } else {
      return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
  }

  const name = profile?.name || 'Sem nome'
  const initials = name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || profile?.email?.[0].toUpperCase() || '?'

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Minha Conta</h1>
        <p className="text-muted-foreground">Gerencie suas informações</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Informações da sua conta e documentos</CardDescription>
          </div>
          <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Perfil</DialogTitle>
                <DialogDescription>
                  Atualize suas informações de faturamento e nome.
                </DialogDescription>
              </DialogHeader>
              <ProfileForm onSuccess={() => setIsProfileModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg">{name}</p>
                {profile?.is_super_admin && (
                  <Badge variant="secondary">Admin do Sistema</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {profile?.document && (
                <p className="text-sm text-muted-foreground mt-1">
                  <span className="font-medium text-foreground">{profile.document_type}:</span> {formatDocument(profile.document)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plano e Faturamento</CardTitle>
          <CardDescription>Gerencie sua assinatura e limites</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <div>
              <p className="font-semibold">Plano Atual: FREE</p>
              <p className="text-sm text-muted-foreground">Você está usando a versão gratuita com limites reduzidos.</p>
            </div>
            <Button variant="default" size="sm" onClick={() => setIsPlanModalOpen(true)}>
              Fazer Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Seção exclusiva para Super Admin */}
      {profile?.is_super_admin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Variáveis de Ambiente
            </CardTitle>
            <CardDescription>
              Visualize as configurações do ambiente atual (apenas super admin)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Collapsible open={envVarsOpen} onOpenChange={handleEnvVarsToggle}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {envVarsOpen ? 'Ocultar variáveis' : 'Mostrar variáveis'}
                  {envVarsOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                {envVarsLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        {showSecrets ? 'Valores visíveis' : 'Valores mascarados'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSecrets(!showSecrets)}
                      >
                        {showSecrets ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showSecrets ? 'Mascarar' : 'Revelar'}
                      </Button>
                    </div>
                    {envVars.map((env) => (
                      <div
                        key={env.key}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-medium">{env.key}</code>
                            {env.isPublic && (
                              <Badge variant="outline" className="text-xs">PUBLIC</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono truncate mt-1">
                            {showSecrets ? (env.value || '(não configurada)') : maskValue(env.value)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 flex-shrink-0"
                          onClick={() => copyToClipboard(env.key, env.value)}
                          disabled={!env.value}
                        >
                          {copiedKey === env.key ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <Button variant="destructive" onClick={signOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sair da conta
          </Button>
        </CardContent>
      </Card>

      <PlanSelectionDialog 
        open={isPlanModalOpen} 
        onOpenChange={setIsPlanModalOpen} 
      />
    </div>
  )
}

