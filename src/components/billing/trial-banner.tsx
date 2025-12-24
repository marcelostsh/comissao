'use client'

import { useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlanSelectionDialog } from './plan-selection-dialog'

export function TrialBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  
  // Mock data - Em um cenário real, isso viria do hook de auth ou banco
  const daysLeft = 3
  const isTrial = true

  if (!isVisible || !isTrial) return null

  const getBannerStyles = () => {
    if (daysLeft <= 3) return 'bg-amber-600 text-white'
    return 'bg-primary text-primary-foreground'
  }

  return (
    <>
      <div className={`w-full py-2 px-4 flex items-center justify-between text-sm font-medium transition-all ${getBannerStyles()}`}>
        <div className="flex-1 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>
            {daysLeft <= 3 
              ? `Atenção: Seu teste grátis termina em ${daysLeft} dias. Assine agora para manter seu acesso total.` 
              : `Você está no período de teste full. Restam ${daysLeft} dias.`}
          </span>
          <button 
            onClick={() => setIsPlanModalOpen(true)}
            className="underline ml-2 hover:opacity-80 transition-opacity"
          >
            Ver Planos
          </button>
        </div>
        <button onClick={() => setIsVisible(false)} className="hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>

      <PlanSelectionDialog 
        open={isPlanModalOpen} 
        onOpenChange={setIsPlanModalOpen} 
      />
    </>
  )
}

