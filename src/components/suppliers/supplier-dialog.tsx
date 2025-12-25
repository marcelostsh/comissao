'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RuleForm, type RuleFormRef } from '@/components/rules'
import { createPersonalSupplierWithRule } from '@/app/actions/personal-suppliers'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { PersonalSupplierWithRule } from '@/app/actions/personal-suppliers'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (supplier: PersonalSupplierWithRule) => void
}

export function SupplierDialog({ open, onOpenChange, onSuccess }: Props) {
  const ruleFormRef = useRef<RuleFormRef>(null)
  
  const [name, setName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [loading, setLoading] = useState(false)

  function formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  function handleCnpjChange(value: string) {
    setCnpj(formatCnpj(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    if (!ruleFormRef.current?.validate()) {
      toast.error('Configure a regra de comissão')
      return
    }

    setLoading(true)

    try {
      const ruleData = ruleFormRef.current.getData()
      const cleanCnpj = cnpj.replace(/\D/g, '') || undefined

      const result = await createPersonalSupplierWithRule({
        name,
        cnpj: cleanCnpj,
        rule: {
          name: ruleData.name || `${name} - Regra`,
          type: ruleData.type,
          percentage: ruleData.percentage,
          tiers: ruleData.tiers,
        },
      })

      if (result.success) {
        toast.success('Fornecedor criado')
        onSuccess(result.data)
        onOpenChange(false)
        // Reset form
        setName('')
        setCnpj('')
      } else {
        toast.error(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
          <DialogDescription>
            Cadastre uma nova empresa/fábrica que você representa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-name">Nome da Empresa/Fábrica *</Label>
              <Input
                id="supplier-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Tintas Coral"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier-cnpj">CNPJ</Label>
              <Input
                id="supplier-cnpj"
                value={cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                placeholder="00.000.000/0000-00"
              />
              <p className="text-muted-foreground text-xs">
                Opcional.
              </p>
            </div>

            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="mb-4">
                <Label className="text-base font-semibold">Regra de Comissão</Label>
                <p className="text-sm text-muted-foreground">
                  Configure como sua comissão é calculada
                </p>
              </div>
              
              <RuleForm
                ref={ruleFormRef}
                showName={false}
                showDefault={false}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Pasta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

