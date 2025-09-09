import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root') as HTMLDivElement;
createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
