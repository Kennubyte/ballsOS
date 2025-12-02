import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis } from "recharts";



export default function ResourceCard() {
    const cpuData = [{ t: "00:00", value: 12 }];
    const ramData = [{ t: "00:00", value: 42 }];
    const storageData = [{ t: "00:00", value: 10 }];

    const makeConfig = (label: string, color: string) => ({ value: { label, color } } as ChartConfig);

    return (
        <Card className="py-0 p-3">
          <h1 className="text-2xl font-bold">Resources</h1>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* CPU */}
            <div>
              <div className="mb-2 text-sm font-medium">CPU Usage</div>
              <ChartContainer config={makeConfig("CPU Usage", "#60a5fa")} className="h-40 w-full">
                <AreaChart data={cpuData} margin={{ top: 6, right: 6, left: 0, bottom: 6 }}>
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="value" fill="var(--color-value)" stroke="var(--color-value)" strokeWidth={2} type="monotone" />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* RAM */}
            <div>
              <div className="mb-2 text-sm font-medium">RAM Usage</div>
              <ChartContainer config={makeConfig("RAM Usage", "#60a5fa")} className="h-40 w-full">
                <AreaChart data={ramData} margin={{ top: 6, right: 6, left: 0, bottom: 6 }}>
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="value" fill="var(--color-value)" stroke="var(--color-value)" strokeWidth={2} type="monotone" />
                </AreaChart>
              </ChartContainer>
            </div>

            {/* STORAGE */}
            <div>
              <div className="mb-2 text-sm font-medium">Storage Usage</div>
              <ChartContainer config={makeConfig("Storage Usage", "#60a5fa")} className="h-40 w-full">
                <AreaChart data={storageData} margin={{ top: 6, right: 6, left: 0, bottom: 6 }}>
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="value" fill="var(--color-value)" stroke="var(--color-value)" strokeWidth={2} type="monotone" />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        </Card>
    )
}