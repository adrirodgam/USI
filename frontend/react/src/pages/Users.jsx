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

// 🔥 normalize helper
const normalize = (str) => (str || '').trim().toLowerCase();

export default function Users() {
  const { token, user } = useApp();
  const navigate = useNavigate();

  // 🔧 FIX: esperar a que user esté listo
  const [userReady, setUserReady] = useState(false);

  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Todos');
  const [filterActive, setFilterActive] = useState('Todos');
  const [filterDepartment, setFilterDepartment] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
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

  // 🔧 detectar cuando user está listo
  useEffect(() => {
    if (user && user.role) {
      setUserReady(true);
    }
  }, [user]);

  // 🔧 redirect seguro
  useEffect(() => {
    if (!userReady) return;

    const role = (user?.role || '').toLowerCase();

    if (!['developer', 'admin', 'gerente'].includes(role)) {
      navigate('/clientes', { replace: true });
    }
  }, [userReady, user, navigate]);

  // 🔧 guard correcto
  if (!userReady || !token) {
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

  // 🔧 role seguro
  const safeRole = (user?.role || '').toLowerCase();
  const isAdmin = ['developer', 'admin'].includes(safeRole);
  const isGerente = safeRole === 'gerente';

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
          contactEmail: u.contact_email || null,
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

  const activePercent = totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(0) : '0';
  const inactivePercent = totalUsers > 0 ? ((inactiveUsers / totalUsers) * 100).toFixed(0) : '0';

  const kpiCards = [
    { label: 'Total Usuarios', value: totalUsers.toString(), icon: <UsersIcon size={24} />, bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', trendValue: `${totalUsers} registrados`, trendPositive: null },
    { label: 'Activos', value: activeUsers.toString(), icon: <UserCheck size={24} />, bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', trendValue: `${activePercent}%`, trendPositive: true },
    { label: 'Inactivos', value: inactiveUsers.toString(), icon: <UserX size={24} />, bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)', trendValue: `${inactivePercent}%`, trendPositive: false },
  ];

  // Filter
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        (u.name || '').toLowerCase().includes(search) ||
        String(u.employee_id || '').toLowerCase().includes(search) ||
        (u.contactEmail || '').toLowerCase().includes(search);

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

  // Toggle status
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

  // DELETE etc... (tu código igual, sin cambios)

  return (
    <div>
      <TopBar title="Gestión de Usuarios" breadcrumb="Panel principal" />
      {/* TODO tu UI intacta aquí (tabla, filtros, modal, etc.) */}
    </div>
  );
}