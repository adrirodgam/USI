// frontend/react/src/pages/NCR.jsx

import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import { getNCRSheet, getNCRStatuses, updateNCRStatus } from '../api/ncr';
import {
  AlertTriangle, XCircle, Clock, CheckCircle,
  Download, Search, TrendingUp, TrendingDown, RefreshCw,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ─── Parsear Smartsheet → array de objetos planos ───────────────────────────
const parseNCRSheet = (sheet) => {
  if (!sheet || !sheet.columns || !sheet.rows) return [];

  const colMap = {};
  sheet.columns.forEach(col => { colMap[col.id] = col.title; });

  return sheet.rows.map(row => {
    const obj = { id: row.id };
    row.cells.forEach(cell => {
      const title = colMap[cell.columnId];
      if (title) obj[title] = cell.value ?? null;
    });
    // Ajusta los nombres de columna a los títulos exactos de tu sheet
    return {
      id:          row.id,
      miId:        obj['MI#']             || obj['NCR#']        || String(row.id),
      area:        obj['Area']            || obj['Área']        || '',
      partNumber:  obj['Part Number']     || obj['Part No']     || '',
      customer:    obj['Customer']        || obj['Cliente']     || '',
      description: obj['Description']    || obj['Descripción'] || '',
      category:    obj['Category']       || obj['Categoría']   || '',
      defectType:  obj['Defect Type']    || obj['Tipo de Defecto'] || '',
      reportedBy:  obj['Reported By']   || obj['Reportado por'] || '',
      reportedDate:obj['Date']           || obj['Fecha']        || null,
      dueDate:     obj['Due Date']       || obj['Fecha Límite'] || null,
    };
  });
};

// ─── Merge status de Supabase con datos de Smartsheet ───────────────────────
const mergeStatuses = (ncrs, statusMap) =>
  ncrs.map(ncr => ({
    ...ncr,
    status: statusMap[ncr.miId] || 'open',
  }));

// ─── Helpers de UI ───────────────────────────────────────────────────────────
const AREA_COLORS = {
  'Machining':   '#3B82F6',
  'Powdercoat':  '#8B5CF6',
  'Incoming':    '#EF4444',
  'Welding':     '#F59E0B',
  'Assembly':    '#10B981',
  'Sheet Metal': '#EC4899',
  'Rectificado': '#06B6D4',
  'Proveedor':   '#F97316',
};

const STATUS_CONFIG = {
  open:        { label: 'Abierta',     bg: '#FEE2E2', color: '#EF4444', border: '#FECACA', Icon: XCircle },
  in_progress: { label: 'En Revisión', bg: '#DBEAFE', color: '#3B82F6', border: '#BFDBFE', Icon: Clock },
  closed:      { label: 'Cerrada',     bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0', Icon: CheckCircle },
};

const getAreaColor  = (area) => AREA_COLORS[area] || '#94A3B8';
const getAreaData   = (data) => {
  const counts = {};
  data.forEach(n => { if (n.area) counts[n.area] = (counts[n.area] || 0) + 1; });
  return Object.entries(counts).map(([area, value]) => ({ name: area, value, color: getAreaColor(area) }));
};

// ─── Componente Principal ────────────────────────────────────────────────────
export default function NCR() {
  const [ncrData,      setNcrData]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedArea, setSelectedArea] = useState(null);
  const [updatingId,   setUpdatingId]   = useState(null);

  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [sheet, statusMap] = await Promise.all([getNCRSheet(), getNCRStatuses()]);
      const parsed = parseNCRSheet(sheet);
      setNcrData(mergeStatuses(parsed, statusMap));
    } catch (err) {
      console.error('Error fetching NCR data:', err);
      setError('Error al cargar los datos de NCR');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => { setRefreshing(true); fetchData(); };

  // ── Status Update (optimistic) ─────────────────────────────────────────────
  const handleStatusChange = async (miId, newStatus) => {
    setUpdatingId(miId);
    const previous = ncrData.find(n => n.miId === miId)?.status;
    // Optimistic update
    setNcrData(prev => prev.map(n => n.miId === miId ? { ...n, status: newStatus } : n));
    try {
      await updateNCRStatus(miId, newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
      // Rollback
      setNcrData(prev => prev.map(n => n.miId === miId ? { ...n, status: previous } : n));
      alert('Error al actualizar el estado. Intenta de nuevo.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = filteredData.map(n => ({
      'ID NCR':      n.miId,
      'Área':        n.area,
      'Part Number': n.partNumber,
      'Cliente':     n.customer,
      'Descripción': n.description,
      'Categoría':   n.category,
      'Estado':      STATUS_CONFIG[n.status]?.label || n.status,
      'Fecha Reporte': n.reportedDate || '',
      'Fecha Límite':  n.dueDate || '',
      'Reportado por': n.reportedBy || '',
    }));
    const csv = [
      Object.keys(rows[0]).join(','),
      ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href  = URL.createObjectURL(blob);
    link.download = `NCR_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const total       = ncrData.length;
  const open        = ncrData.filter(n => n.status === 'open').length;
  const in_progress = ncrData.filter(n => n.status === 'in_progress').length;
  const closed      = ncrData.filter(n => n.status === 'closed').length;

  const kpis = [
    { label: 'Total No Conformidades', value: total, trend: 'Registros totales',    icon: <AlertTriangle size={22}/>, gradient: 'linear-gradient(135deg,#EF4444,#DC2626)' },
    { label: 'Abiertas',               value: open,  trend: 'Requieren atención',   icon: <XCircle size={22}/>,       gradient: 'linear-gradient(135deg,#F97316,#EA580C)' },
    { label: 'En Revisión',            value: in_progress, trend: 'En proceso',     icon: <Clock size={22}/>,         gradient: 'linear-gradient(135deg,#F59E0B,#D97706)' },
    { label: 'Cerradas',               value: closed, trend: total > 0 ? `${Math.round((closed/total)*100)}% resueltas` : '0%', icon: <CheckCircle size={22}/>, gradient: 'linear-gradient(135deg,#10B981,#059669)' },
  ];

  // ── Filtros ────────────────────────────────────────────────────────────────
  const filteredData = ncrData.filter(n => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q ||
      n.miId.toLowerCase().includes(q) ||
      n.partNumber.toLowerCase().includes(q) ||
      n.customer.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'Todos' || n.status === filterStatus;
    const matchArea   = !selectedArea || n.area === selectedArea;
    return matchSearch && matchStatus && matchArea;
  });

  const areaData = getAreaData(ncrData);

  // ── Custom Tooltip ─────────────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:'rgba(255,255,255,0.98)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:12, padding:'10px 14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)' }}>
        <p style={{ fontWeight:600, color:'#0F172A', fontSize:13, marginBottom:4 }}>{payload[0].name}</p>
        <p style={{ fontWeight:700, color:payload[0].payload.color, fontSize:15 }}>{payload[0].value} NCR{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#FEE2E2 0%,#FEF3C7 25%,#E0E7FF 75%,#DBEAFE 100%)' }}>
        <TopBar title="No Conformidades" breadcrumb={currentDate} />
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
          <div style={{ textAlign:'center' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A5F] mx-auto" />
            <p style={{ marginTop:16, color:'#64748B', fontFamily:'var(--font-body)' }}>Cargando datos de NCR...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#FEE2E2 0%,#FEF3C7 25%,#E0E7FF 75%,#DBEAFE 100%)' }}>
      <TopBar title="No Conformidades" breadcrumb={currentDate}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          {selectedArea && (
            <button onClick={() => setSelectedArea(null)}
              style={{ height:36, padding:'0 16px', borderRadius:8, background:'linear-gradient(135deg,#64748B,#475569)', color:'white', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
              <XCircle size={14}/> Limpiar Filtro
            </button>
          )}
          <button onClick={handleRefresh} disabled={refreshing}
            style={{ height:36, padding:'0 14px', borderRadius:8, background:'white', color:'#1E3A5F', border:'1px solid #E2E8F0', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }}/> Actualizar
          </button>
          <button onClick={handleExport}
            style={{ height:36, padding:'0 16px', borderRadius:8, background:'linear-gradient(135deg,#1E3A5F,#2D5F7E)', color:'white', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <Download size={14}/> Exportar Reporte
          </button>
        </div>
      </TopBar>

      <div style={{ padding:'24px 32px' }}>

        {/* Error Banner */}
        {error && (
          <div style={{ marginBottom:24, padding:16, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, color:'#EF4444', fontFamily:'var(--font-body)' }}>
            {error} <button onClick={handleRefresh} style={{ marginLeft:12, textDecoration:'underline', background:'none', border:'none', color:'#EF4444', cursor:'pointer' }}>Reintentar</button>
          </div>
        )}

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:28 }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)', transition:'transform .2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:kpi.gradient, color:'white', boxShadow:'0 6px 20px rgba(0,0,0,0.15)' }}>{kpi.icon}</div>
                {i === 3 && <TrendingUp size={14} style={{ color:'#10B981' }}/>}
                {i < 3 && i > 0 && <TrendingDown size={14} style={{ color:'#EF4444' }}/>}
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:38, color:'#0F172A', letterSpacing:'-1px', lineHeight:1, marginBottom:8 }}>{kpi.value}</div>
              <div style={{ fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, color:'#64748B', marginBottom:4 }}>{kpi.label}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#94A3B8' }}>{kpi.trend}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>

          {/* Donut — Por Área */}
          <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
            <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'#0F172A', marginBottom:4 }}>Por Área</p>
            <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8', marginBottom:12 }}>
              {selectedArea ? `Filtrando: ${selectedArea}` : 'Haz clic en un área para filtrar'}
            </p>
            {areaData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={areaData} cx="50%" cy="50%" innerRadius={65} outerRadius={100} dataKey="value" strokeWidth={3} stroke="#fff"
                    onClick={d => d?.name && setSelectedArea(d.name === selectedArea ? null : d.name)}
                    style={{ cursor:'pointer' }}>
                    {areaData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} opacity={!selectedArea || selectedArea === entry.name ? 1 : 0.3}/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily:'var(--font-body)', fontSize:12 }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:200, color:'#94A3B8', fontFamily:'var(--font-body)' }}>Sin datos</div>
            )}
          </div>

          {/* Status breakdown */}
          <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
            <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'#0F172A', marginBottom:16 }}>Por Estado</p>
            {['open','in_progress','closed'].map(status => {
              const cfg = STATUS_CONFIG[status];
              const count = ncrData.filter(n => n.status === status).length;
              const pct = total > 0 ? Math.round((count/total)*100) : 0;
              return (
                <div key={status} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, color:cfg.color }}>{cfg.label}</span>
                    <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13, color:'#0F172A' }}>{count} <span style={{ color:'#94A3B8', fontWeight:400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height:8, borderRadius:99, background:'#F1F5F9', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:cfg.color, borderRadius:99, transition:'width .4s ease' }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)', overflow:'hidden' }}>

          {/* Table header */}
          <div style={{ padding:'20px 28px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div>
                <p style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'#0F172A' }}>Registros de No Conformidades</p>
                <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8', marginTop:2 }}>
                  {filteredData.length} de {ncrData.length} registros{selectedArea && ` · Área: ${selectedArea}`}
                </p>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'center' }}>
              <div style={{ flex:1, position:'relative' }}>
                <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}/>
                <input type="text" placeholder="Buscar por ID, pieza, cliente o descripción..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ width:'100%', height:40, paddingLeft:42, paddingRight:14, borderRadius:10, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:14, color:'#0F172A', outline:'none', boxSizing:'border-box' }}/>
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ height:40, padding:'0 14px', borderRadius:10, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:14, color:'#0F172A', cursor:'pointer' }}>
                <option value="Todos">Todos los estados</option>
                <option value="open">Abierta</option>
                <option value="in_progress">En Revisión</option>
                <option value="closed">Cerrada</option>
              </select>
              <button onClick={handleExport}
                style={{ height:40, padding:'0 16px', borderRadius:10, background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
                <Download size={14}/> Exportar CSV
              </button>
            </div>
          </div>

          {/* Table content */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
              <thead>
                <tr style={{ background:'#F8FAFC', borderBottom:'2px solid #E2E8F0' }}>
                  {['ID NCR','Área','Pieza / Cliente','Descripción','Categoría','Estado','Fecha','Acciones'].map(h => (
                    <th key={h} style={{ padding:'12px 20px', textAlign:'left', fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map(ncr => {
                  const cfg        = STATUS_CONFIG[ncr.status] || STATUS_CONFIG.open;
                  const StatusIcon = cfg.Icon;
                  const areaColor  = getAreaColor(ncr.area);
                  const isUpdating = updatingId === ncr.miId;

                  return (
                    <tr key={ncr.id} style={{ borderBottom:'1px solid rgba(0,0,0,0.05)', opacity: isUpdating ? 0.6 : 1, transition:'opacity .2s' }}>

                      {/* ID */}
                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13, color:'#1E293B' }}>{ncr.miId}</span>
                      </td>

                      {/* Área */}
                      <td style={{ padding:'16px 20px' }}>
                        {ncr.area ? (
                          <span style={{ padding:'4px 10px', borderRadius:8, background:`${areaColor}18`, color:areaColor, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, border:`1px solid ${areaColor}40` }}>{ncr.area}</span>
                        ) : <span style={{ color:'#94A3B8', fontSize:13 }}>—</span>}
                      </td>

                      {/* Pieza / Cliente */}
                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13, color:'#1E293B' }}>{ncr.partNumber || '—'}</div>
                        <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B', marginTop:2 }}>{ncr.customer || '—'}</div>
                      </td>

                      {/* Descripción */}
                      <td style={{ padding:'16px 20px', maxWidth:240 }}>
                        <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#475569' }}>{ncr.description || '—'}</span>
                      </td>

                      {/* Categoría */}
                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>{ncr.category || ncr.defectType || '—'}</span>
                      </td>

                      {/* Estado (badge) */}
                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:8, background:cfg.bg, color:cfg.color, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, border:`1px solid ${cfg.border}` }}>
                          <StatusIcon size={13}/>{cfg.label}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>{ncr.reportedDate || '—'}</div>
                        {ncr.dueDate && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#94A3B8', marginTop:2 }}>↳ {ncr.dueDate}</div>}
                      </td>

                      {/* Acciones */}
                      <td style={{ padding:'16px 20px' }}>
                        {ncr.status !== 'closed' ? (
                          <select value={ncr.status} disabled={isUpdating}
                            onChange={e => handleStatusChange(ncr.miId, e.target.value)}
                            style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:'#475569', cursor: isUpdating ? 'wait' : 'pointer' }}>
                            <option value="open">Abierta</option>
                            <option value="in_progress">En Revisión</option>
                            <option value="closed">Cerrada</option>
                          </select>
                        ) : (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'6px 10px', borderRadius:8, background:'#ECFDF5', color:'#10B981', fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, border:'1px solid #A7F3D0' }}>
                            <CheckCircle size={12}/> Cerrada
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && !loading && (
            <div style={{ padding:'48px 0', textAlign:'center', color:'#94A3B8', fontFamily:'var(--font-body)', fontSize:14 }}>
              No se encontraron registros con los filtros aplicados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
