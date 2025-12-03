import { Card, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import getResourceUsage from "@/lib/ResourceCard/resourcesFetcher";
import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis } from "recharts";
import { Label } from "@/components/ui/label"




export default function ResourceCard() {
    const [cpuData, setCpuData] = useState([{ t: "", value: 0 }]);
    const [ramData, setRamData] = useState([{ t: "", value: 0 }]);

    const [totalMemory, setTotalMemory] = useState(0);
    const [usedMemory, setUsedMemory] = useState(0);

    useEffect(() => {
      const fetchData = async () => {
        const data = await getResourceUsage();
        setCpuData(data.CpuData);
        setRamData(data.RamData);

        setTotalMemory(data.data.ram[data.data.ram.length - 1].TotalMemory);
        setUsedMemory(data.data.ram[data.data.ram.length - 1].UsedMemory);
      };

      fetchData();

      const interval = setInterval(() => {
        fetchData();
      }, 4000);

      return () => clearInterval(interval); // Clean up on unmount
    }, []);


    const makeConfig = (label: string, color: string) => ({ value: { label, color } } as ChartConfig);
    return (
        <Card className="py-0 p-3">
          <CardTitle className="text-2xl font-bold">Resource Usage Overview</CardTitle>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* CPU */}
            <div>
              <div className="mb-2 text-sm font-medium">CPU Usage (%)</div>
              <Label>{Math.round(cpuData[cpuData.length - 1]?.value)} %</Label>
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
              <div className="mb-2 text-sm font-medium">RAM Usage (%)</div>
              <Label>{usedMemory} / {totalMemory} MB</Label>
              <ChartContainer config={makeConfig("RAM Usage", "#60a5fa")} className="h-40 w-full">
                <AreaChart data={ramData} margin={{ top: 6, right: 6, left: 0, bottom: 6 }}>
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} tickLine={true} axisLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="value" fill="var(--color-value)" stroke="var(--color-value)" strokeWidth={2} type="monotone" />
                </AreaChart>
              </ChartContainer>
            </div>
          </div>
        </Card>
    )
}