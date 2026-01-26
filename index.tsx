import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './src/components/ui';
import { GameProvider } from './src/contexts/GameContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { QueryProvider } from './src/providers/QueryProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryProvider>
        <GameProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </GameProvider>
      </QueryProvider>
    </ErrorBoundary>
  </React.StrictMode>
);