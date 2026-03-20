import { useState, useEffect } from "react"
import { getChecklists, registerOnSmartsheet } from "../api/checklists"
 
/**
 * Checklists Component
 * Lists checklists and registers operator identity on Smartsheet.
 */
export default function Checklists({ customerId, token, onBack }) {
  const [checklists, setChecklists] = useState([])
  const [loading, setLoading] = useState(null)
 
  useEffect(() => {
    getChecklists(customerId, token).then(data => setChecklists(data))
  }, [customerId])
 
  const openForm = (sheetUrl) => {
  const name = localStorage.getItem("name")
  const initial = localStorage.getItem("initial")
  const prefillUrl = `${sheetUrl}?Operador=${encodeURIComponent(name)}&Inicial=${encodeURIComponent(initial)}`
  window.open(prefillUrl, '_blank')
}
 
  return (
    <div style={styles.page}>
      <button onClick={onBack} style={styles.backBtn}>← Volver</button>
      <h2 style={{margin: '20px 0', color: '#202124'}}>Formatos de Inspección</h2>
      
      <div style={styles.list}>
        {checklists.map(item => (
          <div key={item.id} style={styles.listItem}>
            <div style={styles.itemInfo}>
              <div style={styles.iconBox}>📋</div>
              <div>
                <strong style={{display: 'block', fontSize: '16px'}}>{item.part_no}</strong>
                <span style={{fontSize: '12px', color: '#5f6368'}}>Formulario Externo</span>
              </div>
            </div>
            <button 
              onClick={() => openForm(item.checklist_url)} 
              disabled={loading === item.sheet_id}
              style={styles.openBtn}
            >
              {loading === item.sheet_id ? 'Registrando...' : 'Llenar Formato'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
 
const styles = {
  page: { padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  list: { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '800px' },
  listItem: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #f1f3f4' },
  itemInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  iconBox: { fontSize: '24px', backgroundColor: '#f1f3f4', padding: '10px', borderRadius: '8px' },
  openBtn: { backgroundColor: '#1a73e8', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' },
  backBtn: { border: 'none', background: 'none', color: '#1a73e8', cursor: 'pointer', fontWeight: 'bold' }
}
