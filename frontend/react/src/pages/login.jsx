import { useState } from "react"
import { login } from "../api/authRequests"

/**
 * Login Component
 * Handles user authentication and stores session data in localStorage.
 */
export default function Login({ onLoginSuccess }) {
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    
    // API call using refactored english naming convention
    const result = await login(employeeId, password)

    if (result) {
      // Store session metadata for global app access
      localStorage.setItem("token", result.session.access_token)
      localStorage.setItem("name", result.user.name)
      localStorage.setItem("role", result.user.role)
      localStorage.setItem("initial", result.user.initial)
      onLoginSuccess() 
    } else {
      // User-facing error message in Spanish
      setError("ID de empleado o contraseña incorrectos")
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={styles.title}>LIBRA INDUSTRIES</h2>
          <p style={styles.subtitle}>Sistema de Gestión de Calidad</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>ID de Empleado</label>
            <input 
              type="text" 
              value={employeeId} 
              onChange={(e) => setEmployeeId(e.target.value)} 
              style={styles.input}
              placeholder="Ej: 10452"
              required 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={styles.input}
              placeholder="••••••••"
              required 
            />
          </div>

          {error && <p style={styles.errorText}>{error}</p>}

          <button type="submit" style={styles.button}>Entrar</button>
        </form>
      </div>
    </div>
  )
}

// Styled components using JS objects for easy maintenance
const styles = {
  container: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5' },
  card: { padding: '40px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: '380px' },
  title: { color: '#1a73e8', margin: 0, fontWeight: 'bold', letterSpacing: '1px' },
  subtitle: { color: '#5f6368', fontSize: '14px', marginTop: '5px' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#3c4043' },
  input: { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #dadce0', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', backgroundColor: '#1a73e8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  errorText: { color: '#d93025', fontSize: '13px', textAlign: 'center', marginBottom: '10px', backgroundColor: '#fce8e6', padding: '8px', borderRadius: '4px' }
}