import React, { useState } from 'react'
import Login from './pages/login.jsx'
import Clientes from './pages/Clientes.jsx'
import Piezas from './pages/Piezas.jsx'
import GenerarCOC from './pages/GenerarCOC.jsx'

function App() {
  const [view, setView] = useState(localStorage.getItem('token') ? 'clientes' : 'login')
  const [clienteId, setClienteId] = useState(null)
  const [piezaSeleccionada, setPiezaSeleccionada] = useState(null)
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
        <Piezas 
          clienteId={clienteId} 
          token={token} 
          onGenerarCOC={(pieza) => { setPiezaSeleccionada(pieza); setView('generar') }}
        />
      )}
      {view === 'generar' && (
        <GenerarCOC 
          pieza={piezaSeleccionada} 
          token={token} 
          onVolver={() => setView('piezas')}
        />
      )}
    </div>
  )
}

export default App