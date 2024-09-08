import { createContext, useContext, useState, useEffect } from 'react';

const CandleDataContext = createContext();

export function CandleDataProvider({ children }) {
    const [candleData, setCandleData] = useState([]);
    const [emaData, setEmaData] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [operations, setOperations] = useState([]);
    const [stopPrice, setStopPrice] = useState(0);


    const value = {
        operations,
        setOperations,
        candleData,
        setCandleData,
        emaData,
        setEmaData,
        currentPrice,
        setCurrentPrice,
        stopPrice,
        setStopPrice
    };

    return (
        <CandleDataContext.Provider value={value}>
            {children}
        </CandleDataContext.Provider>
    );
}

export function useCandleData() {
    return useContext(CandleDataContext);
}
