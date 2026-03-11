import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Clientes({ onSelectCliente, onVerChecklists }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const rol = localStorage.getItem('rol');

  useEffect(() => {
    const obtenerClientes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/api/clientes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLista(res.data);
        setCargando(false);
      } catch (err) {
        if (err.response.status === 401) {
          localStorage.clear();
          window.location.reload();
        }
        console.error("Error al traer clientes", err);
        setCargando(false);
      }
    };
    obtenerClientes();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Panel de Administración: Clientes</h2>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload(); }}
          style={{ padding: '8px 15px', cursor: 'pointer', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Cerrar Sesión
        </button>
      </div>

      <hr />

      {cargando ? (
        <p>Cargando datos de la planta...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
              <th style={tableHeaderStyle}>ID</th>
              <th style={tableHeaderStyle}>Nombre del Cliente</th>
              <th style={tableHeaderStyle}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tableIdStyle}>{c.id}</td>
                <td style={tableCellStyle}>{c.nombre}</td>
                <td style={tableCellStyle}>
                  <button 
                    onClick={() => onSelectCliente(c.id)}
                    style={{ marginRight: '5px' }}
                  >
                    Ver piezas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const tableHeaderStyle = { padding: '12px', borderBottom: '2px solid #ddd' };
const tableCellStyle = { padding: '12px' };
const tableIdStyle = { padding: '12px', fontWeight: 'bold', color: '#666' };