import { useState, useEffect } from "react"
import { generateCOC } from "../api/certificates"
import { getInspectors } from "../api/users"

/**
 * GenerateCOC Component
 * Form for certificate generation. 
 * Documentation in English. Preserves exact data keys for backend signature mapping.
 */
export default function GenerateCOC({ piece, token, onBack }) {
  const [po, setPo] = useState("")
  const [so, setSo] = useState("")
  const [wo, setWo] = useState("")
  const [quantity, setQuantity] = useState("")
  const [sn, setSn] = useState("") 
  const [comments, setComments] = useState("")
  const [inspectorSeleccionado, setInspectorSeleccionado] = useState("")
  
  const [generating, setGenerating] = useState(false)
  const [inspectors, setInspectors] = useState([])

  useEffect(() => {
    // Fetches inspector list using auth token
    getInspectors(token).then(data => setInspectors(data))
  }, [token])

  const handleAction = async () => {
    setGenerating(true)

    // PAYLOAD MAPPING: Keys must match certificates.js backend logic
    const payload = {
      customer_name: piece.customers.name,
      part_number: piece.part_number,
      drawing_no: piece.drawing_no,
      revision: piece.revision,
      packing_slip: "N/A",
      date_code: "N/A",
      serial_numbers: sn || "N/A",
      purchase_order: po,
      sales_order: so,
      work_order: wo,
      quantity: quantity,
      comments: comments || "N/A",
      // This 'inspector' key is used in backend to query 'signature_url'
      inspector: inspectorSeleccionado, 
      date: new Date().toLocaleDateString()
    }

    try {
      const blob = await generateCOC(payload, token)
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `COC_${piece.part_number}.docx`
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch (error) {
      console.error("Critical error generating certificate:", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.formCard}>
        <div style={styles.formHeader}>
          <h3 style={{margin: 0, color: '#1a73e8'}}>Generate Certificate (COC)</h3>
          <p style={styles.infoLabel}>
            <strong>P/N:</strong> {piece.part_number} | <strong>Rev:</strong> {piece.revision}
          </p>
        </div>

        <div style={styles.gridForm}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>P.O.</label>
            <input type="text" value={po} onChange={(e) => setPo(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>S.O.</label>
            <input type="text" value={so} onChange={(e) => setSo(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>W.O.</label>
            <input type="text" value={wo} onChange={(e) => setWo(e.target.value)} style={styles.input} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Quantity</label>
            <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={styles.input} />
          </div>
        </div>

        <div style={{marginTop: '15px'}}>
          <label style={styles.label}>Serial Numbers (S/N)</label>
          <input type="text" value={sn} onChange={(e) => setSn(e.target.value)} style={styles.input} placeholder="N/A" />
        </div>

        <div style={{marginTop: '15px'}}>
          <label style={styles.label}>Comments</label>
          <textarea value={comments} onChange={(e) => setComments(e.target.value)} style={{...styles.input, height: '60px'}} placeholder="N/A" />
        </div>

        <div style={{marginTop: '15px'}}>
          <label style={styles.label}>Responsible Inspector</label>
          <select 
            value={inspectorSeleccionado} 
            onChange={(e) => setInspectorSeleccionado(e.target.value)} 
            style={styles.input}
          >
            <option value="">Select an inspector...</option>
            {inspectors.map(i => (
              <option key={i.employee_id} value={i.name}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{display: 'flex', gap: '10px', marginTop: '25px'}}>
          <button onClick={onBack} style={styles.btnBack}>Go Back</button>
          <button 
            onClick={handleAction} 
            disabled={generating || !inspectorSeleccionado} 
            style={styles.btnSubmit}
          >
            {generating ? "Processing..." : "Download DOCX"}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  formCard: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '100%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  formHeader: { marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
  infoLabel: { color: '#5f6368', fontSize: '13px' },
  gridForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#3c4043', marginBottom: '4px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dadce0', boxSizing: 'border-box' },
  btnBack: { flex: 1, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#5f6368' },
  btnSubmit: { flex: 2, padding: '10px', borderRadius: '6px', border: 'none', backgroundColor: '#1a73e8', color: 'white', fontWeight: 'bold', cursor: 'pointer' }
}