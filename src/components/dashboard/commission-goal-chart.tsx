'use client'

import { RadialBar, RadialBarChart, PolarGrid, PolarRadiusAxis, Label, PolarAngleAxis } from 'recharts'
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
            cx="50%"
            cy="50%"
            innerRadius="80%"
            outerRadius="100%"
            barSize={12}
            data={[{ value: percentage, fill: "#10b981" }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "rgba(255, 255, 255, 0.25)" }}
              dataKey="value"
              cornerRadius={10}
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

