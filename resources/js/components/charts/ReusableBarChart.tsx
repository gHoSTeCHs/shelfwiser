import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface BarChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
    horizontal?: boolean;
    title?: string;
}

export default function ReusableBarChart({
    data,
    labels,
    color = '#465fff',
    height = 250,
    horizontal = false,
    title,
}: BarChartProps) {
    const options: ApexOptions = {
        colors: [color],
        chart: {
            fontFamily: 'Outfit, sans-serif',
            type: 'bar',
            height,
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            bar: {
                horizontal,
                columnWidth: horizontal ? '70%' : '39%',
                borderRadius: 5,
                borderRadiusApplication: 'end',
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 4,
            colors: ['transparent'],
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
        fill: {
            opacity: 1,
        },
        tooltip: {
            x: {
                show: false,
            },
            y: {
                formatter: (val: number) => `${val}`,
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
        <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-full">
                <Chart
                    options={options}
                    series={series}
                    type="bar"
                    height={height}
                />
            </div>
        </div>
    );
}
