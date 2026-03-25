import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);

  // Load token from storage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) setToken(savedToken);
  }, []);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setCustomerId(null);
    setSelectedPiece(null);
  };

  return (
    <AppContext.Provider value={{
      token, setToken,
      customerId, setCustomerId,
      selectedPiece, setSelectedPiece,
      handleLoginSuccess,
      handleLogout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
