import React, { useState } from 'react'
import Login from './pages/login.jsx'
import Clientes from './pages/Clientes.jsx'
import Piezas from './pages/Piezas.jsx'
import GenerarCOC from './pages/GenerarCOC.jsx'
import Checklists from './pages/Checklists.jsx'


function App() {
  const [view, setView] = useState('login')
  const [clienteId, setClienteId] = useState(null)
  const [piezaSeleccionada, setPiezaSeleccionada] = useState(null)
  const token = localStorage.getItem('token')

  return (
    <div>
      {view === 'login' && (
        <Login onLoginSuccess={() => setView('clientes')} />
      )}
      {view === 'clientes' && (
        <Clientes 
        onSelectCliente={(id) => { setClienteId(id); setView('piezas') }}
        onVerChecklists={(id) => { setClienteId(id); setView('checklists') }}
        />
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
      {view === 'checklists' && (
        <Checklists
          clienteId={clienteId}
          token={token}
          onVolver={() => setView('clientes')}
        />
      )}
    </div>
  )
}

export default App