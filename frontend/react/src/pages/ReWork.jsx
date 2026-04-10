// frontend/react/src/pages/Rework.jsx
import { useState, useEffect, useCallback } from 'react';
import TopBar from "../components/TopBar";
import { getReworks, updateReworkStatus } from "../api/reworkRequest";
import {
  RotateCcw, TrendingDown, TrendingUp, Clock, CheckCircle,
  Download, Search, Edit, XCircle, Package, FileText, AlertCircle, RefreshCw,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Smartsheet regresa columns[] y rows[]. Cada row tiene cells[].
 * Esta función convierte esa estructura a un array de objetos planos.
 */
const parseSmartsheetData = (sheet) => {
  if (!sheet || !sheet.columns || !sheet.rows) return [];

  // Mapa columnId → título
  const colMap = {};
  sheet.columns.forEach((col) => {
    colMap[col.id] = col.title;
  });

  return sheet.rows.map((row) => {
    const obj = { id: row.id };
    row.cells.forEach((cell) => {
      const title = colMap[cell.columnId];
      if (title) obj[title] = cell.value ?? null;
    });

    return {
      id: row.id,
      partNumber:     obj['No. de Parte']                        || '',
      jobOrder:       obj['Job Order']                           || '',
      quantity:       obj['Cantidad']                            || 0,
      discrepancy:    obj['Discrepancia']                        || '',
      area:           obj['Área donde se realizará el REWORK (POWDERCOAT, ASSEMBLY, SHEET METAL, WELDING, MACHINING, INCOMING)'] || '',
      processDetails: obj['Detalles del Proceso']               || '',
      estimatedTime:  parseFloat(obj['Tiempo Estimado de Rework']) || 0,
      status:         obj['Estado']                              || 'Pendiente',
      registeredDate: obj['Fecha de interrupción del proceso']  || null,
      areaAssignedDate: obj['Fecha Asignado']                   || null,
      inReviewDate:   obj['Fecha Revisión']                     || null,
      completedDate:  obj['Fecha Terminado']                    || null,
    };
  });
};

const AREA_COLORS = {
  POWDERCOAT:    "#8B5CF6",
  ASSEMBLY:      "#10B981",
  "SHEET METAL": "#EC4899",
  WELDING:       "#F59E0B",
  MACHINING:     "#3B82F6",
  INCOMING:      "#EF4444",
};

const calculateAreaData = (data) => {
  const counts = {};
  data.forEach((rw) => {
    if (rw.area) counts[rw.area] = (counts[rw.area] || 0) + 1;
  });
  return Object.entries(counts).map(([area, count]) => ({
    name: area,
    value: count,
    color: AREA_COLORS[area] || "#94A3B8",
  }));
};

const calculateKPIs = (data) => {
  const total        = data.length;
  const pending      = data.filter((r) => r.status === 'Pendiente').length;
  const inProcess    = data.filter((r) => r.status === 'En Proceso').length;
  const completed    = data.filter((r) => r.status === 'Terminado').length;
  const totalHours   = data.reduce((s, r) => s + r.estimatedTime, 0);

  return [
    {
      label: 'Total de ReWorks',
      value: total.toString(),
      trend: 'Registros activos',
      trendPositive: null,
      icon: <RotateCcw size={22} />,
      bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    },
    {
      label: 'Pendientes',
      value: pending.toString(),
      trend: 'Sin asignar aún',
      trendPositive: null,
      icon: <AlertCircle size={22} />,
      bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    },
    {
      label: 'En Proceso',
      value: inProcess.toString(),
      trend: 'Área y tiempo asignados',
      trendPositive: null,
      icon: <Clock size={22} />,
      bgGradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    },
    {
      label: 'Terminados',
      value: completed.toString(),
      trend: total > 0 ? `${Math.round((completed / total) * 100)}% completado` : '0%',
      trendPositive: true,
      icon: <CheckCircle size={22} />,
      bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    },
    {
      label: 'Horas Muertas Totales',
      value: `${totalHours.toFixed(1)}h`,
      trend: total > 0 ? `${(totalHours / total).toFixed(1)}h promedio` : '--',
      trendPositive: null,
      icon: <TrendingDown size={22} />,
      bgGradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    },
  ];
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'Pendiente':   return { bg: '#FEF3C7', color: '#F59E0B', border: '#FDE047' };
    case 'En Proceso':  return { bg: '#DBEAFE', color: '#3B82F6', border: '#BFDBFE' };
    case 'En Revisión': return { bg: '#E0E7FF', color: '#6366F1', border: '#C7D2FE' };
    case 'Terminado':   return { bg: '#ECFDF5', color: '#10B981', border: '#A7F3D0' };
    default:            return { bg: '#F1F5F9', color: '#64748B', border: '#E2E8F0' };
  }
};

