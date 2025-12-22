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
import { Home, Users, Scale, ShoppingCart, BarChart3, Building2, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase'
import { useTheme } from 'next-themes'
import Image from 'next/image'

type UserMode = 'personal' | 'organization' | null

const orgMenuItems = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Vendedores', url: '/vendedores', icon: Users },
  { title: 'Regras', url: '/regras', icon: Scale },
  { title: 'Vendas', url: '/vendas', icon: ShoppingCart },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3 },
  { title: 'Configurações', url: '/configuracoes', icon: Settings },
]

const personalMenuItems = [
  { title: 'Início', url: '/home', icon: Home },
  { title: 'Minhas Pastas', url: '/fornecedores', icon: Building2 },
  { title: 'Minhas Vendas', url: '/minhasvendas', icon: ShoppingCart },
  { title: 'Minha Conta', url: '/minhaconta', icon: User },
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

  const menuItems = userMode === 'personal' ? personalMenuItems : orgMenuItems

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
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
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
      </SidebarContent>
      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground">© 2025 Audtrax</div>
      </SidebarFooter>
    </Sidebar>
  )
}
