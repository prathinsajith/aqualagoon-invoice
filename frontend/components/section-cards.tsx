import { 
  IconTrendingDown, 
  IconTrendingUp,
  IconCurrencyDollar,
  IconUsers,
  IconActivity,
  IconChartBar
} from "@tabler/icons-react"

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-6 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card metronic-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>Total Revenue</CardDescription>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <IconCurrencyDollar className="size-5 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums text-foreground mt-2">
            $1,250.00
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
            <IconTrendingUp className="size-4" />
            <span>+12.5%</span>
          </div>
          <div className="text-xs text-muted-foreground font-medium">Last 6 months</div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card metronic-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>New Customers</CardDescription>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <IconUsers className="size-5 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums text-foreground mt-2">
            1,234
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-full">
            <IconTrendingDown className="size-4" />
            <span>-2.0%</span>
          </div>
          <div className="text-xs text-muted-foreground font-medium">Needs attention</div>
        </CardFooter>
      </Card>

      <Card className="@container/card metronic-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>Active Accounts</CardDescription>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <IconActivity className="size-5 text-emerald-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums text-foreground mt-2">
            45,678
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">
            <IconTrendingUp className="size-4" />
            <span>+12.5%</span>
          </div>
          <div className="text-xs text-muted-foreground font-medium">Exceeds targets</div>
        </CardFooter>
      </Card>

      <Card className="@container/card metronic-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription>Growth Rate</CardDescription>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <IconChartBar className="size-5 text-amber-600" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tabular-nums text-foreground mt-2">
            4.5%
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2.5 py-1 rounded-full">
            <IconTrendingUp className="size-4" />
            <span>+4.5%</span>
          </div>
          <div className="text-xs text-muted-foreground font-medium">Steady growth</div>
        </CardFooter>
      </Card>
    </div>
  )
}
