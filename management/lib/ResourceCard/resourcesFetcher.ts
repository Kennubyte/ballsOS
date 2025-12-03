"use server";

import { getLogin } from "@/lib/loginManager";

export default async function getResourceUsage() {
    if (!await getLogin()) throw new Error('Not authenticated');

    const response = await fetch('http://127.0.0.1:55556/getRecentData')
    if (!response.ok) {
        throw new Error('Failed to fetch resource usage data');
    }
    
    let data = await response.json();

    interface CpuDataItem {
        Timestamp: string;
        Usage: number;
        ID: string;
    }

    interface RamDataItem {
        Timestamp: string;
        UsagePercentage: number;
        ID: string;
    }

    interface TransformedDataItem {
        t: string;
        value: number;
    }

    const cleanTimestamp = (uglyTimestamp: string): string => {
        const date = new Date(uglyTimestamp);
        return date.toLocaleString('en-UK', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    let CpuData: TransformedDataItem[] = (data.cpu as CpuDataItem[]).map((item: CpuDataItem): TransformedDataItem => ({
        t: cleanTimestamp(item.Timestamp),
        value: item.Usage
    }));

    let RamData: TransformedDataItem[] = (data.ram as RamDataItem[]).map((item: RamDataItem): TransformedDataItem => ({
        t: cleanTimestamp(item.Timestamp),
        value: item.UsagePercentage
    }));

    CpuData = CpuData.reverse();
    RamData = RamData.reverse();
    return { CpuData, RamData, data };
}