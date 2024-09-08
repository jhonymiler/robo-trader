import 'bootstrap/dist/css/bootstrap.min.css';

import { CandleDataProvider } from '../components/CandleDataContext';
import Home from './index';

export default function App() {
    return (
        <CandleDataProvider>
            <Home />
        </CandleDataProvider>
    );
}
