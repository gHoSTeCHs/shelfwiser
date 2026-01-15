import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';

interface LineChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
    title?: string;
    curved?: boolean;
}

export default function ReusableLineChart({
    data,
    labels,
    color = '#465fff',
    height = 250,
    title,
    curved = true,
}: LineChartProps) {
    const options: ApexOptions = {
        colors: [color],
        chart: {
            fontFamily: 'Outfit, sans-serif',
            type: 'line',
            height,
            toolbar: {
                show: false,
            },
            zoom: {
                enabled: false,
            },
        },
        stroke: {
            curve: curved ? 'smooth' : 'straight',
            width: 3,
        },
        dataLabels: {
            enabled: false,
        },
        xaxis: {
            categories: labels,
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
        legend: {
            show: !!title,
            position: 'top',
            horizontalAlign: 'left',
            fontFamily: 'Outfit',
        },
        yaxis: {
            title: {
                text: undefined,
            },
        },
        grid: {
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
        tooltip: {
            x: {
                show: true,
            },
            y: {
                formatter: (val: number) => `${val}`,
            },
        },
        markers: {
            size: 4,
            colors: [color],
            strokeColors: '#fff',
            strokeWidth: 2,
            hover: {
                size: 6,
            },
        },
    };

    const series = [
        {
            name: title || 'Value',
            data,
        },
    ];

    return (
        <div className="custom-scrollbar max-w-full overflow-x-auto">
            <div className="min-w-full">
                <Chart
                    options={options}
                    series={series}
                    type="line"
                    height={height}
                />
            </div>
        </div>
    );
}
