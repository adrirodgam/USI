// frontend/react/src/pages/NCR.jsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import TopBar from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { getNCRSheet, getNCRStatuses } from '../api/ncr';
import {
  AlertTriangle, TrendingDown, TrendingUp,
  Download, Search, FileText, Calendar, User, ExternalLink, RefreshCw,
  ChevronLeft, ChevronRight
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
  AREA_ORIGIN:  "AREA DONDE SE ORIGINO EL DEFECTO",
  QTY_REJ_INSP: "Qty Rej(INSPECTOR)",
  INITIATOR:    "Iniciador",
  SUPPLIER:     "Proveedor",
  WO_NUMBER:    "WO#"
};

const AREA_COLORS = {
  'SHEET METAL':        '#EC4899',
  'MAQUINADO':          '#3B82F6',
  'INCOMING':           '#EF4444',
  'SOLDADURA':          '#F59E0B',
  'ENSAMBLE':           '#10B981',
  'ENSAMBLE MAQUINADO': '#14B8A6',
  'POWDERCOAT':         '#8B5CF6',
  'PROVEEDOR':          '#F97316',
  'RECTIFICADO':        '#06B6D4',
  'ALMACEN':            '#64748B',
};

const getAreaColor = (area) => AREA_COLORS[area] || '#94A3B8';

const PAGE_SIZE = 15;

// =====================================================
// Julian week helper
// =====================================================
const getWeekNumber = (date) => {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d - startOfYear;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil((diff / oneWeek) + 1);
};

// =====================================================
// Parse Smartsheet data
// =====================================================

// "2026-05-12" -> local midnight Date (avoids UTC offset shifting the day)
const parseLocalDate = (str) => {
  if (!str) return null;
  const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const parseNCRSheet = (sheet) => {
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

    // Store date as "YYYY-MM-DD" string — no UTC conversion
    const dateStr = String(cellMap[colIds.DATE] || '').slice(0, 10);

    parsed.push({
      id:           row.id,
      miId:         String(miNumber),
      area:         cellMap[colIds.AREA_ORIGIN]  || 'N/A',
      partNumber:   cellMap[colIds.PART_NUMBER]  || 'N/A',
      customer:     cellMap[colIds.SUPPLIER]     || 'N/A',
      description:  cellMap[colIds.DEFECT]       || '',
      defectType:   cellMap[colIds.DEFECT_TYPE]  || '',
      reportedBy:   cellMap[colIds.INITIATOR]    || '',
      reportedDate: dateStr,
      woNumber:     cellMap[colIds.WO_NUMBER]    || '',
      qtyRejInsp:   cellMap[colIds.QTY_REJ_INSP] || 0,
    });
  }

  // Sort newest first — ISO string comparison is safe for YYYY-MM-DD
  return parsed.sort((a, b) => (b.reportedDate > a.reportedDate ? 1 : b.reportedDate < a.reportedDate ? -1 : 0));
};