const calculateTimeDiff = (startDate, endDate) => {
  if (!startDate || !endDate) return '--';
  const diffMs    = new Date(endDate) - new Date(startDate);
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 1)  return `${Math.round(diffMs / 60000)}min`;
  if (diffHours < 24) return `${diffHours.toFixed(1)}h`;
  const days = Math.floor(diffHours / 24);
  return `${days}d ${Math.round(diffHours % 24)}h`;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReWork() {
  const [reworkData,    setReworkData]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState(null);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterStatus,  setFilterStatus]  = useState('Todos');
  const [selectedArea,  setSelectedArea]  = useState(null);
  const [updatingRow,   setUpdatingRow]   = useState(null); // rowId en proceso de update

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const sheet = await getReworks();
      const parsed = parseSmartsheetData(sheet);
      setReworkData(parsed);
    } catch (err) {
      console.error('Error fetching reworks:', err);
      setError('Error al cargar los datos de ReWork');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // ── Status update ────────────────────────────────────────────────────────
  const handleStatusChange = async (rowId, newStatus) => {
    setUpdatingRow(rowId);
    try {
      await updateReworkStatus(rowId, newStatus);
      // Optimistic update local
      setReworkData((prev) =>
        prev.map((rw) => {
          if (rw.id !== rowId) return rw;
          const now = new Date().toISOString();
          const updates = { status: newStatus };
          if (newStatus === 'En Revisión' && !rw.inReviewDate)  updates.inReviewDate  = now;
          if (newStatus === 'Terminado'   && !rw.completedDate) {
            updates.completedDate = now;
            if (!rw.inReviewDate) updates.inReviewDate = now;
          }
          return { ...rw, ...updates };
        })
      );
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Error al actualizar el estado. Intenta de nuevo.');
    } finally {
      setUpdatingRow(null);
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = filteredData.map((rw) => ({
      'No. de Parte':          rw.partNumber,
      'Job Order':             rw.jobOrder,
      Cantidad:                rw.quantity,
      Discrepancia:            rw.discrepancy,
      Área:                   rw.area || 'Sin asignar',
      'Detalles del Proceso':  rw.processDetails || 'Pendiente',
      'Tiempo Estimado (hrs)': rw.estimatedTime || 0,
      Estado:                  rw.status,
      Registrado:              rw.registeredDate || 'N/A',
      'Área Asignada':         rw.areaAssignedDate || 'N/A',
      'En Revisión':           rw.inReviewDate || 'N/A',
      Completado:              rw.completedDate || 'N/A',
    }));

    const csv = [
      Object.keys(rows[0]).join(','),
      ...rows.map((r) => Object.values(r).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ReWork_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ── Derived data ─────────────────────────────────────────────────────────
  const areaChartData = calculateAreaData(reworkData);
  const kpiCards      = calculateKPIs(reworkData);

  const filteredData = reworkData.filter((rw) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      rw.partNumber.toLowerCase().includes(q) ||
      rw.jobOrder.toLowerCase().includes(q)   ||
      rw.discrepancy.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'Todos' || rw.status === filterStatus;
    const matchesArea   = !selectedArea || rw.area === selectedArea;
    return matchesSearch && matchesStatus && matchesArea;
  });

  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ── Custom tooltip ────────────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        borderRadius: '12px', padding: '12px 16px',
      }}>
        <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: 4, fontSize: 13 }}>
          {payload[0].name}
        </p>
        <p style={{ fontWeight: 700, color: payload[0].payload.color, fontSize: 15 }}>
          {payload[0].value} ReWork{payload[0].value !== 1 ? 's' : ''}
        </p>
      </div>
    );
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FEF9C3 0%, #FEE2E2 25%, #E0E7FF 75%, #DBEAFE 100%)' }}>
        <TopBar title="ReWork" breadcrumb={currentDate} />
        <div className="p-8 flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A5F] mx-auto" />
            <p className="mt-4 text-gray-500" style={{ fontFamily: 'var(--font-body)' }}>
              Cargando datos de ReWork...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FEF9C3 0%, #FEE2E2 25%, #E0E7FF 75%, #DBEAFE 100%)' }}>
      <TopBar title="ReWork" breadcrumb={currentDate}>
        <div className="flex items-center gap-3">
          {selectedArea && (
            <button
              onClick={() => setSelectedArea(null)}
              className="h-9 px-5 rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #64748B 0%, #475569 100%)', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}
            >
              <XCircle size={16} /> Limpiar Filtro
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 px-4 rounded-lg transition-all hover:shadow-lg flex items-center gap-2"
            style={{ background: 'white', color: '#1E3A5F', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, border: '1px solid #E2E8F0', cursor: 'pointer' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={handleExport}
            className="h-9 px-5 rounded-lg transition-all hover:shadow-lg hover:scale-[1.02] flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5F7E 100%)', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer' }}
          >
            <Download size={16} /> Exportar Reporte
          </button>
        </div>
      </TopBar>

      <div className="p-4 md:p-8">

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
            {error}
            <button onClick={handleRefresh} className="ml-3 underline hover:no-underline">
              Reintentar
            </button>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          {kpiCards.map((kpi, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 transition-all hover:scale-[1.03] hover:shadow-2xl"
              style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: kpi.bgGradient, color: 'white', boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
                  {kpi.icon}
                </div>
                {kpi.trendPositive !== null && (
                  <div style={{ color: kpi.trendPositive ? '#10B981' : '#EF4444' }}>
                    {kpi.trendPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </div>
                )}
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: '#0F172A', letterSpacing: '-1px', lineHeight: 1, marginBottom: 8 }}>
                {kpi.value}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#64748B', marginBottom: 6 }}>
                {kpi.label}
              </div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                {kpi.trend}
              </div>
            </div>
          ))}
        </div>

        {/* ── Donut Chart ── */}
        <div className="mb-6 md:mb-8">
          <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: 'white', boxShadow: '0 4px 16px rgba(59,130,246,0.3)' }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#0F172A', letterSpacing: '-0.3px' }}>
                    ReWorks por Área
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#94A3B8' }}>
                    {selectedArea ? `Filtrando: ${selectedArea}` : 'Haz clic en un área para filtrar la tabla'}
                  </p>
                </div>
              </div>
              {selectedArea && (
                <button
                  onClick={() => setSelectedArea(null)}
                  className="px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 600, color: '#475569', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer' }}
                >
                  Limpiar
                </button>
              )}
            </div>

            {areaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={areaChartData}
                    cx="50%" cy="50%"
                    innerRadius={80} outerRadius={120}
                    dataKey="value"
                    strokeWidth={3} stroke="#fff"
                    onClick={(d) => d?.name && setSelectedArea(d.name === selectedArea ? null : d.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {areaChartData.map((entry, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={entry.color}
                        opacity={!selectedArea || selectedArea === entry.name ? 1 : 0.3}
                        style={{ filter: selectedArea === entry.name ? 'brightness(1.1)' : 'none' }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 500 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48" style={{ color: '#94A3B8', fontFamily: 'var(--font-body)' }}>
                Sin datos para mostrar
              </div>
            )}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>

          {/* Table header / filters */}
          <div className="px-7 py-5 border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: 'linear-gradient(135deg, rgba(30,58,95,0.02) 0%, rgba(45,95,126,0.02) 100%)' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5F7E 100%)', color: 'white', boxShadow: '0 4px 16px rgba(30,58,95,0.3)' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#0F172A', letterSpacing: '-0.3px' }}>
                    Registros de ReWork
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                    {filteredData.length} de {reworkData.length} registros
                    {selectedArea && ` · Área: ${selectedArea}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              {/* Search */}
              <div className="flex-1 relative md:min-w-[300px]">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Buscar por No. de Parte o Job Order..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-11 pl-12 pr-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#2D5F7E]/30"
                  style={{ backgroundColor: '#F8FAFC', border: '2px solid #E2E8F0', fontFamily: 'var(--font-body)', fontSize: 14, color: '#0F172A' }}
                />
              </div>

              {/* Status filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-11 px-4 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#2D5F7E]/30 cursor-pointer w-full md:w-auto"
                style={{ backgroundColor: '#F8FAFC', border: '2px solid #E2E8F0', fontFamily: 'var(--font-body)', fontSize: 14, color: '#0F172A', fontWeight: 500 }}
              >
                <option value="Todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En Proceso">En Proceso</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Terminado">Terminado</option>
              </select>

              <button
                onClick={handleExport}
                className="h-11 px-5 rounded-xl flex items-center gap-2 transition-all hover:shadow-md hover:scale-[1.02] w-full md:w-auto justify-center"
                style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: 'white', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
              >
                <Download size={16} /> Exportar CSV
              </button>
            </div>
          </div>

          {/* Table content */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  {['No. de Parte','Job Order','Cantidad','Discrepancia','Área','Detalles del Proceso','Tiempo Est.','Tiempo Muerto','Estado','Acciones'].map((h) => (
                    <th key={h} className="px-7 py-4 text-left" style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((rw) => {
                  const statusStyle = getStatusStyle(rw.status);
                  const areaColor   = areaChartData.find((a) => a.name === rw.area)?.color || '#94A3B8';
                  const isUpdating  = updatingRow === rw.id;

                  return (
                    <tr
                      key={rw.id}
                      className="transition-all hover:bg-white/60"
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', opacity: isUpdating ? 0.6 : 1 }}
                    >
                      {/* No. de Parte */}
                      <td className="px-7 py-5">
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                          {rw.partNumber || '--'}
                        </div>
                      </td>

                      {/* Job Order */}
                      <td className="px-7 py-5">
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                          {rw.jobOrder || '--'}
                        </div>
                      </td>

                      {/* Cantidad */}
                      <td className="px-7 py-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                          <Package size={14} style={{ color: '#64748B' }} />
                          <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600, color: '#475569' }}>{rw.quantity}</span>
                        </div>
                      </td>

                      {/* Discrepancia */}
                      <td className="px-7 py-5">
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#475569', maxWidth: 220 }}>
                          {rw.discrepancy || '--'}
                        </div>
                      </td>

                      {/* Área */}
                      <td className="px-7 py-5">
                        {rw.area ? (
                          <div className="inline-block px-3 py-1.5 rounded-lg" style={{ backgroundColor: areaColor + '15', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: areaColor, border: `1px solid ${areaColor}40` }}>
                            {rw.area}
                          </div>
                        ) : (
                          <div className="inline-block px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#FEF3C7', fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, color: '#F59E0B', border: '1px solid #FDE047' }}>
                            Sin asignar
                          </div>
                        )}
                      </td>

                      {/* Detalles del Proceso */}
                      <td className="px-7 py-5">
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: rw.processDetails ? '#475569' : '#94A3B8', fontStyle: rw.processDetails ? 'normal' : 'italic', maxWidth: 200 }}>
                          {rw.processDetails || 'Pendiente de asignar'}
                        </div>
                      </td>

                      {/* Tiempo Estimado */}
                      <td className="px-7 py-5">
                        <div className="flex items-center gap-2">
                          <Clock size={14} style={{ color: '#EF4444' }} />
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: rw.estimatedTime > 0 ? '#EF4444' : '#94A3B8' }}>
                            {rw.estimatedTime > 0 ? `${rw.estimatedTime}h` : '--'}
                          </span>
                        </div>
                      </td>

                      {/* Tiempo Muerto */}
                      <td className="px-7 py-5">
                        <div className="flex flex-col gap-1">
                          {rw.areaAssignedDate && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#64748B' }}>Registro → Área:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#F59E0B' }}>
                                {calculateTimeDiff(rw.registeredDate, rw.areaAssignedDate)}
                              </span>
                            </div>
                          )}
                          {rw.inReviewDate && rw.areaAssignedDate && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#64748B' }}>Área → Revisión:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#3B82F6' }}>
                                {calculateTimeDiff(rw.areaAssignedDate, rw.inReviewDate)}
                              </span>
                            </div>
                          )}
                          {rw.completedDate && rw.inReviewDate && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }} />
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#64748B' }}>Revisión → Completado:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: '#10B981' }}>
                                {calculateTimeDiff(rw.inReviewDate, rw.completedDate)}
                              </span>
                            </div>
                          )}
                          {rw.completedDate && (
                            <div className="flex items-center gap-2 pt-1 mt-1 border-t border-gray-200">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
                              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#EF4444' }}>
                                {calculateTimeDiff(rw.registeredDate, rw.completedDate)}
                              </span>
                            </div>
                          )}
                          {!rw.areaAssignedDate && (
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>En espera</span>
                          )}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-7 py-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600, border: `1px solid ${statusStyle.border}` }}>
                          {rw.status === 'Terminado'   && <CheckCircle size={14} />}
                          {rw.status === 'En Proceso'  && <Clock size={14} />}
                          {rw.status === 'En Revisión' && <Edit size={14} />}
                          {rw.status === 'Pendiente'   && <AlertCircle size={14} />}
                          {rw.status}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-7 py-5">
                        {rw.status !== 'Terminado' ? (
                          <select
                            value={rw.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(rw.id, e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-xs transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                            style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', fontFamily: 'var(--font-body)', fontWeight: 600, color: '#475569', cursor: isUpdating ? 'wait' : 'pointer' }}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="En Proceso">En Proceso</option>
                            <option value="En Revisión">En Revisión</option>
                            <option value="Terminado">Terminado</option>
                          </select>
                        ) : (
                          <div className="px-3 py-1.5 rounded-lg text-xs inline-flex items-center gap-1.5" style={{ backgroundColor: '#ECFDF5', color: '#10B981', fontFamily: 'var(--font-body)', fontWeight: 600, border: '1px solid #A7F3D0' }}>
                            <CheckCircle size={12} /> Completado
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredData.length === 0 && !loading && (
            <div className="py-12 text-center" style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#94A3B8' }}>
              No se encontraron registros con los filtros aplicados
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


