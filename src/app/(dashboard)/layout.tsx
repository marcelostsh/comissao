import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Header } from '@/components/layout/header'
import { TrialBanner } from '@/components/billing/trial-banner'
import { BillingNotificationProvider } from '@/components/billing/billing-notification-provider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <BillingNotificationProvider>
          <TrialBanner />
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </BillingNotificationProvider>
      </SidebarInset>
    </SidebarProvider>
  )
}
