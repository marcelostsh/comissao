'use client'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Pie, PieChart, Cell } from 'recharts'

type DonutDataItem = {
  name: string
  value: number
  fill: string
}

type DonutCardProps = {
  title: string
  value: string | number
  subtitle?: string
  data: DonutDataItem[]
}

export function DonutCard({ title, value, subtitle, data }: DonutCardProps) {
  // Gera chartConfig dinamicamente a partir do data
  const chartConfig = data.reduce((acc, item) => {
    acc[item.name.toLowerCase()] = { label: item.name, color: item.fill }
    return acc
  }, {} as ChartConfig)

  // Calcula total para percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="border-none shadow-sm h-full py-3 md:py-6">
      <CardContent className="flex items-start justify-between gap-4 px-3 md:px-6 h-full">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm md:text-base font-semibold">{title}</CardTitle>
          <div className="text-2xl md:text-4xl font-bold pt-1">{value}</div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: item.fill }} 
                />
                <span className="text-[10px] md:text-xs font-medium">
                  {Math.round((item.value / total) * 100)}% {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-[120px] h-[120px] min-w-[120px] md:w-[140px] md:h-[140px] md:min-w-[140px] lg:w-[160px] lg:h-[160px] lg:min-w-[160px] flex-shrink-0 self-end">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="90%"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

