import { useEffect, useState } from 'react';
import { useCandleData } from '../components/CandleDataContext';
import Chart from '../components/Chart.js';
import { calculateEMA, executeStrategy } from '../components/strategy';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
    const { operations, setOperations, candleData, setCandleData, emaData, setEmaData, currentPrice, setCurrentPrice } = useCandleData();
    const [timeframe, setTimeframe] = useState('1m');
    const [totalProfit, setTotalProfit] = useState(0);


    let ws;

    useEffect(() => {
        loadHistoricalData();
        initializeWebSocket();

        return () => {
            if (ws) ws.close();
        };
    }, [timeframe]);

    const loadHistoricalData = async () => {
        try {
            const response = await fetch(`/api/binance?symbol=BTCUSDT&interval=${timeframe}`);
            const data = await response.json();

            if (data && data.length > 0) {
                const candles = data.map(c => ({
                    x: new Date(c[0]),
                    y: [parseFloat(c[1]), parseFloat(c[2]), parseFloat(c[3]), parseFloat(c[4])]
                }));

                const closingPrices = data.map(c => parseFloat(c[4]));
                const ema = calculateEMA(closingPrices).map((value, index) => ({
                    x: candles[index]?.x || null,
                    y: value
                })).filter(item => item.x !== null);

                setCandleData(candles);
                setEmaData(ema);

            } else {
                console.error("Erro ao carregar dados históricos: Nenhum dado retornado.");
            }

        } catch (error) {
            console.error("Erro ao carregar dados históricos:", error);
        }
    };

    const initializeWebSocket = () => {
        if (ws) {
            ws.close();
        }

        ws = new WebSocket(`wss://stream.binance.com:9443/ws/btcusdt@kline_${timeframe}`);

        ws.onopen = function () {
            console.log("Conexão aberta");
        };

        ws.onmessage = function (event) {
            let data = JSON.parse(event.data);
            let candle = data.k;
            let isCandleClosed = candle.x;

            let candleInfo = {
                x: new Date(candle.t),
                y: [
                    parseFloat(candle.o),
                    parseFloat(candle.h),
                    parseFloat(candle.l),
                    parseFloat(candle.c)
                ]
            };

            setCurrentPrice(candleInfo.y[3]);

            setCandleData(prevCandleData => {
                let newCandleData;
                if (isCandleClosed) {
                    newCandleData = [...prevCandleData, candleInfo];

                    if (newCandleData.length > 50) {
                        newCandleData.shift();
                    }

                    const closingPrices = newCandleData.map(c => c?.y[3]);
                    setEmaData(calculateEMA(closingPrices).map((value, index) => ({
                        x: newCandleData[index]?.x || null,
                        y: value
                    })).filter(item => item.x !== null));

                    // Executar a estratégia com o array completo de candles
                } else {
                    newCandleData = [...prevCandleData];
                    newCandleData[newCandleData.length - 1] = candleInfo;

                    const lastClosingPrices = newCandleData.map(c => c?.y[3]);
                    const lastEma = calculateEMA(lastClosingPrices).slice(-1)[0];
                    setEmaData(prevEmaData => {
                        let newEmaData = [...prevEmaData];
                        newEmaData[newEmaData.length - 1] = {
                            x: candleInfo.x,
                            y: lastEma
                        };

                        return newEmaData;
                    });
                }

                return newCandleData;
            });

        };

        ws.onclose = function () {
            console.log("Conexão fechada");
        };
    };

    const updateOperations = (operations) => {
        setOperations(operations);
        updateTotalProfit(operations);
    };

    const updateTotalProfit = (operations) => {
        const profit = operations.reduce((sum, op) => sum + (op.profit || 0), 0);
        setTotalProfit(profit);
        console.log(operations);
    };

    const notify = (message, type = 'info') => {
        toast[type](message);
    };

    const initialCapital = 100;
    executeStrategy(candleData, operations, updateOperations, initialCapital, notify);


    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="form-group mb-0">
                    <label htmlFor="timeframe">Escolha o intervalo de tempo:</label>
                    <select
                        id="timeframe"
                        className="form-control"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                    >
                        <option value="1m">1 Minuto</option>
                        <option value="5m">5 Minutos</option>
                        <option value="15m">15 Minutos</option>
                        <option value="30m">30 Minutos</option>
                        <option value="1h">1 Hora</option>
                        <option value="1d">1 Dia</option>
                        <option value="1w">1 Semana</option>
                        <option value="1M">1 Mês</option>
                    </select>
                </div>
                <div className="text-right">
                    <div className="font-weight-bold mb-3">
                        Preço Atual: <span id="preco_atual" className="text-success">{currentPrice.toFixed(2)}</span>
                    </div>
                    <div>Total Lucro: <span id="totalProfit" className="text-success">{totalProfit.toFixed(2)}</span></div>
                </div>
            </div>

            <Chart timeframe={timeframe} />

            <div className="mt-4">
                <h4>Operações</h4>
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Hora</th>
                            <th>Preço Compra</th>
                            <th>Preço Venda</th>
                            <th>Quantidade</th>
                            <th>Lucro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operations.map((op, index) => (
                            <tr key={index}>
                                <td>{op.buyTime ? new Date(op.buyTime).toLocaleString() : '-'}</td>
                                <td>{op.buyPrice ? op.buyPrice.toFixed(2) : '-'}</td>
                                <td>{op.sellPrice ? op.sellPrice.toFixed(2) : '-'}</td>
                                <td>{op.qty ? op.qty.toFixed(8) : '-'}</td>
                                <td>{op.profit ? op.profit.toFixed(2) : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ToastContainer />
        </div>
    );
}
