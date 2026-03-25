// frontend/src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import TopBar from "../components/TopBar";
import { TrendingUp, TrendingDown, FileCheck, CheckCircle, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { getDashboardKPIs, getDashboardActivity, exportDashboardReport } from "../api/dashboardRequest";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({
    totalCertificados: 0,
    tasaConformidad: 0,
    noConformidades: 0,
    trends: {
      certificados: '+0%',
      conformidad: '+0%',
      noConformidades: '0'
    }
  });
  const [activityLog, setActivityLog] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Obtener KPIs y actividad en paralelo
      const [kpisData, activityData] = await Promise.all([
        getDashboardKPIs(),
        getDashboardActivity(10)
      ]);
      
      setMetrics({
        totalCertificados: kpisData.totalCertificados,
        tasaConformidad: kpisData.tasaConformidad,
        noConformidades: kpisData.noConformidades,
        trends: kpisData.trends || {
          certificados: '+0%',
          conformidad: '+0%',
          noConformidades: '0'
        }
      });
      setActivityLog(activityData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleExportReport = async () => {
    try {
      await exportDashboardReport();
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Error al exportar el reporte');
    }
  };

  useEffect(() => {
    fetchData();
    
    // Actualizar datos cada 30 segundos
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const kpiMetrics = [
    {
      label: 'Total de Certificados',
      value: metrics.totalCertificados.toString(),
      color: '#3B82F6',
      bgGradient: 'linear-gradient(135deg, #1E3A5F 0%, #2D5F7E 100%)',
      icon: <FileCheck size={24} />,
      trend: metrics.trends.certificados,
      trendPositive: !metrics.trends.certificados.startsWith('-'),
    },
    {
      label: 'Tasa de Conformidad',
      value: `${metrics.tasaConformidad}%`,
      color: '#10B981',
      bgGradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      icon: <CheckCircle size={24} />,
      trend: metrics.trends.conformidad,
      trendPositive: !metrics.trends.conformidad.startsWith('-'),
    },
    {
      label: 'No Conformidades',
      value: metrics.noConformidades.toString(),
      color: '#F97316',
      bgGradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
      icon: <AlertTriangle size={24} />,
      trend: metrics.trends.noConformidades,
      trendPositive: false,
    },
  ];

  if (loading) {
    return (
      <div>
        <TopBar title="Dashboard" breadcrumb={currentDate} />
        <div className="p-8 flex justify-center items-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A5F] mx-auto"></div>
            <p className="mt-4 text-gray-500">Cargando datos del dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #E0E7FF 0%, #F0FDFA 50%, #DBEAFE 100%)',
    }}>
      <TopBar title="Dashboard" breadcrumb={currentDate}>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 px-4 rounded-lg transition-all hover:shadow-lg flex items-center gap-2"
            style={{
              background: 'white',
              color: '#1E3A5F',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '13px',
              border: '1px solid #E2E8F0',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={handleExportReport}
            className="h-9 px-5 rounded-lg transition-all hover:shadow-lg hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5F7E 100%)',
              color: 'white',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Exportar Reporte
          </button>
        </div>
      </TopBar>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
            {error}
            <button 
              onClick={handleRefresh}
              className="ml-3 underline hover:no-underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {kpiMetrics.map((kpi, index) => (
            <div
              key={index}
              className="rounded-2xl overflow-hidden transition-all hover:scale-[1.03] hover:shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.4)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center"
                    style={{
                      background: kpi.bgGradient,
                      color: 'white',
                      boxShadow: `0 8px 24px ${kpi.color}40`,
                    }}
                  >
                    {kpi.icon}
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                    style={{
                      backgroundColor: kpi.trendPositive ? '#ECFDF5' : '#FEF2F2',
                      color: kpi.trendPositive ? '#10B981' : '#EF4444',
                    }}
                  >
                    {kpi.trendPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span className="text-xs font-bold">{kpi.trend}</span>
                  </div>
                </div>
                <div className="font-display font-bold text-[42px] text-slate-900 tracking-[-1px] leading-none mb-2.5">
                  {kpi.value}
                </div>
                <div className="font-body font-semibold text-[13px] text-gray-500 tracking-wide">
                  {kpi.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="rounded-2xl overflow-hidden bg-white/90 backdrop-blur border border-white/40 shadow-lg">
          <div className="px-7 py-5 border-b border-black/10 bg-gradient-to-r from-[#1E3A5F]/5 to-[#2D5F7E]/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-[#1E3A5F] to-[#2D5F7E] text-white flex items-center justify-center shadow-md">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900">Actividad Reciente</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Últimas actualizaciones del sistema</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 text-sm font-semibold text-gray-600 hover:shadow-md transition-all">
                Ver todas
              </button>
            </div>
          </div>

          <div>
            {activityLog.length > 0 ? (
              activityLog.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-5 px-7 py-4 border-b border-black/5 hover:bg-white/60 transition-all"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: `linear-gradient(135deg, ${activity.color}20 0%, ${activity.color}10 100%)`,
                      border: `1px solid ${activity.color}30`,
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activity.color }} />
                  </div>
                  <div className="w-20 flex-shrink-0 font-mono text-xs text-gray-400 font-semibold">
                    {activity.time}
                  </div>
                  <div className="flex-1 text-sm text-slate-800 font-medium">
                    {activity.description}
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${activity.color}20 0%, ${activity.color}10 100%)`,
                      color: activity.color,
                      border: `1px solid ${activity.color}30`,
                    }}
                  >
                    {activity.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                No hay actividad reciente para mostrar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}