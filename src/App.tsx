import type React from 'react';
import SeatArrangement from './components/searter';

const App: React.FC = () => {
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
};

export default App;
