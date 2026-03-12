import { useState, useEffect } from "react"
import { getPieces } from "../api/pieces"

/**
 * Pieces Component
 * Shows a grid of parts related to a specific customer.
 */
export default function Pieces({ customerId, token, onGenerateCOC, onVerChecklists, onBack }) {
  const [pieces, setPieces] = useState([])
  const role = localStorage.getItem('role') 

  useEffect(() => {
    // Fetch pieces filtered by the selected customer ID
    getPieces(customerId, token).then(data => setPieces(data))
  }, [customerId])

  return (
    <div style={styles.page}>
      <button onClick={onBack} style={styles.backBtn}>← Regresar a Clientes</button>
      <h2 style={{margin: '25px 0', color: '#202124'}}>Piezas del Cliente</h2>

      <div style={styles.grid}>
        {pieces.map(piece => (
          <div key={piece.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.badge}>P/N</span>
              <h4 style={{margin: '10px 0'}}>{piece.part_number}</h4>
            </div>
            <div style={styles.cardBody}>
              <p style={styles.infoText}><strong>Dibujo:</strong> {piece.drawing_no}</p>
              <p style={styles.infoText}><strong>Revisión:</strong> {piece.revision}</p>
            </div>
            <div style={styles.cardFooter}>
              {role === 'inspector' && (
                <button onClick={() => onGenerateCOC(piece)} style={styles.primaryBtn}>Generar COC</button>
              )}
              {role === 'operador' && (
                <button onClick={() => onVerChecklists(piece.customer_id)} style={styles.secondaryBtn}>Ver Checklists</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' },
  card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e0e0e0' },
  cardHeader: { padding: '20px', backgroundColor: '#fdfdfd' },
  cardBody: { padding: '0 20px 20px 20px' },
  cardFooter: { padding: '15px', backgroundColor: '#fafafa', borderTop: '1px solid #f0f0f0', textAlign: 'center' },
  badge: { backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  infoText: { fontSize: '14px', color: '#5f6368', margin: '4px 0' },
  primaryBtn: { backgroundColor: '#34a853', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  secondaryBtn: { backgroundColor: '#8e24aa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  backBtn: { border: 'none', background: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }
}