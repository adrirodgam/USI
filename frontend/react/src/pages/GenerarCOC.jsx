import { useState, useEffect } from "react"
import { generarCOC } from "../api/certificados"
import { getInspectores } from "../api/usuarios"

export default function GenerarCOC({ pieza, token, onVolver }) {
  const [sn, setSn] = useState("")
  const [po, setPo] = useState("")
  const [so, setSo] = useState("")
  const [wo, setWo] = useState("")
  const [quantity, setQuantity] = useState("")
  const [comments, setComments] = useState("")
  const [generando, setGenerando] = useState(false)
  const [inspectores, setInspectores] = useState([])
  const [inspectorSeleccionado, setInspectorSeleccionado] = useState("")

  useEffect(() => {
    getInspectores(token).then(data => setInspectores(data))
  }, [])

  const handleGenerar = async () => {
    setGenerando(true)
    const data = {
      customer_name: pieza.clientes.nombre,
      part_number: pieza.part_number,
      drawing_no: pieza.drawing_no,
      revision: pieza.revision,
      packing_slip: "N/A",
      date_code: "N/A",
      serial_numbers: sn || "N/A",
      purchase_order: po,
      sales_order: so,
      work_order: wo,
      quantity: quantity,
      comments: comments || "N/A",
      inspector: inspectorSeleccionado,
      date: new Date().toLocaleDateString()
    }

    const blob = await generarCOC(data, token)
    if (blob) {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${pieza.part_number}_CoC.docx`
      link.click()
    }
    setGenerando(false)
  }

  return (
    <div style={{ padding: '40px' }}>
      <button onClick={onVolver}>← Volver</button>
      <h2>Generar COC — {pieza.part_number}</h2>
      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
          <h3>Datos de la pieza</h3>
          <p><b>Part Number:</b> {pieza.part_number}</p>
          <p><b>Drawing:</b> {pieza.drawing_no}</p>
          <p><b>Revision:</b> {pieza.revision}</p>
        </div>
        <div style={{ flex: 1 }}>
          <h3>Campos manuales</h3>
          <label>Purchase Order</label>
          <input value={po} onChange={e => setPo(e.target.value)} style={{ display: 'block', marginBottom: '10px', width: '100%' }} />
          <label>Sales Order</label>
          <input value={so} onChange={e => setSo(e.target.value)} style={{ display: 'block', marginBottom: '10px', width: '100%' }} />
          <label>Work Order</label>
          <input value={wo} onChange={e => setWo(e.target.value)} style={{ display: 'block', marginBottom: '10px', width: '100%' }} />
          <label>Quantity</label>
          <input value={quantity} onChange={e => setQuantity(e.target.value)} style={{ display: 'block', marginBottom: '10px', width: '100%' }} />
          <label>Serial Number</label>
          <input value={sn} onChange={e => setSn(e.target.value)} style={{ display: 'block', marginBottom: '10px', width: '100%' }} />
          <label>Comments</label>
          <input value={comments} onChange={e => setComments(e.target.value)} style={{ display: 'block', marginBottom: '10px', width: '100%' }} />
          <label>Inspector</label>
          <select
            value={inspectorSeleccionado}
            onChange={e => setInspectorSeleccionado(e.target.value)}
            style={{ display: 'block', marginBottom: '10px', width: '100%' }}
          >
            <option value="">Selecciona un inspector</option>
            {inspectores.map(i => (
              <option key={i.id_empleado} value={i.nombre}>{i.nombre}</option>
            ))}
          </select>
          <button onClick={handleGenerar} disabled={generando} style={{ marginTop: '20px', padding: '10px 20px' }}>
            {generando ? "Generando..." : "Generar COC"}
          </button>
        </div>
      </div>
    </div>
  )
}