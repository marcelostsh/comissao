'use client'

import { useEffect, useState } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Home, Users, Scale, ShoppingCart, BarChart3, Building2, Settings, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { useTheme } from 'next-themes'
import Image from 'next/image'

type UserMode = 'personal' | 'organization' | null

type MenuItem = {
  title: string
  url: string
  icon: any
}

type MenuSection = {
  label: string
  items: MenuItem[]
}

const orgMenuSections: MenuSection[] = [
  {
    label: 'Dashboard',
    items: [
      { title: 'Dashboard', url: '/', icon: Home },
      { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Vendedores', url: '/vendedores', icon: Users },
      { title: 'Regras', url: '/regras', icon: Scale },
      { title: 'Vendas', url: '/vendas', icon: ShoppingCart },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { title: 'Configurações', url: '/configuracoes', icon: Settings },
    ],
  },
]

const personalMenuSections: MenuSection[] = [
  {
    label: 'Vendas',
    items: [
      { title: 'Início', url: '/home', icon: Home },
      { title: 'Nova Venda', url: '/minhasvendas/nova', icon: PlusCircle },
      { title: 'Minhas Vendas', url: '/minhasvendas', icon: ShoppingCart },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { title: 'Meus Clientes', url: '/clientes', icon: Users },
      { title: 'Minhas Pastas', url: '/fornecedores', icon: Building2 },
    ],
  },
  {
    label: 'Resultados',
    items: [
      { title: 'Relatórios', url: '/relatorios-vendedor', icon: BarChart3 },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const [userMode, setUserMode] = useState<UserMode>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true)
    
    async function fetchUserMode() {
      if (!user) return

      const supabase = createClient()
      if (!supabase) return

      const { data } = await supabase
        .from('user_preferences')
        .select('user_mode')
        .eq('user_id', user.id)
        .single()

      setUserMode(data?.user_mode || null)
    }

    fetchUserMode()
  }, [user])

  const menuSections = userMode === 'personal' ? personalMenuSections : orgMenuSections

  const isDark = mounted && resolvedTheme === 'dark'
  const iconSrc = isDark ? '/images/logo/logo_icon_dark.svg' : '/images/logo/logo_icon_light.svg'
  const textSrc = isDark ? '/images/logo/logo_texto_dark.svg' : '/images/logo/logo_texto_light.svg'

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-3">
          <Image
            src={iconSrc}
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-auto"
          />
          <Image
            src={textSrc}
            alt="Audtrax"
            width={120}
            height={24}
            priority
            className="h-5 w-auto"
          />
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        {userMode === 'personal' && <PerformanceWidget />}
      </SidebarFooter>
    </Sidebar>
  )
}

function PerformanceWidget() {
  const [progress, setProgress] = useState(0)
  const [value, setValue] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const duration = 1500 // 1.5s
    const steps = 60
    const interval = duration / steps
    
    const targetValue = 4850
    const targetProgress = 75
    const targetRemaining = 1150

    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progressFactor = currentStep / steps
      
      // Easing out function
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
      const easedFactor = easeOut(progressFactor)

      setValue(targetValue * easedFactor)
      setProgress(targetProgress * easedFactor)
      setRemaining(targetRemaining * easedFactor)

      if (currentStep >= steps) {
        clearInterval(timer)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`mx-2 mb-4 rounded-lg border bg-card p-3 shadow-sm transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Comissão Dezembro
        </span>
        <span className="text-[10px] font-bold text-primary transition-all">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="mb-1 text-lg font-bold">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value)}
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-1.5 rounded-full bg-primary transition-all duration-1000 ease-out"
          style={{ width: `${mounted ? 75 : 0}%` }}
        />
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Faltam {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(remaining)} para a meta
      </p>
    </div>
  )
}

