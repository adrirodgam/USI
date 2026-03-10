import { useState, useEffect } from "react"
import { getChecklists } from "../api/checklists"

export default function Checklists({ clienteId, token, onVolver }) {
  const [checklists, setChecklists] = useState([])

  useEffect(() => {
    getChecklists(clienteId, token).then(data => setChecklists(data))
  }, [clienteId])

  const nombre = localStorage.getItem("nombre")
  const inicial = localStorage.getItem("iniciales")

  const abrirChecklist = (url) => {
    const urlFinal = `${url}?prefill_Operator+Name=${encodeURIComponent(nombre)}&prefill_Operator+Initials=${encodeURIComponent(inicial)}`
    window.open(urlFinal, '_blank')
  }

  return (
    <div>
      <h2>Checklists</h2>
      <button onClick={onVolver}>Volver</button>
      <table>
        <thead>
          <tr>
            <th>Part Number</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {checklists.map(checklist => (
            <tr key={checklist.id}>
              <td>{checklist.parte_no}</td>
              <td>
                <button onClick={() => abrirChecklist(checklist.checklist_url)}>
                  Abrir Checklist
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}