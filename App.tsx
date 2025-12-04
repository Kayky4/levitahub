import React from 'react';
import { HashRouter } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import AppRoutes from './router';
import AppLayout from './components/layout/AppLayout';

const AppContent: React.FC = () => {
  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <HashRouter>
            <AppContent />
          </HashRouter>
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;