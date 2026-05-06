import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopBar from '../components/TopBar';
import { useApp } from '../context/AppContext';
import {
  Users as UsersIcon,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Download,
  Search,
  Filter,
  Briefcase,
  AlertCircle,
  Mail,
  Edit,
  Trash2,
  X,
  TrendingUp
} from 'lucide-react';

// Helper to get role badge gradient
const getRoleBadgeColor = (role) => {
  const map = {
    developer: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    admin: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    gerente: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    supervisor: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
    inspector: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    operador: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
    ingeniero: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
  };
  return map[role] || 'linear-gradient(135deg, #64748B 0%, #475569 100%)';
};

// Helper for department color
const getDepartmentColor = (department) => {
  const map = {
    Calidad: '#10B981',
    Produccion: '#3B82F6',
    Ingenieria: '#F59E0B',
    Administracion: '#8B5CF6',
    Operaciones: '#EF4444',
  };
  return map[department] || '#64748B';
};

// 🔥 FIX: normalizar strings (acentos/espacios/case)
const normalize = (str) => (str || '').trim().toLowerCase();

export default function Users() {
  const { token, user } = useApp();
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [filterActive, setFilterActive] = useState('Todos');
  const [filterDepartment, setFilterDepartment] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({
    employee_id: '',
    name: '',
    initial: '',
    role: 'inspector',
    department: 'Calidad',
    active: true,
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Guard
  if (!user || !token) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-body)',
        color: '#94A3B8',
        background: 'linear-gradient(135deg, #E0F2FE 0%, #DBEAFE 25%, #EDE9FE 75%, #FAE8FF 100%)'
      }}>
        Cargando perfil...
      </div>
    );
  }

  // 🔁 FIX: redirect seguro
  useEffect(() => {
    if (!user?.role) return;
    if (!['developer', 'admin', 'gerente'].includes(user.role)) {
      navigate('/clientes', { replace: true });
    }
  }, [user, navigate]);

  const role = user?.role || '';
  const isAdmin = ['developer', 'admin'].includes(role);
  const isGerente = role === 'gerente';

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 🔥 FIX: separar email auth (falso) y derivar employee_id
      setUsers(res.data.map(u => {
        const authEmail = u.email || '';

        const derivedId = authEmail.includes('@libraind.com')
          ? authEmail.replace('@libraind.com', '')
          : (u.employee_id || '');

        return {
          employee_id: derivedId,
          name: u.name,
          initial: u.initial,
          role: u.role,
          department: u.department || 'Calidad',
          active: u.active,
          status: u.active ? 'Activo' : 'Inactivo',
          contactEmail: u.contact_email || null, // 👈 no usar el falso para UI
          authEmail,
        };
      }));
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); window.location.reload(); }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // KPIs
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const adminCount = users.filter(u => u.role === 'admin' || u.role === 'developer').length;
  const supervisorCount = users.filter(u => u.role === 'supervisor').length;

  // 🔥 FIX: evitar división por 0
  const activePercent = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(0) : '0';
  const inactivePercent = totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100).toFixed(0) : '0';

  const kpiCards = [
    { label: 'Total Usuarios', value: totalUsers.toString(), icon: <UsersIcon size={24} />, bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', trendValue: `${totalUsers} registrados`, trendPositive: null },
    { label: 'Activos', value: activeUsers.toString(), icon: <UserCheck size={24} />, bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', trendValue: `${activePercent}%`, trendPositive: true },
    { label: 'Inactivos', value: inactiveUsers.toString(), icon: <UserX size={24} />, bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', trendValue: `${inactivePercent}%`, trendPositive: false },
    { label: 'Admin / Superv.', value: `${adminCount}/${supervisorCount}`, icon: <Shield size={24} />, bgGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', trendValue: 'Admin + Super', trendPositive: null },
  ];

  // 🔍 FILTER FIX (normalize + id seguro)
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const search = searchTerm.toLowerCase();

      const nameMatch = (u.name || '').toLowerCase().includes(search);
      const idMatch = String(u.employee_id || '').toLowerCase().includes(search);
      const emailMatch = (u.contactEmail || '').toLowerCase().includes(search);

      const matchesSearch = nameMatch || idMatch || emailMatch;
      const matchesRole = filterRole === 'Todos' || u.role === filterRole;
      const matchesActive = filterActive === 'Todos' || u.status === filterActive;

      const matchesDept =
        filterDepartment === 'Todos' ||
        normalize(u.department) === normalize(filterDepartment);

      const matchesGerenteDept = isGerente
        ? normalize(u.department) === normalize(user.department)
        : true;

      return matchesSearch && matchesRole && matchesActive && matchesDept && matchesGerenteDept;
    });
  }, [users, searchTerm, filterRole, filterActive, filterDepartment, isGerente, user]);

  // Export CSV
  const handleExport = () => {
    const csv = [
      ['Employee ID', 'Nombre', 'Email', 'Rol', 'Departamento', 'Estado'],
      ...filteredUsers.map(u => [
        u.employee_id,
        u.name,
        u.contactEmail || '',
        u.role,
        u.department || '',
        u.status,
      ])
    ].map(r => r.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Modal handlers
  const openCreateModal = () => {
    setModalMode('create');
    setForm({
      employee_id: '',
      name: '',
      initial: '',
      role: 'inspector',
      department: 'Calidad',
      active: true,
      email: '',
    });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setForm({
      employee_id: user.employee_id,
      name: user.name,
      initial: user.initial || '',
      role: user.role,
      department: user.department || 'Calidad',
      active: user.active,
      email: user.contactEmail || '',
    });
    setError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.name || !form.initial || !form.role) {
      setError('Todos los campos marcados con * son obligatorios.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (modalMode === 'create') {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/users`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/users/${selectedUser.employee_id}`,
          {
            name: form.name,
            role: form.role,
            active: form.active,
            email: form.email,
            department: form.department
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      closeModal();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el usuario.');
    } finally {
      setSubmitting(false);
    }
  };

  // 🔄 FIX toggle (usar active como fuente de verdad)
  const handleToggleStatus = async (user) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/users/${user.employee_id}`,
        { active: !user.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u =>
        u.employee_id === user.employee_id
          ? { ...u, active: !u.active, status: !u.active ? 'Activo' : 'Inactivo' }
          : u
      ));
    } catch (err) {
      console.error(err);
    }
  };

  // Delete (soft)
  const handleDelete = async (user) => {
    if (!window.confirm('¿Desactivar este usuario? Ya no podrá acceder al sistema.')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/${user.employee_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(prev => prev.map(u =>
        u.employee_id === user.employee_id
          ? { ...u, status: 'Inactivo', active: false }
          : u
      ));
    } catch (err) {
      console.error(err);
    }
  };

  // Styles
  const labelStyle = {
    display: 'block', fontFamily: 'var(--font-body)', fontWeight: 700,
    fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase',
    letterSpacing: '0.5px', marginBottom: '6px',
  };
  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC',
    fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#0F172A',
    boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div>
      <TopBar title="Gestión de Usuarios" breadcrumb="Panel principal">
        <div style={{ display: 'flex', gap: '8px' }}>
          {isAdmin && (
            <button
              onClick={openCreateModal}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                height: '36px', padding: '0 16px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600,
                fontSize: '13px', border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16,185,129,0.25)'
              }}
            >
              <UserPlus size={16} /> Nuevo Usuario
            </button>
          )}
          <button
            onClick={handleExport}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '36px', padding: '0 16px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5F7E 100%)',
              color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600,
              fontSize: '13px', border: 'none', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(30,58,95,0.25)'
            }}
          >
            <Download size={16} /> Exportar
          </button>
        </div>
      </TopBar>

      <div className="p-7">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiCards.map((kpi, idx) => (
            <div key={idx} className="rounded-2xl p-5" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: kpi.bgGradient, color: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                  {kpi.icon}
                </div>
                {kpi.trendPositive !== null && (
                  <TrendingUp size={16} style={{ color: kpi.trendPositive ? '#10B981' : '#EF4444' }} />
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '24px', color: '#0F172A', marginBottom: '4px' }}>{kpi.value}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{kpi.label}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>{kpi.trendValue}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '36px' }}
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Filter size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '36px', cursor: 'pointer' }}
              >
                <option>Todos</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
                <option value="gerente">Gerente</option>
                <option value="supervisor">Supervisor</option>
                <option value="inspector">Inspector</option>
                <option value="operador">Operador</option>
                <option value="ingeniero">Ingeniero</option>
              </select>
            </div>
            {!isGerente && (
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '36px', cursor: 'pointer' }}
                >
                  <option>Todos</option>
                  <option value="Calidad">Calidad</option>
                  <option value="Produccion">Producción</option>
                  <option value="Ingenieria">Ingeniería</option>
                  <option value="Administracion">Administración</option>
                  <option value="Operaciones">Operaciones</option>
                </select>
              </div>
            )}
            <div style={{ position: 'relative' }}>
              <AlertCircle size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                style={{ ...inputStyle, paddingLeft: '36px', cursor: 'pointer' }}
              >
                <option>Todos</option>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '12px', fontFamily: 'var(--font-body)', fontSize: '12px', color: '#64748B' }}>
            Mostrando {filteredUsers.length} de {totalUsers} usuarios
            {isGerente && <span style={{ marginLeft: '8px', color: '#3B82F6' }}>— Vista de gerente: {user.department}</span>}
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5F7E 100%)' }}>
                  {['Employee ID', 'Usuario', 'Email', 'Rol', 'Departamento', 'Estado', 'Acciones'].map(col => (
                    <th key={col} className="text-left px-6 py-3" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12" style={{ fontFamily: 'var(--font-body)', color: '#94A3B8' }}>
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12" style={{ fontFamily: 'var(--font-body)', color: '#94A3B8' }}>
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.employee_id} className="border-b hover:bg-[#F8FAFF] transition-colors" style={{ borderColor: '#F8FAFC' }}>
                      <td className="px-6 py-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#1E3A5F', fontWeight: 600 }}>
                        {u.employee_id}
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>{u.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-body)', fontSize: '11px', color: '#64748B' }}>
                          <Mail size={12} /> {u.contactEmail || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="px-2 py-1 rounded-lg"
                          style={{
                            background: getRoleBadgeColor(u.role),
                            color: 'white',
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            display: 'inline-block',
                          }}
                        >
                          {u.role}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getDepartmentColor(u.department || '') }} />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#64748B' }}>{u.department || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={!isAdmin}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '16px',
                            border: 'none',
                            cursor: isAdmin ? 'pointer' : 'not-allowed',
                            fontFamily: 'var(--font-body)',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: u.status === 'Activo' ? '#ECFDF5' : '#FEF2F2',
                            color: u.status === 'Activo' ? '#10B981' : '#EF4444',
                          }}
                        >
                          {u.status}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {isAdmin && (
                            <button
                              onClick={() => openEditModal(u)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                background: '#EFF6FF',
                                color: '#2563EB',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Edit size={14} />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(u)}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                background: '#FEF2F2',
                                color: '#EF4444',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal (sin cambios de diseño) */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={closeModal} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg rounded-2xl p-6 bg-white shadow-2xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: '#0F172A' }}>
                  {modalMode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}
                </h2>
                <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                  <X size={20} />
                </button>
              </div>
              {error && (
                <div className="p-3 mb-4 rounded-lg" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', fontFamily: 'var(--font-body)', fontSize: '12px', color: '#EF4444' }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Employee ID *</label>
                  <input
                    type="text"
                    value={form.employee_id}
                    onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
                    disabled={modalMode === 'edit'}
                    style={{ ...inputStyle, opacity: modalMode === 'edit' ? 0.6 : 1 }}
                    placeholder="Ej: 112417"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Nombre Completo *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Ej: Roberto Gradillas" />
                </div>
                <div>
                  <label style={labelStyle}>Iniciales *</label>
                  <input type="text" value={form.initial} onChange={(e) => setForm({ ...form, initial: e.target.value })} style={inputStyle} placeholder="Ej: RG" maxLength={3} />
                </div>
                <div>
                  <label style={labelStyle}>Correo de contacto (opcional)</label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={inputStyle}
                    placeholder="ej: maria.garcia@libraind.com"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Rol *</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                    <option value="developer">Developer</option>
                    <option value="admin">Admin</option>
                    <option value="gerente">Gerente</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="inspector">Inspector</option>
                    <option value="operador">Operador</option>
                    <option value="ingeniero">Ingeniero</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Departamento</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} style={inputStyle}>
                    <option>Calidad</option>
                    <option>Produccion</option>
                    <option>Ingenieria</option>
                    <option>Administracion</option>
                    <option>Operaciones</option>
                  </select>
                </div>
                {modalMode === 'edit' && (
                  <div>
                    <label style={labelStyle}>Estado</label>
                    <select value={form.active ? 'Activo' : 'Inactivo'} onChange={(e) => setForm({ ...form, active: e.target.value === 'Activo' })} style={inputStyle}>
                      <option>Activo</option>
                      <option>Inactivo</option>
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                  <button type="button" onClick={closeModal}
                    style={{ padding: '10px 24px', borderRadius: '10px', border: '1.5px solid #E2E8F0', background: 'white', color: '#64748B', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitting}
                    style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                    {submitting ? 'Guardando...' : modalMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}