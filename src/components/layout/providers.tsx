'use client'

import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/auth-context'
import { OrganizationProvider } from '@/contexts/organization-context'
import { UserProvider } from '@/contexts/user-context'
import { Toaster } from '@/components/ui/sonner'
import { AuthErrorWatcher } from '@/components/auth/auth-error-watcher'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <UserProvider>
          <OrganizationProvider>
            <AuthErrorWatcher />
            {children}
            <Toaster />
          </OrganizationProvider>
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
