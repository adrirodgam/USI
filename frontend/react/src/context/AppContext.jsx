import { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [customerId, setCustomerId] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);

  // Load token from storage on mount
  useEffect(() => {
    const savedToken = sessionStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      decodeToken(savedToken);
     }
  }, []);

  const handleLoginSuccess = (newToken) => {
    sessionStorage.setItem('token', newToken);
    setToken(newToken);
    decodeToken(newToken);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    setCustomerId(null);
    setSelectedPiece(null);
  };

  const decodeToken = (token) => {
    try {
      const payload = token.split('.')[1];
      const decodedData = JSON.parse(atob(payload));
      setUser(decodedData); 
       }catch (err) {
      console.error('Error decoding token:', err);
      setUser(null);
    }
  };

  return (
    <AppContext.Provider value={{
      token, setToken,
      user, setUser, 
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
