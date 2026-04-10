// frontend/src/components/Sidebar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, Shield, UserCircle, Settings, BarChart3, ChevronLeft, ChevronRight, Package, FileCheck, ClipboardList, AlertTriangle, Calendar, RotateCcw } from 'lucide-react';
import logoLibra from '../assets/libraLogo.png';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

const navItems = [
  { 
    label: "Dashboard", 
    path: "/", 
    icon: <LayoutDashboard size={18} />,
    subtitle: "Resumen y métricas"
  },
  { 
    label: "Certificate Of Conformance", 
    path: "/clientes", 
    icon: <Users size={18} />,
    subtitle: "Generador de Certificados"
  },
  { 
    label: "NCR", 
    path: "/ncr", 
    icon: <AlertTriangle size={18} />,
    subtitle: "No conformidades"
  },
  { 
    label: "ReWork", 
    path: "/rework", 
    icon: <RotateCcw size={18} />,
    subtitle: "Re-Trabajos"
  },
  { 
    label: "Audit", 
    path: "/auditoria", 
    icon: <Calendar size={18} />,
    subtitle: "Auditorías"
  },
  { 
    label: "Analytics", 
    path: "/analiticas", 
    icon: <BarChart3 size={18} />,
    subtitle: "Reportes y estadísticas"
  },
  { 
    label: "Traceability", 
    path: "/trazabilidad", 
    icon: <Shield size={18} />,
    subtitle: "Historial y seguimiento"
  },
  { 
    label: "Users", 
    path: "/usuarios", 
    icon: <UserCircle size={18} />,
    subtitle: "Gestión de usuarios"
  },
  {
    label: "Settings",
    path: "/configuracion",
    icon: <Settings size={18} />,
    subtitle: "Ajustes del sistema"
  },
];

export default function Sidebar({ onCollapseChange, isCollapsed: externalCollapsed }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleLogout } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(externalCollapsed || false);
  
  const userInitials = localStorage.getItem('initial') || 'JM';
  const userName = localStorage.getItem('name') || 'Usuario';
  const userRole = localStorage.getItem('role') || 'User';

  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const onLogout = () => {
    handleLogout();
    navigate('/login');
  };

  return (
    <>
      <div 
        className="h-screen fixed left-0 top-0 flex flex-col transition-all duration-300"
        style={{ 
          width: isCollapsed ? '80px' : '280px',
          background: 'linear-gradient(180deg, #1E3A5F 0%, #2D5F7E 50%, #1E4A5F 100%)',
          borderTopRightRadius: '32px',
          borderBottomRightRadius: '32px',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          zIndex: 50,
        }}
      >
        <style>
          {`
            div::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        
        {/* Logo Section */}
        <div className="px-6 pt-10 pb-8">
          <div className="flex flex-col items-center">
            <img 
              src={logoLibra} 
              alt="Libra Industries" 
              style={{
                height: isCollapsed ? '40px' : '96px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                marginBottom: isCollapsed ? '0' : '2px',
                transition: 'all 0.3s ease',
              }}
            />
            
            {!isCollapsed && (
              <>
                <div style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontWeight: 700, 
                  fontSize: '19px', 
                  color: 'white', 
                  textAlign: 'center',
                  marginBottom: '4px',
                }}>
                  USI Control
                </div>
                <div style={{ 
                  fontFamily: 'var(--font-body)', 
                  fontWeight: 500, 
                  fontSize: '12px', 
                  color: 'rgba(255,255,255,0.6)', 
                  textAlign: 'center',
                  letterSpacing: '0.3px',
                }}>
                  Unique Identification System
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-5">
          {navItems.map((item) => {
            // Verificar si la ruta es activa
            const isActive = 
              location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex items-center gap-3 mb-3 rounded-2xl transition-all duration-300 group"
                style={{
                  padding: isCollapsed ? '14px 0' : '14px 18px',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(96,165,250,0.9) 0%, rgba(59,130,246,0.85) 100%)'
                    : 'transparent',
                  color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                  backdropFilter: isActive ? 'blur(10px)' : 'none',
                  border: isActive ? '1px solid rgba(255,255,255,0.25)' : '1px solid transparent',
                  boxShadow: isActive ? '0 4px 16px rgba(59,130,246,0.3)' : 'none',
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{
                    opacity: isActive ? 1 : 0.7,
                  }}
                >
                  {item.icon}
                </div>
                {!isCollapsed && (
                  <div className="flex-1">
                    <div style={{ 
                      fontFamily: 'var(--font-body)',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '15px',
                      lineHeight: '1.2',
                      marginBottom: '2px',
                    }}>
                      {item.label}
                    </div>
                    {item.subtitle && (
                      <div style={{ 
                        fontFamily: 'var(--font-body)',
                        fontWeight: 400,
                        fontSize: '11px',
                        color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                        lineHeight: '1.2',
                      }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-5 mt-auto">
          {!isCollapsed ? (
            <>
              <div 
                className="rounded-2xl p-4 mb-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                      fontFamily: 'var(--font-body)', 
                      fontWeight: 600, 
                      fontSize: '14px', 
                      color: 'white',
                      boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
                    }}
                  >
                    {userInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ 
                      fontFamily: 'var(--font-body)', 
                      fontWeight: 600, 
                      fontSize: '14px', 
                      color: 'white',
                      lineHeight: '1.2',
                      marginBottom: '3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {userName}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.65)',
                        fontFamily: 'var(--font-body)',
                        fontSize: '11px',
                        fontWeight: 500,
                        lineHeight: '1.2',
                      }}
                    >
                      {userRole}
                    </div>
                  </div>
                </div>
              </div>
              <button
                className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                onClick={onLogout}
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ 
                  background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                  fontFamily: 'var(--font-body)', 
                  fontWeight: 600, 
                  fontSize: '14px', 
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                }}
                title={userName}
              >
                {userInitials}
              </div>
              <button
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto transition-all hover:shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
                title="Cerrar Sesión"
                onClick={onLogout}
              >
                <LogOut size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={toggleCollapse}
        style={{
          position: 'fixed',
          left: isCollapsed ? '68px' : '268px',
          top: '32px',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
          color: 'white',
          boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
          zIndex: 1000,
          cursor: 'pointer',
          border: '2px solid white',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </>
  );
}