import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
      decodeAndFetchUser(savedToken);
    }
  }, []);

  const handleLoginSuccess = (newToken) => {
    sessionStorage.setItem('token', newToken);
    setToken(newToken);
    decodeAndFetchUser(newToken);
  };

  const handleLogout = () => {
    sessionStorage.clear();
    setToken(null);
    setUser(null);
    setCustomerId(null);
    setSelectedPiece(null);
  };

  // Decode JWT and fetch full user profile from the backend
  const decodeAndFetchUser = async (authToken) => {
    try {
      const payload = authToken.split('.')[1];
      const decodedData = JSON.parse(atob(payload));
      const email = decodedData.email;
      if (!email) {
        throw new Error('JWT does not contain email');
      }

      // Fetch user record from public.users using the email-derived employee_id
      const { data: userData } = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users?email=${encodeURIComponent(email)}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      // Fallback if API returned empty or unexpected
      if (!userData) {
        console.warn('No user data returned from API, setting user with email only');
        setUser({ email });
        return;
      }

      // Merge JWT payload with DB record (name, employee_id, signature_url)
      setUser({
        ...decodedData,
        ...userData
      });
    } catch (err) {
      console.error('Error in decodeAndFetchUser:', err);
      // Try to salvage email from token so UI doesn't break
      try {
        const fallbackPayload = JSON.parse(atob(authToken.split('.')[1]));
        setUser({ email: fallbackPayload.email || null });
      } catch {
        setUser(null);
      }
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