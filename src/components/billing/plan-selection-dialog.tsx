'use client'

import { Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const plans = [
  {
    name: 'FREE',
    price: 'R$ 0',
    description: 'Para quem está começando',
    features: [
      '1 Usuário (Solo)',
      '1 Pasta de organização',
      'Limite de R$ 2k/mês',
      '30 vendas por mês',
      'Permissão de Dono',
    ],
    buttonText: 'Plano Atual',
    variant: 'outline' as const,
    current: true,
  },
  {
    name: 'PRO',
    price: 'R$ 49,90',
    description: 'Para profissionais em crescimento',
    features: [
      '1 Usuário (Solo)',
      '5 Pastas de organização',
      'Volume financeiro Ilimitado',
      '300 vendas por mês',
      'Permissão de Dono',
    ],
    buttonText: 'Assinar PRO',
    variant: 'default' as const,
  },
  {
    name: 'PRO +',
    price: 'R$ 149,90',
    description: 'Para pequenas equipes',
    features: [
      '3 Usuários (Equipe Pq.)',
      '15 Pastas de organização',
      'Volume financeiro Ilimitado',
      '500 vendas por mês',
      'Admin / Operador',
    ],
    buttonText: 'Assinar PRO+',
    variant: 'default' as const,
    recommended: true,
  },
  {
    name: 'ULTRA',
    price: 'R$ 239,00',
    description: 'Para grandes escritórios',
    features: [
      '5+ Usuários (Escritório)',
      'Pastas Ilimitadas',
      'Volume financeiro Ilimitado',
      'Vendas Ilimitadas',
      'Perfis Personalizados',
    ],
    buttonText: 'Assinar ULTRA',
    variant: 'default' as const,
  },
]

interface PlanSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlanSelectionDialog({ open, onOpenChange }: PlanSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] lg:max-w-7xl overflow-x-auto overflow-y-auto max-h-[95vh] p-4 md:p-8">
        <DialogHeader className="mb-8">
          <DialogTitle className="text-2xl md:text-4xl text-center font-bold">Escolha seu Plano</DialogTitle>
          <DialogDescription className="text-center text-lg max-w-2xl mx-auto">
            Selecione a melhor opção para o seu momento e escale sua operação com controle total.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-4 py-4 min-w-max lg:min-w-0 justify-center items-stretch">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`flex flex-col relative transition-all duration-200 w-full sm:w-[300px] lg:w-full lg:min-w-[260px] xl:min-w-[280px] ${
                plan.recommended ? 'border-primary shadow-2xl ring-2 ring-primary ring-offset-4 ring-offset-background z-10' : 'hover:border-primary/40'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    Recomendado
                  </Badge>
                </div>
              )}
              <CardHeader className="space-y-1 p-4 md:p-5">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="line-clamp-1">{plan.description}</CardDescription>
                <div className="pt-3">
                  <span className="text-2xl md:text-3xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-muted-foreground text-xs ml-1">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 md:p-5 pt-0 md:pt-0">
                <ul className="space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 leading-tight">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="p-4 md:p-5">
                <Button 
                  className="w-full font-bold py-6" 
                  variant={plan.variant}
                  disabled={plan.current}
                >
                  {plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

