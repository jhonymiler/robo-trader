import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useCandleData } from './CandleDataContext';

const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function Chart({ timeframe }) {
    const { candleData, emaData, operations = [] } = useCandleData();
    const [chartOptions, setChartOptions] = useState({
        series: [],
        chart: { height: 600, type: 'candlestick' },
        xaxis: { type: 'datetime' },
    });

    useEffect(() => {
        if (candleData.length > 0 && emaData.length > 0) {
            initializeChart();
        }
    }, [candleData, emaData, operations]);

    const initializeChart = () => {
        const annotations = operations.flatMap((op) => [
            {
                x: new Date(op.buyTime).getTime(),
                label: {
                    style: {
                        color: '#fff',
                        background: 'green'
                    },
                    text: 'Compra',
                }
            },
            op.sellPrice && {
                x: new Date(op.sellTime).getTime(),
                label: {
                    style: {
                        color: '#fff',
                        background: 'red'
                    },
                    text: 'Venda',
                }
            }
        ]).filter(Boolean);

        const options = {
            series: [{
                name: 'EMA 9',
                type: 'line',
                data: emaData
            }, {
                name: 'Candle',
                type: 'candlestick',
                data: candleData.map(candle => ({
                    x: candle.x.getTime(),
                    y: candle.y
                }))
            }],
            chart: {
                height: 600,
                type: 'candlestick',
                animations: {
                    enabled: false,
                },
            },
            xaxis: {
                type: 'datetime'
            },
            annotations: {
                xaxis: annotations
            },
           
        };

        setChartOptions((prevOptions) => {
            if (JSON.stringify(prevOptions) !== JSON.stringify(options)) {
                return options;
            }
            return prevOptions;
        });
    };

    return (
        <div id="chart" className="mb-4">
            <ApexCharts options={chartOptions} series={chartOptions.series} type="candlestick" height={600} />
        </div>
    );
}
