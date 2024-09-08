// pages/api/binance.js
import axios from 'axios';

export default async function handler(req, res) {
    const { symbol, interval } = req.query;

    try {
        const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
            params: {
                symbol: symbol,
                interval: interval,
                limit: 50
            }
        });

        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar dados da Binance' });
    }
}
