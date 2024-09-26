// Função para calcular a EMA
export function calculateEMA(data, period = 9) {
    let ema = [];
    let multiplier = 2 / (period + 1);
    let previousEMA = data[0];
    ema.push(previousEMA);

    for (let i = 1; i < data.length; i++) {
        let currentEMA = (data[i] - previousEMA) * multiplier + previousEMA;
        ema.push(currentEMA);
        previousEMA = currentEMA;
    }

    return ema;
}

// Função para calcular o ATR
export function calculateATR(highs, lows, closes, period) {
    let atr = [];
    let trueRanges = [];

    for (let i = 1; i < highs.length; i++) {
        let tr = Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]));
        trueRanges.push(tr);
    }

    let atrSum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
    atr.push(atrSum / period);

    for (let i = period; i < trueRanges.length; i++) {
        let currentATR = ((atr[i - period] * (period - 1)) + trueRanges[i]) / period;
        atr.push(currentATR);
    }

    return atr;
}

// Função para verificar condição de reversão com deslocamento de +10 em relação à EMA
function checkReversalCondition(closes, ema, index, volatilityCondition) {
    let currentEma = ema[index] + 10;
    let previousEma = ema[index - 1] + 10;
    let currentPrice = closes[index];
    let previousPrice = closes[index - 1];

    const crossover = currentPrice > currentEma && previousPrice < previousEma;
    const crossunder = currentPrice < currentEma && previousPrice > previousEma;
    return (crossover || crossunder) && volatilityCondition;
}


export function executeStrategy(candleData, operations, updateOperations, capital, setStopPrice, notify) {
    const emaLength = 9;
    const atrLength = 14;
    const atrMultiplier = 0.3;

    let highs = candleData.map(c => c.y[1]);
    let lows = candleData.map(c => c.y[2]);
    let closes = candleData.map(c => c.y[3]);
    let opens = candleData.map(c => c.y[0]);

    const lastCandleIndex = closes.length - 1;

    let ema = calculateEMA(closes, emaLength);
    let atr = calculateATR(highs, lows, closes, atrLength)[lastCandleIndex - atrLength];

    const volatilityCondition = (highs[lastCandleIndex] - lows[lastCandleIndex]) > (atr * atrMultiplier);
    const trailingStopInitial = atr * 0.5;

    // Calcular a fração de BTC que pode ser comprada com 90% do capital disponível
    const btcQty = capital * 0.9 / closes[lastCandleIndex];
    let stop = lows[lastCandleIndex - 1] - trailingStopInitial;

    let reversalCondition = checkReversalCondition(closes, ema, lastCandleIndex, volatilityCondition);

    // Compra na condição de reversão
    if (reversalCondition && operations.length === 0) {

        // Regras específicas para "Compra Reversão com Pavio" e "Compra Reversão"
        if (
            closes[lastCandleIndex] > ema[lastCandleIndex]
            && closes[lastCandleIndex - 1] > ema[lastCandleIndex - 1]
            && closes[lastCandleIndex] < opens[lastCandleIndex]
            && (opens[lastCandleIndex] - closes[lastCandleIndex]) < (closes[lastCandleIndex] - lows[lastCandleIndex])) {
            operations.push({
                buyTime: candleData[lastCandleIndex].x,
                buyPrice: closes[lastCandleIndex],
                qty: btcQty,
                capitalUsed: capital * 0.9,  // Utilizando 90% do capital
                type: "Compra Reversão com Pavio"
            });
            setStopPrice(0)
            updateOperations(operations);
            notify('Compra Reversão com Pavio executada', 'info');
            console.log("Compra Reversão com Pavio executada", "Qty:", btcQty, "Stop:", stop);
        } else if (
            closes[lastCandleIndex] >= ema[lastCandleIndex]
            && closes[lastCandleIndex - 1] <= ema[lastCandleIndex - 1]
            && closes[lastCandleIndex] > opens[lastCandleIndex]) {
            operations.push({
                buyTime: candleData[lastCandleIndex].x,
                buyPrice: closes[lastCandleIndex],
                qty: btcQty,
                capitalUsed: capital * 0.9,  // Utilizando 90% do capital
                type: "Compra Reversão"
            });
            setStopPrice(0)
            updateOperations(operations);
            notify('Compra Reversão executada', 'info');
            console.log("Compra Reversão executada", "Qty:", btcQty, "Stop:", stop);
        }
    }

    // Verificar se há uma operação aberta e realizar a venda
    if (operations.length > 0) {
        let lastOperation = operations[operations.length - 1];

        if (!lastOperation.sellPrice) {
            // Atualizar o stop móvel com base na busca por saídas mais altas
            const previousLow = lows[lastCandleIndex - 1];
            stop = previousLow - trailingStopInitial;
            setStopPrice(stop)
            // Verificar se o preço atual caiu abaixo do trailing stop
            if (closes[lastCandleIndex] <= stop) {
                // Executar venda
                lastOperation.sellTime = candleData[lastCandleIndex].x;
                lastOperation.sellPrice = closes[lastCandleIndex];
                lastOperation.profit = (closes[lastCandleIndex] - lastOperation.buyPrice) * lastOperation.qty;

                // Atualizar o capital com o lucro da operação
                capital += lastOperation.profit;

                operations[operations.length - 1] = lastOperation;
                updateOperations(operations);

                notify('Venda realizada', 'success');
                console.log("Venda realizada", "Lucro:", lastOperation.profit);
            }
        }
    }
}