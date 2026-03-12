import React, { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Customers Component
 * Displays a list of available clients/plants from the database.
 */
export default function Customers({ onSelectCustomer }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetching from the new 'customers' endpoint
        const res = await axios.get('http://localhost:3000/api/customers', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setList(res.data);
      } catch (err) {
        // Handle unauthorized access (token expired)
        if (err.response?.status === 401) {
          localStorage.clear();
          window.location.reload();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h2 style={{margin:0, color: '#202124'}}>Panel de Control</h2>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={styles.logoutBtn}>
          Cerrar Sesión
        </button>
      </header>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3 style={{margin: 0}}>Listado de Clientes</h3>
        </div>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nombre del Cliente</th>
              <th style={styles.th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {list.map((customer) => (
              <tr key={customer.id} style={styles.tr}>
                <td style={styles.td}>#{customer.id}</td>
                <td style={styles.td}><strong>{customer.name}</strong></td>
                <td style={styles.td}>
                  <button onClick={() => onSelectCustomer(customer.id)} style={styles.actionBtn}>
                    Ver Piezas
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  tableContainer: { backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableHeader: { padding: '20px', borderBottom: '1px solid #f1f3f4' },
  table: { width: '100%', borderCollapse: 'collapse' },
  theadRow: { backgroundColor: '#f1f3f4', textAlign: 'left' },
  th: { padding: '15px', color: '#5f6368', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '15px', borderBottom: '1px solid #f1f3f4' },
  actionBtn: { padding: '8px 16px', backgroundColor: '#e8f0fe', color: '#1a73e8', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' },
  logoutBtn: { backgroundColor: '#fce8e6', color: '#d93025', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
}