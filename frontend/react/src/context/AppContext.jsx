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

      if (!userData) {
        console.warn('No user data returned from API, setting user with email only');
        setUser({ email });
        return;
      }

      // FIX: Build user explicitly — never let JWT email overwrite the real contact email
      setUser({
        // From JWT (only what we need from there)
        sub: decodedData.sub,
        exp: decodedData.exp,
        iat: decodedData.iat,
        // From public.users (these always win)
        employee_id: userData.employee_id,
        name: userData.name,
        initial: userData.initial,
        role: userData.role,
        active: userData.active,
        department: userData.department || null,
        signature_url: userData.signature_url || null,
        contactEmail: userData.email || null, // real contact email
      });
    } catch (err) {
      console.error('Error in decodeAndFetchUser:', err);
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