import { formatPercentage } from '@/lib/formatters';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';

interface PieChartProps {
    data: number[];
    labels: string[];
    colors?: string[];
    height?: number;
    type?: 'pie' | 'donut';
}

export default function ReusablePieChart({
    data,
    labels,
    colors = ['#465fff', '#34d399', '#fbbf24', '#f87171', '#a78bfa'],
    height = 300,
    type = 'donut',
}: PieChartProps) {
    const options: ApexOptions = {
        colors,
        chart: {
            fontFamily: 'Outfit, sans-serif',
            type,
            height,
        },
        labels,
        legend: {
            show: true,
            position: 'bottom',
            horizontalAlign: 'center',
            fontFamily: 'Outfit',
        },
        dataLabels: {
            enabled: true,
            formatter: function (val: number) {
                return formatPercentage(val, 1);
            },
        },
        plotOptions: {
            pie: {
                donut: {
                    size: type === 'donut' ? '70%' : undefined,
                },
            },
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val}`,
            },
        },
    };

    return (
        <div className="flex justify-center">
            <Chart
                options={options}
                series={data}
                type={type}
                height={height}
            />
        </div>
    );
}
