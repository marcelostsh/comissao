'use client'

import { RadialBar, RadialBarChart, PolarGrid, PolarRadiusAxis, Label } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
} from '@/components/ui/chart'

const chartData = [
  { name: "meta", value: 7920, fill: "#10b981" }, // R$ 7.920 de comissão
]

const chartConfig = {
  value: {
    label: "Comissão Atual",
  },
} satisfies ChartConfig

export function CommissionGoalChart() {
  const goal = 10000 // Meta de R$ 10.000
  const current = 7920
  const percentage = Math.round((current / goal) * 100)

  return (
    <Card className="border-none shadow-sm h-full flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle className="text-base font-semibold">Atingimento de Meta</CardTitle>
        <CardDescription>Meta: R$ 10.000,00</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center p-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[220px]">
          <RadialBarChart
            data={[{ value: percentage, fill: "var(--color-meta)" }]}
            startAngle={90}
            endAngle={90 + (360 * percentage) / 100}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted/20 last:fill-muted/5"
              polarRadius={[86, 74]}
            />
            <RadialBar 
              dataKey="value" 
              background={{ fill: "rgba(255, 255, 255, 0.08)" }} 
              cornerRadius={10} 
              fill="#10b981" 
            />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {percentage}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-xs"
                        >
                          concluído
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

