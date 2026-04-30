import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import TopBar from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { Plus, RefreshCw, Search } from 'lucide-react';

const resolveStatusStyle = (status) => {
  if (!status) return { bg: '#F3F4F6', color: '#6B7280', dot: '#6B7280', label: 'Activo' };
  const s = status.toLowerCase();
  if (s === 'active'   || s === 'activo')   return {
    bg: '#ECFDF5',
    color: '#10B981',
    dot: '#10B981',
    label: 'Activo',
    // Green glow for active status
    dotStyle: { boxShadow: '0 0 8px #10B981, 0 0 12px #10B981' }
  };
  if (s === 'inactive' || s === 'inactivo') return { bg: '#F3F4F6', color: '#6B7280', dot: '#6B7280', label: 'Inactivo' };
  if (s === 'pending'  || s === 'pendiente')return { bg: '#FFFBEB', color: '#F59E0B', dot: '#F59E0B', label: 'Pendiente' };
  return { bg: '#ECFDF5', color: '#10B981', dot: '#10B981', label: status };
};

export default function Clientes() {
  const [list, setList]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState(''); // Priority 2.1: search term
  const { token } = useApp();
  const navigate  = useNavigate();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setList(res.data);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.clear(); window.location.reload(); }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  // Priority 2.1: filter clients by name or code
  const filteredList = useMemo(() => {
    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        (c.code || String(c.id).substring(0, 3).toUpperCase()).toLowerCase().includes(term)
    );
  }, [list, search]);

  return (
    <div>
      <TopBar title="Clientes" breadcrumb="Panel principal">
        <button
          onClick={fetchCustomers}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
        >
          <RefreshCw size={16} style={{ color: '#64748B' }} />
        </button>
        <button
          className="flex items-center gap-2 h-9 px-4 rounded-lg transition-all hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: '#06B6D4', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', boxShadow: '0 2px 8px rgba(6,182,212,0.25)', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </TopBar>

      <div className="p-7">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>

          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#F8FAFC' }}>
            <div className="flex items-center gap-3">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: '#0F172A', margin: 0 }}>
                Listado de clientes
              </h3>
              <div className="px-2 py-1 rounded-full" style={{ backgroundColor: '#F1F5F9', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
                {filteredList.length}
              </div>
            </div>

            {/* Priority 2.1: search input */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
              <Search size={14} style={{ color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Buscar cliente o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'var(--font-body)',
                  fontSize: '13px',
                  color: '#0F172A',
                  width: '220px',
                }}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ fontFamily: 'var(--font-body)', color: '#94A3B8' }}>
              Cargando clientes...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    {['#', 'Código', 'Cliente', 'Estado', 'Acción'].map((col) => (
                      <th key={col} className="text-left px-6 py-3" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((customer, index) => {
                    const status = resolveStatusStyle(customer.status);
                    const code   = customer.code || String(customer.id).substring(0, 3).toUpperCase();
                    return (
                      <tr key={customer.id} className="border-b transition-colors hover:bg-[#F8FAFF]" style={{ borderColor: '#F8FAFC' }}>
                        <td className="px-6 py-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#94A3B8' }}>
                          {String(index + 1).padStart(2, '0')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-block px-2 py-1 rounded" style={{ backgroundColor: '#ECFDF9', fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 700, color: '#0E7490' }}>
                            {code}
                          </div>
                        </td>
                        <td className="px-6 py-4" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                          {customer.name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot, ...(status.dotStyle || {}) }} />
                            <span className="px-2 py-1 rounded-full" style={{ backgroundColor: status.bg, fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, color: status.color }}>
                              {status.label}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigate(`/piezas/${customer.id}`)}
                            className="inline-block px-3 py-1.5 rounded-lg border transition-all hover:bg-[#06B6D4]/5"
                            style={{ borderColor: '#06B6D4', color: '#06B6D4', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, background: 'transparent', cursor: 'pointer' }}
                          >
                            Ver Piezas
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredList.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="text-center py-12" style={{ fontFamily: 'var(--font-body)', color: '#94A3B8' }}>
                        No se encontraron clientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}