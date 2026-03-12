import React, { useState } from 'react'
import Login from './pages/Login.jsx'
import Customers from './pages/Customers.jsx'
import Pieces from './pages/Pieces.jsx'
import GenerateCOC from './pages/GenerateCOC.jsx'
import Checklists from './pages/Checklists.jsx'

/**
 * Main Application Controller.
 * Refactored to English logic and variable naming.
 * Security: Memory-only token to ensure a fresh login on every reload.
 */
function App() {
  const [view, setView] = useState('login')
  const [customerId, setCustomerId] = useState(null)
  const [selectedPiece, setSelectedPiece] = useState(null)
  
  // This state is the "Source of Truth" for your authentication
  const [token, setToken] = useState(null)

  /**
   * Updates auth state and navigates to the dashboard.
   * Triggered by Login.jsx
   */
  const handleLoginSuccess = () => {
    // We get the token from storage once to put it in memory
    const savedToken = localStorage.getItem('token')
    setToken(savedToken)
    setView('customers')
  }

  const handleLogout = () => {
    localStorage.clear()
    setToken(null)
    setView('login')
  }

  return (
    <div className="app-container">
      {/* LOGIN: The starting point */}
      {view === 'login' && (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
      
      {/* CUSTOMERS: Fixed the 403 by passing the token and function names */}
      {view === 'customers' && (
        <Customers 
          token={token} // Needed for the API call inside Customers.jsx
          onSelectCustomer={(id) => { 
            setCustomerId(id); 
            setView('pieces'); 
          }}
          onViewChecklists={(id) => { 
            setCustomerId(id); 
            setView('checklists'); 
          }}
        />
      )}

      {/* PIECES: Using customerId and token for the filtered list */}
      {view === 'pieces' && (
        <Pieces 
          customerId={customerId} 
          token={token} 
          onGenerateCOC={(piece) => { 
            setSelectedPiece(piece); 
            setView('generate'); 
          }}
          onVerChecklists={() => setView('checklists')} 
          onBack={() => setView('customers')}
        />
      )}

      {/* GENERATE COC */}
      {view === 'generate' && (
        <GenerateCOC 
          piece={selectedPiece} 
          token={token} 
          onBack={() => setView('pieces')}
        />
      )}

      {/* CHECKLISTS */}
      {view === 'checklists' && (
        <Checklists
          customerId={customerId}
          token={token}
          onBack={() => setView('pieces')}
        />
      )}
    </div>
  )
}

export default App