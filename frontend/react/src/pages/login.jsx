import { useState } from "react"
import { login } from "../api/authRequests"

// Recibimos onLoginSuccess como prop para avisarle a App.jsx que cambie de vista
export default function Login ({ onLoginSuccess }) { 
  const [idEmpleado, setIdEmpleado] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("") // Limpiamos errores previos antes de intentar

    const token = await login(idEmpleado, password)
    
    if (token) {
      localStorage.setItem("token", token)
      console.log("Token recibido y guardado:", token)
      
      // ¡ESTA LÍNEA HACE EL SALTO! 
      // Si onLoginSuccess existe, la ejecutamos para cambiar a la pantalla de clientes
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } else {
      setError("Credenciales incorrectas")
    }
  }

  return (
    <div>
      <h2>Iniciar Sesión - Libra Industries</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label>ID Empleado</label>
          <input
            type="text"
            value={idEmpleado}
            onChange={(e) => setIdEmpleado(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Iniciar Sesión</button>
      </form>
    </div>
  )
}