// =====================================================
// Main Component
// =====================================================
export default function NCR() {
  const { token } = useApp();

  const [ncrData,      setNcrData]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState(null);
  const [searchTerm,   setSearchTerm]   = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('General');
  const [filterOrder,  setFilterOrder]  = useState('desc');
  const [currentPage,  setCurrentPage]  = useState(1);
  const [selectedChartWeek, setSelectedChartWeek] = useState(null); // { weekNum, year } | null
  const [filterExactWeek,   setFilterExactWeek]   = useState('');   // "YYYY-Www" string
  const [filterExactDay,    setFilterExactDay]     = useState('');   // "YYYY-MM-DD" string

  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (force = false) => {
    try {
      setError(null);
      const CACHE_KEY = 'ncr_cache';
      const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
      const now = Date.now();

      // Use sessionStorage cache to avoid redundant heavy fetches
      if (!force) {
        try {
          const cached = sessionStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data, ts } = JSON.parse(cached);
            if (now - ts < CACHE_TTL) {
              setNcrData(data);
              setLoading(false);
              setRefreshing(false);
              return;
            }
          }
        } catch {}
      }

      const [sheet] = await Promise.all([getNCRSheet(token), getNCRStatuses(token)]);
      const parsed = parseNCRSheet(sheet);
      setNcrData(parsed);

      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: parsed, ts: now }));
      } catch {}
    } catch (err) {
      console.error('Error fetching NCR data:', err);
      setError('Error al cargar los datos de NCR');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [fetchData, token]);

  const handleRefresh = () => { setRefreshing(true); fetchData(true); };

  // ── Period filter — applied to metrics AND table ───────────────────────────
  const today = new Date();
  const currentWeek  = getWeekNumber(today);
  const currentMonth = today.getMonth();
  const currentYear  = today.getFullYear();

  const activeData = useMemo(() => {
    if (filterPeriod === 'General') return ncrData;
    return ncrData.filter(n => {
      if (!n.reportedDate) return false;
      const d = parseLocalDate(n.reportedDate);
      if (!d) return false;
      if (filterPeriod === 'Semanal') {
        return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
      }
      if (filterPeriod === 'Mensual') {
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }
      return true;
    });
  }, [ncrData, filterPeriod, currentWeek, currentMonth, currentYear]);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const total   = activeData.length;

  const todayStr = today.toISOString().split('T')[0]; // "2026-05-08"
  const countToday = activeData.filter(n => {
    if (!n.reportedDate) return false;
    return String(n.reportedDate).slice(0, 10) === todayStr;
  }).length;

  const countThisWeek = activeData.filter(n => {
    if (!n.reportedDate) return false;
    const d = parseLocalDate(n.reportedDate);
    return d && getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
  }).length;

  const countLastWeek = ncrData.filter(n => {
    if (!n.reportedDate) return false;
    const d = parseLocalDate(n.reportedDate);
    return d && getWeekNumber(d) === currentWeek - 1 && d.getFullYear() === currentYear;
  }).length;

  const weekVariation = countThisWeek - countLastWeek;

  const kpis = [
    {
      label: 'Total No Conformidades',
      value: total,
      trend: `${total} registros`,
      trendPositive: null,
      icon: <AlertTriangle size={22}/>,
      bgGradient: 'linear-gradient(135deg,#EF4444,#DC2626)'
    },
    {
      label: 'Al Día',
      value: countToday,
      trend: `${today.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}`,
      trendPositive: countToday === 0,
      icon: <Calendar size={22}/>,
      bgGradient: 'linear-gradient(135deg,#F97316,#EA580C)'
    },
    {
      label: 'Esta Semana',
      value: countThisWeek,
      trend: `Semana ${currentWeek}`,
      trendPositive: countThisWeek === 0,
      icon: <FileText size={22}/>,
      bgGradient: 'linear-gradient(135deg,#F59E0B,#D97706)'
    },
    {
      label: 'vs Semana Pasada',
      value: weekVariation === 0 ? '=' : (weekVariation > 0 ? `+${weekVariation}` : `${weekVariation}`),
      trend: weekVariation > 0 ? 'Más que la semana pasada' : weekVariation < 0 ? 'Menos que la semana pasada' : 'Igual que la semana pasada',
      trendPositive: weekVariation <= 0,
      icon: weekVariation > 0 ? <TrendingUp size={22}/> : <TrendingDown size={22}/>,
      bgGradient: weekVariation > 0
        ? 'linear-gradient(135deg,#EF4444,#DC2626)'
        : 'linear-gradient(135deg,#10B981,#059669)'
    },
  ];

  // ── Chart Data — based on activeData ──────────────────────────────────────
  const areaChartData = useMemo(() => {
    const counts = {};
    activeData.forEach(n => { if (n.area) counts[n.area] = (counts[n.area] || 0) + 1; });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, color: getAreaColor(name) }))
      .sort((a, b) => b.value - a.value);
  }, [activeData]);

  const trendData = useMemo(() => {
    if (filterPeriod === 'Semanal') {
      // Show the 7 days of the current week
      const days = {};
      activeData.forEach(n => {
        if (!n.reportedDate) return;
        const date = parseLocalDate(n.reportedDate);
        if (!date) return;
        if (getWeekNumber(date) !== currentWeek || date.getFullYear() !== currentYear) return;
        const dayKey = n.reportedDate.slice(0, 10);
        if (!days[dayKey]) days[dayKey] = { label: date.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }), count: 0, dateStr: dayKey };
        days[dayKey].count++;
      });
      // Build Mon-Sun of the current week
      const result = [];
      const now = new Date();
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Mon=0
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek);
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        result.push({
          week: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' }),
          count: days[key]?.count || 0,
          dateStr: key,
          type: 'day',
        });
      }
      return result;
    }

    if (filterPeriod === 'Mensual') {
      // Show each week of the current month
      const weeks = {};
      activeData.forEach(n => {
        if (!n.reportedDate) return;
        const date = parseLocalDate(n.reportedDate);
        if (!date) return;
        if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) return;
        const weekNum = getWeekNumber(date);
        const key = `${currentYear}-W${weekNum}`;
        if (!weeks[key]) weeks[key] = { week: `S${weekNum}`, count: 0, weekNum, year: currentYear };
        weeks[key].count++;
      });
      // Collect weeks that fall in this month
      const result = Object.values(weeks).sort((a, b) => a.weekNum - b.weekNum);
      // If no data, show skeleton of weeks
      if (result.length === 0) {
        for (let i = 1; i <= 5; i++) {
          const w = currentWeek - (today.getDate() > 21 ? 4 - i : i - 1);
          result.push({ week: `S${w > 0 ? w : w + 52}`, count: 0, weekNum: w, year: currentYear });
        }
      }
      return result.map(r => ({ ...r, type: 'week' }));
    }

    // General: last 8 weeks
    const weeks = {};
    activeData.forEach(n => {
      if (!n.reportedDate) return;
      const date = parseLocalDate(n.reportedDate);
      if (!date) return;
      const weekNum = getWeekNumber(date);
      const year = date.getFullYear();
      const key = `${year}-W${weekNum}`;
      if (!weeks[key]) weeks[key] = { week: `S${weekNum}`, count: 0, weekNum, year };
      weeks[key].count++;
    });
    const result = [];
    for (let i = 7; i >= 0; i--) {
      const weekNum = currentWeek - i;
      const key = `${currentYear}-W${weekNum}`;
      result.push({
        week: `S${weekNum > 0 ? weekNum : weekNum + 52}`,
        count: weeks[key]?.count || 0,
        weekNum: weekNum > 0 ? weekNum : weekNum + 52,
        year: currentYear,
        type: 'week',
      });
    }
    return result;
  }, [activeData, currentWeek, currentYear, currentMonth, filterPeriod]);

  // ── Filters + Sort + Pagination ────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase();
    const filtered = activeData.filter(n => {
      const matchSearch =
        !q ||
        n.miId.toLowerCase().includes(q) ||
        n.partNumber.toLowerCase().includes(q) ||
        n.customer.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q);
      const matchArea = !selectedArea || n.area === selectedArea;

      // Chart week click filter
      let matchChartWeek = true;
      if (selectedChartWeek) {
        if (selectedChartWeek.type === 'day') {
          matchChartWeek = n.reportedDate === selectedChartWeek.dateStr;
        } else {
          const date = parseLocalDate(n.reportedDate);
          if (!date) { matchChartWeek = false; }
          else {
            matchChartWeek =
              getWeekNumber(date) === selectedChartWeek.weekNum &&
              date.getFullYear() === selectedChartWeek.year;
          }
        }
      }

      // Exact week filter (from picker)
      let matchExactWeek = true;
      if (filterExactWeek) {
        // filterExactWeek format: "YYYY-Www"
        const [wy, ww] = filterExactWeek.split('-W').map(Number);
        const date = parseLocalDate(n.reportedDate);
        matchExactWeek = date && getWeekNumber(date) === ww && date.getFullYear() === wy;
      }

      // Exact day filter (from picker)
      let matchExactDay = true;
      if (filterExactDay) {
        matchExactDay = n.reportedDate === filterExactDay;
      }

      return matchSearch && matchArea && matchChartWeek && matchExactWeek && matchExactDay;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(a.reportedDate);
      const dateB = new Date(b.reportedDate);
      return filterOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [activeData, searchTerm, selectedArea, filterOrder, selectedChartWeek, filterExactWeek, filterExactDay]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedArea, filterPeriod, filterOrder, selectedChartWeek, filterExactWeek, filterExactDay]);
  // Clear chart selection when period changes
  useEffect(() => { setSelectedChartWeek(null); }, [filterPeriod]);

  const totalPages   = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (filteredData.length === 0) return;
    const rows = filteredData.map(n => ({
      'MI#':          n.miId,
      'Área Origen':  n.area,
      'Pieza':        n.partNumber,
      'Cliente':      n.customer,
      'Descripción':  n.description,
      'Tipo Defecto': n.defectType,
      'Fecha':        n.reportedDate,
      'Reportado por': n.reportedBy,
      'WO#':          n.woNumber,
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

  const AreaTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={tooltipStyle}>
        <p style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:'#0F172A', marginBottom:4 }}>{payload[0].name}</p>
        <p style={{ fontFamily:'var(--font-body)', fontSize:15, fontWeight:700, color:payload[0].payload.color }}>
          {payload[0].value} NCR{payload[0].value !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  const TrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;
    return (
      <div style={tooltipStyle}>
        <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B', marginBottom:4 }}>
          {point.type === 'day' ? label : `Semana ${label}`}
        </p>
        <p style={{ fontFamily:'var(--font-body)', fontSize:15, fontWeight:700, color:'#8B5CF6' }}>
          {payload[0].value} NCR{payload[0].value !== 1 ? 's' : ''}
        </p>
        <p style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#94A3B8', marginTop:2 }}>
          Clic para filtrar tabla
        </p>
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
              if (url) window.open(url, '_blank');
              }}
            style={{ height:36, padding:'0 16px', borderRadius:8, background:'linear-gradient(135deg,#3B82F6,#2563EB)', color:'white', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <ExternalLink size={14}/> Registrar NCR
          </button>
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

        {/* Period Filter Bar */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:24 }}>
          {['General', 'Semanal', 'Mensual'].map(p => (
            <button key={p} onClick={() => setFilterPeriod(p)}
              style={{
                padding:'8px 20px', borderRadius:20, border:'none', cursor:'pointer',
                fontFamily:'var(--font-body)', fontWeight:600, fontSize:13,
                background: filterPeriod === p ? 'linear-gradient(135deg,#1E3A5F,#2D5F7E)' : 'rgba(255,255,255,0.8)',
                color: filterPeriod === p ? 'white' : '#64748B',
                boxShadow: filterPeriod === p ? '0 4px 12px rgba(30,58,95,0.2)' : 'none',
                transition: 'all 0.2s',
              }}>
              {p}
            </button>
          ))}
          <span style={{ marginLeft:8, fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8' }}>
            {filterPeriod === 'Semanal' && `Semana ${currentWeek} · ${currentYear}`}
            {filterPeriod === 'Mensual' && today.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </span>
        </div>

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
                <div style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:kpi.bgGradient, color:'white', boxShadow:'0 6px 20px rgba(0,0,0,0.15)' }}>
                  {kpi.icon}
                </div>
                {kpi.trendPositive !== null && (
                  <div style={{ color: kpi.trendPositive ? '#10B981' : '#EF4444' }}>
                    {kpi.trendPositive ? <TrendingDown size={14}/> : <TrendingUp size={14}/>}
                  </div>
                )}
              </div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:36, color:'#0F172A', letterSpacing:'-1px', lineHeight:1, marginBottom:8 }}>{kpi.value}</div>
              <div style={{ fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, color:'#64748B', marginBottom:4 }}>{kpi.label}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#94A3B8' }}>{kpi.trend}</div>
            </div>
          ))}
        </div>

        {/* Charts Row — 2 charts only */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:20, marginBottom:28 }}>

          {/* Chart 1: Por Área Origen */}
          <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#3B82F6,#2563EB)', color:'white' }}>
                <FileText size={18}/>
              </div>
              <div>
                <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'#0F172A' }}>Por Área de Origen</h3>
                <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8' }}>
                  {selectedArea ? `Filtrando: ${selectedArea}` : 'Haz clic en un área para filtrar'}
                </p>
              </div>
            </div>
            {areaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={areaChartData} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    dataKey="value" strokeWidth={2} stroke="#fff"
                    onClick={d => d?.name && setSelectedArea(d.name === selectedArea ? null : d.name)}
                    style={{ cursor:'pointer' }}>
                    {areaChartData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color}
                        opacity={!selectedArea || selectedArea === entry.name ? 1 : 0.3}
                        style={{ filter: selectedArea === entry.name ? 'brightness(1.1)' : 'none' }}/>
                    ))}
                  </Pie>
                  <Tooltip content={<AreaTooltip/>}/>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily:'var(--font-body)', fontSize:12 }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:280, color:'#94A3B8', fontFamily:'var(--font-body)' }}>Sin datos de áreas</div>
            )}
          </div>

          {/* Chart 2: Tendencia con semanas julianas */}
          <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, padding:24, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#8B5CF6,#7C3AED)', color:'white' }}>
                  <TrendingUp size={18}/>
                </div>
                <div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:17, color:'#0F172A' }}>Tendencia</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8' }}>
                    {filterPeriod === 'General' && 'Últimas 8 semanas · clic en punto para filtrar'}
                    {filterPeriod === 'Semanal' && `Días de la semana ${currentWeek} · clic en punto para filtrar`}
                    {filterPeriod === 'Mensual' && `Semanas del mes · clic en punto para filtrar`}
                  </p>
                </div>
              </div>
              {selectedChartWeek && (
                <button
                  onClick={() => setSelectedChartWeek(null)}
                  style={{ padding:'4px 12px', background:'#EF4444', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600 }}
                >
                  Limpiar selección
                </button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)"/>
                <XAxis dataKey="week" style={{ fontFamily:'var(--font-body)', fontSize:11, fill:'#64748B' }}/>
                <YAxis style={{ fontFamily:'var(--font-body)', fontSize:11, fill:'#64748B' }} allowDecimals={false}/>
                <Tooltip content={<TrendTooltip/>}/>
                <Line
                  type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    const isSelected = selectedChartWeek &&
                      (payload.type === 'day'
                        ? selectedChartWeek.dateStr === payload.dateStr
                        : selectedChartWeek.weekNum === payload.weekNum);
                    const handleDotClick = () => {
                      if (isSelected) {
                        setSelectedChartWeek(null);
                      } else {
                        setSelectedChartWeek(payload);
                      }
                    };
                    return (
                      <circle
                        key={`dot-${payload.week}`}
                        cx={cx} cy={cy}
                        r={isSelected ? 9 : 6}
                        fill={isSelected ? '#7C3AED' : '#8B5CF6'}
                        stroke={isSelected ? '#5B21B6' : '#fff'}
                        strokeWidth={2}
                        onClick={handleDotClick}
                        style={{ cursor: 'pointer', filter: isSelected ? 'drop-shadow(0 0 6px #8B5CF6)' : 'none' }}
                      />
                    );
                  }}
                  activeDot={(props) => {
                    const { cx, cy, payload } = props;
                    const isSelected = selectedChartWeek &&
                      (payload.type === 'day'
                        ? selectedChartWeek.dateStr === payload.dateStr
                        : selectedChartWeek.weekNum === payload.weekNum);
                    return (
                      <circle
                        cx={cx} cy={cy} r={9}
                        fill={isSelected ? '#5B21B6' : '#7C3AED'}
                        stroke="#fff" strokeWidth={2}
                        onClick={() => isSelected ? setSelectedChartWeek(null) : setSelectedChartWeek(payload)}
                        style={{ cursor: 'pointer' }}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div style={{ background:'rgba(255,255,255,0.9)', backdropFilter:'blur(20px)', borderRadius:20, border:'1px solid rgba(255,255,255,0.4)', boxShadow:'0 8px 32px rgba(0,0,0,0.08)', overflow:'hidden' }}>

          {/* Table Header / Filters */}
          <div style={{ padding:'20px 28px', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#1E3A5F,#2D5F7E)', color:'white' }}>
                  <FileText size={20}/>
                </div>
                <div>
                  <h3 style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:18, color:'#0F172A' }}>Registros de No Conformidades</h3>
                  <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8', marginTop:2 }}>
                    {filteredData.length} de {ncrData.length} registros
                    {selectedArea && ` · Área: ${selectedArea}`}
                  </p>
                </div>
              </div>
              {selectedArea && (
                <button onClick={() => setSelectedArea(null)}
                  style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #E2E8F0', background:'white', color:'#64748B', fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                  Limpiar filtro de área
                </button>
              )}
            </div>
            {/* Exact week / day pickers */}
            <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginBottom:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Calendar size={15} style={{ color:'#94A3B8' }}/>
                <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B', fontWeight:600 }}>Filtrar por:</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>Semana exacta:</span>
                <input
                  type="week"
                  value={filterExactWeek}
                  onChange={e => { setFilterExactWeek(e.target.value); setFilterExactDay(''); setSelectedChartWeek(null); }}
                  style={{ height:36, padding:'0 10px', borderRadius:10, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:13, color:'#0F172A', cursor:'pointer' }}
                />
                {filterExactWeek && (
                  <button onClick={() => setFilterExactWeek('')}
                    style={{ padding:'4px 10px', borderRadius:8, border:'none', background:'#EF4444', color:'white', fontSize:11, fontWeight:600, cursor:'pointer' }}>✕</button>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>Día exacto:</span>
                <input
                  type="date"
                  value={filterExactDay}
                  onChange={e => { setFilterExactDay(e.target.value); setFilterExactWeek(''); setSelectedChartWeek(null); }}
                  style={{ height:36, padding:'0 10px', borderRadius:10, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:13, color:'#0F172A', cursor:'pointer' }}
                />
                {filterExactDay && (
                  <button onClick={() => setFilterExactDay('')}
                    style={{ padding:'4px 10px', borderRadius:8, border:'none', background:'#EF4444', color:'white', fontSize:11, fontWeight:600, cursor:'pointer' }}>✕</button>
                )}
              </div>
              {(selectedChartWeek || filterExactWeek || filterExactDay) && (
                <div style={{ padding:'4px 12px', borderRadius:8, background:'#EDE9FE', color:'#7C3AED', fontSize:12, fontWeight:600, fontFamily:'var(--font-body)' }}>
                  {selectedChartWeek
                    ? selectedChartWeek.type === 'day'
                      ? `Día: ${selectedChartWeek.week}`
                      : `Semana ${selectedChartWeek.weekNum}`
                    : filterExactWeek
                    ? `${filterExactWeek}`
                    : `${filterExactDay}`
                  }
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ flex:1, position:'relative', minWidth:250 }}>
                <Search size={16} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94A3B8' }}/>
                <input type="text" placeholder="Buscar por ID, pieza, cliente o descripción..."
                  value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ width:'100%', height:44, paddingLeft:44, paddingRight:14, borderRadius:12, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:14, color:'#0F172A', outline:'none', boxSizing:'border-box' }}/>
              </div>
              <select value={filterOrder} onChange={e => setFilterOrder(e.target.value)}
                style={{ height:44, padding:'0 16px', borderRadius:12, border:'2px solid #E2E8F0', background:'#F8FAFC', fontFamily:'var(--font-body)', fontSize:14, color:'#0F172A', fontWeight:500, cursor:'pointer' }}>
                <option value="desc">Más recientes </option>
                <option value="asc">Más antiguos</option>
              </select>
              <button onClick={handleExport}
                style={{ height:44, padding:'0 24px', borderRadius:12, background:'linear-gradient(135deg,#10B981,#059669)', color:'white', border:'none', cursor:'pointer', fontFamily:'var(--font-body)', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:8, boxShadow:'0 4px 12px rgba(16,185,129,0.25)' }}>
                <Download size={16}/> Exportar CSV
              </button>
            </div>
          </div>

          {/* Table Body */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:900 }}>
              <thead>
                <tr style={{ background:'#F8FAFC', borderBottom:'2px solid #E2E8F0' }}>
                  {['ID NCR', 'Área Origen', 'Pieza / Cliente', 'Descripción', 'Tipo Defecto', 'Fecha', 'Reportado por'].map(h => (
                    <th key={h} style={{ padding:'14px 20px', textAlign:'left', fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(ncr => {
                  const areaColor = getAreaColor(ncr.area);
                  return (
                    <tr key={ncr.id}
                      style={{ borderBottom:'1px solid rgba(0,0,0,0.05)', transition:'background 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(0,0,0,0.01)'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}>

                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13, color:'#1E293B' }}>{ncr.miId}</span>
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:8, background:`${areaColor}15`, color:areaColor, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, border:`1px solid ${areaColor}40` }}>
                          {ncr.area}
                        </span>
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
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <Calendar size={12} style={{ color:'#94A3B8' }}/>
                          <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>
                            {ncr.reportedDate ? parseLocalDate(ncr.reportedDate)?.toLocaleDateString('es-MX') ?? '—' : '—'}
                          </span>
                        </div>
                        {ncr.reportedDate && (
                          <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#94A3B8', marginTop:2 }}>
                            Semana {getWeekNumber(new Date(ncr.reportedDate))}
                          </div>
                        )}
                      </td>

                      <td style={{ padding:'16px 20px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <User size={12} style={{ color:'#94A3B8' }}/>
                          <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#64748B' }}>{ncr.reportedBy || '—'}</span>
                        </div>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'20px 28px', borderTop:'1px solid rgba(0,0,0,0.06)' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ width:36, height:36, borderRadius:8, border:'1px solid #E2E8F0', background:'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: currentPage === 1 ? '#CBD5E1' : '#1E3A5F', opacity: currentPage === 1 ? 0.5 : 1 }}>
                <ChevronLeft size={16}/>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding:'0 4px', color:'#94A3B8', fontFamily:'var(--font-body)', fontSize:13 }}>...</span>
                  ) : (
                    <button key={p} onClick={() => setCurrentPage(p)}
                      style={{
                        width:36, height:36, borderRadius:8, border:'none', cursor:'pointer',
                        fontFamily:'var(--font-body)', fontSize:13, fontWeight:600,
                        background: currentPage === p ? 'linear-gradient(135deg,#1E3A5F,#2D5F7E)' : 'white',
                        color: currentPage === p ? 'white' : '#475569',
                        border: currentPage === p ? 'none' : '1px solid #E2E8F0',
                        boxShadow: currentPage === p ? '0 4px 12px rgba(30,58,95,0.2)' : 'none',
                      }}>
                      {p}
                    </button>
                  )
                )
              }

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ width:36, height:36, borderRadius:8, border:'1px solid #E2E8F0', background:'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: currentPage === totalPages ? '#CBD5E1' : '#1E3A5F', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                <ChevronRight size={16}/>
              </button>

              <span style={{ marginLeft:8, fontFamily:'var(--font-body)', fontSize:12, color:'#94A3B8' }}>
                Página {currentPage} de {totalPages} · {filteredData.length} registros
              </span>
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
