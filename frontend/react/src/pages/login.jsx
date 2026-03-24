import { useState } from "react"
import { User, Lock, Shield } from "lucide-react";
import { login } from "../api/authRequests"
import logoLibra from "../assets/libraLogo.png"

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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #334155 0%, #475569 100%)',
      }}
    >
      <div
        className="flex overflow-hidden"
        style={{
          width: '900px',
          height: '540px',
          borderRadius: '20px',
          boxShadow: '0 40px 100px rgba(0,0,0,0.25)',
        }}
      >
        {/* Left Panel - Blue */}
        <div
          className="relative flex flex-col justify-center px-14"
          style={{
            width: '480px',
            background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5F7E 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Large Decorative Circles */}
          <div
            className="absolute rounded-full"
            style={{
              width: '420px',
              height: '420px',
              border: '80px solid rgba(255,255,255,0.04)',
              bottom: '-210px',
              left: '-210px',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: '340px',
              height: '340px',
              border: '60px solid rgba(255,255,255,0.03)',
              top: '-170px',
              right: '-170px',
            }}
          />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Logo Libra Industries */}
            <div className="mb-8 flex justify-center">
              <img 
                src={logoLibra} 
                alt="Libra Industries" 
                style={{
                  height: '170px',
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                }}
              />
            </div>
            
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '16px',
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.6,
                marginBottom: '32px',
                textAlign: 'center',
              }}
            >
              La plataforma más confiable para la gestión de calidad en manufactura de precisión.
            </p>
            
            {/* Badge/Tag */}
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 8px rgba(16,185,129,0.5)',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                Sistema Activo
              </span>
            </div>
          </div>
        </div>

        {/* Right Panel - White Form */}
        <div className="flex-1 p-12 flex flex-col justify-center" style={{ backgroundColor: 'white' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '32px',
              color: '#0F172A',
              marginBottom: '4px',
              textAlign: 'center',
            }}
          >
            ¡Hola de nuevo!
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '15px',
              color: '#94A3B8',
              marginBottom: '36px',
              textAlign: 'center',
            }}
          >
            Bienvenido de vuelta
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <div className="relative">
                <User
                  width="18"
                  height="18"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#94A3B8' }}
                />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="ID de Empleado"
                  className="w-full h-14 pl-12 pr-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#2D5F7E]/30"
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '2px solid #E2E8F0',
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    color: '#0F172A',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock
                  width="18"
                  height="18"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#94A3B8' }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full h-14 pl-12 pr-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#2D5F7E]/30"
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '2px solid #E2E8F0',
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    color: '#0F172A',
                  }}
                  required
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  backgroundColor: '#FEE2E2',
                  border: '2px solid #FCA5A5',
                  borderRadius: '12px',
                  padding: '12px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: '#DC2626',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-14 rounded-xl transition-all hover:brightness-110 active:scale-[0.98] mt-6"
              style={{
                background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5F7E 100%)',
                color: 'white',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: '0 8px 24px rgba(45,95,126,0.3)',
              }}
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="text-center mt-6">
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: '#CBD5E1',
              }}
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}