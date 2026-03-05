import React, { useState } from 'react'
import Login from './pages/login.jsx'
import Clientes from './pages/Clientes.jsx'
import Piezas from './pages/Piezas.jsx'

function App() {
  const [view, setView] = useState(localStorage.getItem('token') ? 'clientes' : 'login')
  const [clienteId, setClienteId] = useState(null)
  const token = localStorage.getItem('token')

  return (
    <div>
      {view === 'login' && (
        <Login onLoginSuccess={() => setView('clientes')} />
      )}
      {view === 'clientes' && (
        <Clientes onSelectCliente={(id) => { setClienteId(id); setView('piezas') }} />
      )}
      {view === 'piezas' && (
        <Piezas clienteId={clienteId} token={token} />
      )}
    </div>
  )
}

export default App