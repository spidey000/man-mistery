import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { Welcome } from './screens/Welcome';
import { Quest } from './screens/Quest';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SettingsProvider } from './contexts/SettingsContext';

export default function App() {
  const [isGuest, setIsGuest] = useState(false);

  return (
    <ErrorBoundary>
      <SettingsProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={isGuest ? <Navigate to="/quest" /> : <Welcome onGuest={() => setIsGuest(true)} />} />
            <Route path="/quest" element={isGuest ? <Quest onExit={() => setIsGuest(false)} /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
