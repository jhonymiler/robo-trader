import { createContext, useContext, useState } from 'react';

const CandleDataContext = createContext();

export function CandleDataProvider({ children }) {
    const [candleData, setCandleData] = useState([]);
    const [emaData, setEmaData] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [operations, setOperations] = useState([]);

    const value = {
        operations,
        setOperations,
        candleData,
        setCandleData,
        emaData,
        setEmaData,
        currentPrice,
        setCurrentPrice,
    };

    return (
        <CandleDataContext.Provider value={{operations, setOperations, candleData, setCandleData, emaData, setEmaData, currentPrice, setCurrentPrice }}>
            {children}
        </CandleDataContext.Provider>
    );
}

export function useCandleData() {
    return useContext(CandleDataContext);
}
