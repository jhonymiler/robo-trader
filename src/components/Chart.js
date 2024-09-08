import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useCandleData } from './CandleDataContext';

const ApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function Chart({ timeframe }) {
    const { candleData, emaData, operations = [], stopPrice } = useCandleData();
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
                y: new Date(op.buyTime).getTime(),
                borderColor: '#00ff00',
                label: {
                    style: {
                        color: '#fff',
                        background: 'green'
                    },
                    text: op.buyPrice,
                }
            },
            op.sellPrice && {
                y: new Date(op.sellTime).getTime(),
                borderColor: '#ff0000',
                label: {
                    style: {
                        color: '#fff',
                        background: 'red'
                    },
                    text: op.sellPrice,
                }
            }
        ]).filter(Boolean);

        if (stopPrice) {
            annotations.push({
                y: stopPrice,  // Valor do preço de stop
                borderColor: '#ff0000',
                label: {
                    borderColor: '#ff0000',
                    style: {
                        color: '#fff',
                        background: '#ff0000'
                    },
                    text: 'Stop',
                }
            });
        }

        const options = {
            series: [{
                name: 'EMA 9',
                type: 'line',
                data: emaData
            }, {
                name: 'Candle',
                type: 'candlestick',
                data: candleData.map(candle => ({
                    x: new Date(candle.x).getTime(),
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
                xaxis: annotations,
                yaxis: annotations.filter(a => a.y) // Anotações de stop
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
