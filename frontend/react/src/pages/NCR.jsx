// frontend/react/src/pages/NCR.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import TopBar from '../components/TopBar';
import { getNCRSheet, getNCRStatuses, updateNCRStatus } from '../api/ncr'; 
import {
  AlertTriangle, TrendingDown, TrendingUp, XCircle, Clock, CheckCircle,
  Download, Search, FileText, Calendar, User, ExternalLink, RefreshCw
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';

// =====================================================
// Column titles EXACTLY as they appear in Smartsheet
// =====================================================
const COLUMN_TITLES = {
  MI_NUMBER:    "MI#",
  DATE:         "Date Register",
  PART_NUMBER:  "Part Number",
  DEFECT:       "DEFECTO",
  DEFECT_TYPE:  "Type Of Defect",
  AREA_FOUND:   "Process (AREA DONDE SE ENCONTRO)",
  AREA_ORIGIN:  "AREA DONDE SE ORIGINO EL DEFECTO",
  QTY_REJ_INSP: "Qty Rej(INSPECTOR)",
  QTY_REJ_PROD: "Qty Rej(PRODUCCION)",
  INITIATOR:    "Iniciador",
  SUPPLIER:     "Proveedor",
  WO_NUMBER:    "WO#"
};

// ✅ Severity derived locally — no extra API call needed
const DEFAULT_SEVERITY_MAP = {
  'DIMENSIONAL':       'CRITICA',
  'COSMETICO':         'MENOR',
  'MANO DE OBRA':      'MAYOR',
  'SET UP INGENIERIA': 'MAYOR',
  'PROCESO':           'MAYOR',
  'MATERIAL':          'CRITICA',
};

const getSeverityFromDefect = (defectType) =>
  DEFAULT_SEVERITY_MAP[defectType?.toUpperCase()] || 'MAYOR';

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

const getAreaColor = (area) => AREA_COLORS[area] || '#94A3B8';

const SEVERITY_COLORS = {
  'CRITICA': '#DC2626',
  'MAYOR':   '#F97316',
  'MENOR':   '#FBBF24',
};

const STATUS_CONFIG = {
  open:        { label: 'Abierta',    color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  in_progress: { label: 'En Proceso', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  closed:      { label: 'Cerrada',    color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
};

// =====================================================
// Parse Smartsheet data (no severityMap param needed)
// =====================================================
const parseNCRSheet = (sheet, statusMap) => {
  if (!sheet || !sheet.columns || !sheet.rows) return [];

  const colIds = {};
  for (const [key, title] of Object.entries(COLUMN_TITLES)) {
    const found = sheet.columns.find(col => col.title === title);
    if (found) colIds[key] = found.id;
  }

  const parsed = [];
  for (const row of sheet.rows) {
    const cellMap = {};
    if (row.cells) {
      row.cells.forEach(cell => {
        cellMap[cell.columnId] = cell.value ?? cell.displayValue ?? '';
      });
    }

    const miNumber = cellMap[colIds.MI_NUMBER] || '';
    if (!miNumber) continue;

    const defectType = cellMap[colIds.DEFECT_TYPE] || '';

    parsed.push({
      id:           row.id,
      miId:         miNumber,
      area:         cellMap[colIds.AREA_FOUND]    || 'N/A',
      partNumber:   cellMap[colIds.PART_NUMBER]   || 'N/A',
      customer:     cellMap[colIds.SUPPLIER]      || 'N/A',
      description:  cellMap[colIds.DEFECT]        || '',
      defectType:   defectType,
      severity:     getSeverityFromDefect(defectType),
      status:       statusMap[miNumber]           || 'open',
      reportedBy:   cellMap[colIds.INITIATOR]     || '',
      reportedDate: cellMap[colIds.DATE]          || '',
      woNumber:     cellMap[colIds.WO_NUMBER]     || '',
      qtyRejInsp:   cellMap[colIds.QTY_REJ_INSP]  || 0,
    });
  }

  return parsed;
};

// =====================================================
// Main Component
// =====================================================
export default function NCR() {
  const [ncrData,        setNcrData]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [error,          setError]          = useState(null);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('Todas');
  const [filterSeverity, setFilterSeverity] = useState('Todas');
  const [selectedArea,   setSelectedArea]   = useState(null);
  const [updatingId,     setUpdatingId]     = useState(null);

  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      // ✅ Only 2 calls — getSeverityMapping eliminated
      const [sheet, statuses] = await Promise.all([getNCRSheet(), getNCRStatuses()]);
      setNcrData(parseNCRSheet(sheet, statuses));
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
    setNcrData(prev => prev.map(n => n.miId === miId ? { ...n, status: newStatus } : n));
    try {
      await updateNCRStatus(miId, newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
      setNcrData(prev => prev.map(n => n.miId === miId ? { ...n, status: previous } : n));
      alert('Error al actualizar el estado. Intenta de nuevo.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const areaChartData = useMemo(() => {
    const counts = {};
    ncrData.forEach(n => { if (n.area) counts[n.area] = (counts[n.area] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value, color: getAreaColor(name) }));
  }, [ncrData]);

  const severityChartData = useMemo(() => {
    const counts = { CRITICA: 0, MAYOR: 0, MENOR: 0 };
    ncrData.forEach(n => {
      if (counts[n.severity] !== undefined) counts[n.severity]++;
      else counts.MAYOR++;
    });
    const total = ncrData.length || 1;
    return [
      { name: 'Crítica', value: Math.round((counts.CRITICA / total) * 100), color: SEVERITY_COLORS.CRITICA },
      { name: 'Mayor',   value: Math.round((counts.MAYOR   / total) * 100), color: SEVERITY_COLORS.MAYOR   },
      { name: 'Menor',   value: Math.round((counts.MENOR   / total) * 100), color: SEVERITY_COLORS.MENOR   },
    ];
  }, [ncrData]);

  const trendData = useMemo(() => {
    const weeks = {};
    const today = new Date();
    ncrData.forEach(n => {
      if (!n.reportedDate) return;
      const date = new Date(n.reportedDate);
      if (isNaN(date)) return;
      const weekDiff = Math.floor((today - date) / (7 * 24 * 60 * 60 * 1000));
      if (weekDiff >= 0 && weekDiff < 8) {
        const key = `Sem ${8 - weekDiff}`;
        weeks[key] = (weeks[key] || 0) + 1;
      }
    });
    return Array.from({ length: 8 }, (_, i) => {
      const key = `Sem ${i + 1}`;
      return { week: key, count: weeks[key] || 0 };
    });
  }, [ncrData]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const total           = ncrData.length;
  const openCount       = ncrData.filter(n => n.status === 'open').length;
  const inProgressCount = ncrData.filter(n => n.status === 'in_progress').length;
  const closedCount     = ncrData.filter(n => n.status === 'closed').length;

  const kpis = [
    { label: 'Total No Conformidades', value: total,           trend: `${total} registros`,          trendPositive: false, icon: <AlertTriangle size={22}/>, bgGradient: 'linear-gradient(135deg,#EF4444,#DC2626)' },
    { label: 'Abiertas',               value: openCount,       trend: `${openCount} activas`,        trendPositive: false, icon: <XCircle size={22}/>,       bgGradient: 'linear-gradient(135deg,#F97316,#EA580C)' },
    { label: 'En Revisión',            value: inProgressCount, trend: `${inProgressCount} en proceso`, trendPositive: null, icon: <Clock size={22}/>,        bgGradient: 'linear-gradient(135deg,#F59E0B,#D97706)' },
    { label: 'Cerradas',               value: closedCount,     trend: total > 0 ? `${Math.round((closedCount/total)*100)}% resueltas` : '0%', trendPositive: true, icon: <CheckCircle size={22}/>, bgGradient: 'linear-gradient(135deg,#10B981,#059669)' },
  ];

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredData = ncrData.filter(n => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !q ||
      n.miId.toLowerCase().includes(q) ||
      n.partNumber.toLowerCase().includes(q) ||
      n.customer.toLowerCase().includes(q) ||
      n.description.toLowerCase().includes(q);
    const matchStatus =
      filterStatus === 'Todas' ||
      (filterStatus === 'Abierta'    && n.status === 'open') ||
      (filterStatus === 'En Proceso' && n.status === 'in_progress') ||
      (filterStatus === 'Cerrada'    && n.status === 'closed');
    const matchSeverity = filterSeverity === 'Todas' || n.severity === filterSeverity;
    const matchArea     = !selectedArea || n.area === selectedArea;
    return matchSearch && matchStatus && matchSeverity && matchArea;
  });

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (filteredData.length === 0) return;
    const rows = filteredData.map(n => ({
      'MI#': n.miId, 'Área': n.area, 'Pieza': n.partNumber, 'Cliente': n.customer,
      'Descripción': n.description, 'Tipo Defecto': n.defectType, 'Severidad': n.severity,
      'Estado': STATUS_CONFIG[n.status]?.label || n.status,
      'Fecha Reporte': n.reportedDate, 'Reportado por': n.reportedBy, 'WO#': n.woNumber,
    }));
    const csv = [
      Object.keys(rows[0]).join(','),
      ...rows.map(r => Object.values(r).map(v => `"${v || ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `NCR_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ── Tooltips ───────────────────────────────────────────────────────────────
  const tooltipStyle = {
    background: 'rgba(255,255,255,0.98)', border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={tooltipStyle}>
        <p style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'#0F172A', marginBottom:4 }}>{payload[0].name}</p>
        <p style={{ fontFamily:'var(--font-body)', fontSize:15, fontWeight:700, color:payload[0].payload.color }}>{payload[0].value} NCR{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  };

  // ✅ Bug #3 fixed: defined as component, used as <SeverityTooltip /> in JSX
  const SeverityTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={tooltipStyle}>
        <p style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'#0F172A', marginBottom:4 }}>{payload[0].name}</p>
        <p style={{ fontFamily:'var(--font-body)', fontSize:15, fontWeight:700, color:payload[0].payload.color }}>{payload[0].value}%</p>
      </div>
    );
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#FEF2F2 0%,#FEE2E2 25%,#FEFCE8 75%,#F0FDFA 100%)' }}>
        <TopBar title="No Conformidades" breadcrumb={currentDate}/>
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh' }}>
          <div style={{ textAlign:'center' }}>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A5F] mx-auto"/>
            <p style={{ marginTop:16, color:'#64748B', fontFamily:'var(--font-body)' }}>Cargando No Conformidades...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#FEF2F2 0%,#FEE2E2 25%,#FEFCE8 75%,#F0FDFA 100%)' }}>
      <TopBar title="No Conformidades" breadcrumb={currentDate}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button
            onClick={() => {
              const url = import.meta.env.VITE_SMARTSHEET_NCR_FORM_URL;
              // ✅ Bug #4 fix: guard against undefined env var
              if (url) window.open(url, '_blank');
              else alert('Configura VITE_SMARTSHEET_NCR_FORM_URL en tu .env');
            }}
            style={{ height:36, padding:'0 16px', borderRadius:8, background:'linear-gradient(135deg,#3B82F6,#2563EB)', color:'white', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <ExternalLink size={14}/> Registrar NCR
          </button>
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
          <div style={{ marginBottom:24, padding:16, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, color:'#EF4444', fontFamily:'var(--font-body)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span>{error}</span>
            <button onClick={handleRefresh} style={{ padding:'6px 12px', background:'#EF4444', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }}>Reintentar</button>
          </div>
        )}

        {/* KPI Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:28 }}>
          {kpis.map((kpi, i) => (
            <div key={i}
              style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)', transition:'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:kpi.bgGradient, color:'white', boxShadow:'0 6px 20px rgba(0,0,0,0.15)' }}>{kpi.icon}</div>
                {kpi.trendPositive !== null && (
                  <div style={{ color: kpi.trendPositive ? '#10B981' : '#EF4444' }}>
                    {kpi.trendPositive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
                  </div>
                )}
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:36, color:'#0F172A', letterSpacing:'-1px', lineHeight:1, marginBottom:8 }}>{kpi.value}</div>
              <div style={{ fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, color:'#64748B', marginBottom:4 }}>{kpi.label}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#94A3B8' }}>{kpi.trend}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:28 }}>

          {/* Chart 1: Por Área */}
          <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              {/* ✅ Bug #1 fixed: FileText instead of non-existent PieChartIcon */}
              <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#3B82F6,#2563EB)', color:'white' }}>
                <FileText size={18}/>
              </div>
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'#0F172A' }}>Por Área</h3>
                <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8' }}>{selectedArea ? `Filtrando: ${selectedArea}` : 'Haz clic en un área para filtrar'}</p>
              </div>
            </div>
            {areaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={areaChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={2} stroke="#fff"
                    onClick={d => d?.name && setSelectedArea(d.name === selectedArea ? null : d.name)}
                    style={{ cursor:'pointer' }}>
                    {areaChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color}
                        opacity={!selectedArea || selectedArea === entry.name ? 1 : 0.3}
                        style={{ filter: selectedArea === entry.name ? 'brightness(1.1)' : 'none' }}/>
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily:'var(--font-body)', fontSize:12 }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:280, color:'#94A3B8', fontFamily:'var(--font-body)' }}>Sin datos de áreas</div>
            )}
          </div>

          {/* Chart 2: Tendencia */}
          <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#8B5CF6,#7C3AED)', color:'white' }}>
                <TrendingUp size={18}/>
              </div>
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'#0F172A' }}>Tendencia</h3>
                <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8' }}>Últimas 8 semanas</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
                <XAxis dataKey="week" style={{ fontFamily:'var(--font-body)', fontSize:11, fill:'#64748B' }}/>
                <YAxis style={{ fontFamily:'var(--font-body)', fontSize:11, fill:'#64748B' }} allowDecimals={false}/>
                <Tooltip contentStyle={{ background:'rgba(255,255,255,0.98)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:12, boxShadow:'0 8px 24px rgba(0,0,0,0.15)', fontFamily:'var(--font-body)' }}/>
                <Line type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} dot={{ fill:'#8B5CF6', r:5 }} activeDot={{ r:7, fill:'#7C3AED' }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Por Severidad */}
          <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#EF4444,#DC2626)', color:'white' }}>
                <AlertTriangle size={18}/>
              </div>
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'#0F172A' }}>Por Severidad</h3>
                <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8' }}>Nivel de criticidad</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={severityChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" strokeWidth={2} stroke="#fff">
                  {severityChartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color}/>
                  ))}
                </Pie>
                {/* ✅ Bug #3 fixed: JSX element <SeverityTooltip />, not object reference */}
                <Tooltip content={<SeverityTooltip/>}/>
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily:'var(--font-body)', fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)', overflow:'hidden' }}>

          {/* Table Header */}
          <div style={{ padding:'20px 28px', borderBottom:'1px solid rgba(0,0,0,0.06)', background:'linear-gradient(135deg,rgba(30,58,95,0.02),rgba(45,95,126,0.02))' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1E3A5F,#2D5F7E)', color:'white' }}>
                  <FileText size={20}/>
                </div>
                <div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'#0F172A' }}>Registros de No Conformidades</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8', marginTop:2 }}>
                    {filteredData.length} de {ncrData.length} registros{selectedArea && ` · Área: ${selectedArea}`}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ flex:1, position:'relative', minWidth:250 }}>
                <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}/>
                <input type="text" placeholder="Buscar por ID, pieza, cliente o descripción..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ width:'100%', height:44, paddingLeft:44, paddingRight:14, borderRadius:12, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:14, color:'#0F172A', outline:'none', boxSizing:'border-box' }}/>
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ height:44, padding:'0 16px', borderRadius:12, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:14, color:'#0F172A', fontWeight:500, cursor:'pointer' }}>
                <option value="Todas">Todos los estados</option>
                <option value="Abierta">Abierta</option>
                <option value="En Proceso">En Proceso</option>
                <option value="Cerrada">Cerrada</option>
              </select>
              <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
                style={{ height:44, padding:'0 16px', borderRadius:12, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:14, color:'#0F172A', fontWeight:500, cursor:'pointer' }}>
                <option value="Todas">Todas las severidades</option>
                <option value="CRITICA">Crítica</option>
                <option value="MAYOR">Mayor</option>
                <option value="MENOR">Menor</option>
              </select>
              <button onClick={handleExport}
                style={{ height:44, padding:'0 24px', borderRadius:12, background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(16,185,129,0.25)' }}>
                <Download size={16}/> Exportar CSV
              </button>
            </div>
          </div>

          {/* Table Body */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:1000 }}>
              <thead>
                <tr style={{ background:'#F8FAFC', borderBottom:'2px solid #E2E8F0' }}>
                  {['ID NCR','Área','Pieza / Cliente','Descripción','Tipo','Severidad','Estado','Fecha','Acciones'].map(h => (
                    <th key={h} style={{ padding:'14px 20px', textAlign:'left', fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map(ncr => {
                  const cfg        = STATUS_CONFIG[ncr.status] || STATUS_CONFIG.open;
                  const areaColor  = getAreaColor(ncr.area);
                  const sevColor   = SEVERITY_COLORS[ncr.severity] || '#94A3B8';
                  const isUpdating = updatingId === ncr.miId;

                  return (
                    <tr key={ncr.id}
                      style={{ borderBottom:'1px solid rgba(0,0,0,0.05)', transition:'background 0.2s', opacity: isUpdating ? 0.6 : 1 }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.01)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13, color:'#1E293B' }}>{ncr.miId}</span>
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:8, background:`${areaColor}15`, color:areaColor, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, border:`1px solid ${areaColor}40` }}>{ncr.area}</span>
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ fontFamily:'var(--font-mono)', fontWeight:600, fontSize:13, color:'#1E293B' }}>{ncr.partNumber}</div>
                        <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B', marginTop:2 }}>{ncr.customer}</div>
                      </td>

                      <td style={{ padding:'16px 20px', maxWidth:280 }}>
                        <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#475569' }}>{ncr.description || '—'}</span>
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>{ncr.defectType || '—'}</span>
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:8, background:`${sevColor}20`, color:sevColor, fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, border:`1px solid ${sevColor}40` }}>{ncr.severity}</span>
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:8, background:cfg.bg, color:cfg.color, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, border:`1px solid ${cfg.border}` }}>
                          {ncr.status === 'closed'      && <CheckCircle size={12}/>}
                          {ncr.status === 'in_progress' && <Clock size={12}/>}
                          {ncr.status === 'open'        && <XCircle size={12}/>}
                          {cfg.label}
                        </span>
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <Calendar size={12} style={{ color:'#94A3B8' }}/>
                          <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>
                            {ncr.reportedDate ? new Date(ncr.reportedDate).toLocaleDateString('es-MX') : '—'}
                          </span>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <User size={12} style={{ color:'#94A3B8' }}/>
                          <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>{ncr.reportedBy || '—'}</span>
                        </div>
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        {ncr.status !== 'closed' ? (
                          <select value={ncr.status} disabled={isUpdating}
                            onChange={e => handleStatusChange(ncr.miId, e.target.value)}
                            style={{ padding:'6px 12px', borderRadius:8, border:'1px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:'#475569', cursor: isUpdating ? 'wait' : 'pointer' }}>
                            <option value="open">Abierta</option>
                            <option value="in_progress">En Proceso</option>
                            <option value="closed">Cerrada</option>
                          </select>
                        ) : (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'6px 12px', borderRadius:8, background:'#ECFDF5', color:'#10B981', fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, border:'1px solid #A7F3D0' }}>
                            <CheckCircle size={12}/> Cerrada
                          </span>
                        )}
                        {isUpdating && <div style={{ fontSize:10, color:'#94A3B8', marginTop:4 }}>Actualizando...</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && !loading && (
            <div style={{ padding:'60px 0', textAlign:'center', color:'#94A3B8', fontFamily:'var(--font-body)', fontSize:14 }}>
              No se encontraron registros con los filtros aplicados
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
