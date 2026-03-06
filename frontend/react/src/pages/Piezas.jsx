import { useState, useEffect } from "react"
import { getPiezas } from "../api/piezas"

export default function Piezas({ clienteId, token, onGenerarCOC }) {
  const [piezas, setPiezas] = useState([])

  useEffect(() => {
    getPiezas(clienteId, token).then(data => setPiezas(data))
  }, [clienteId])

  return (
    <div>
      <h2>Piezas</h2>
      <table>
        <thead>
          <tr>
            <th>Part Number</th>
            <th>Drawing</th>
            <th>Revision</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {piezas.map(pieza => (
            <tr key={pieza.id}>
              <td>{pieza.part_number}</td>
              <td>{pieza.drawing_no}</td>
              <td>{pieza.revision}</td>
              <td><button onClick={() => onGenerarCOC(pieza)}>Generar COC</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}