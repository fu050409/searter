import { SeatArrangement } from './components/searter';

export function App() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    智能排座位系统
                </h1>
                <SeatArrangement />
            </div>
        </div>
    );
}

export default App;
