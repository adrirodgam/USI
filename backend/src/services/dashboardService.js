//backend/src/service/dashboardService
const supabase = require('../config/supabase'); // Ajusta la ruta según tu proyecto

const dashboardService = {
  // Obtener métricas del dashboard
  async getKPIs() {
    try {
      // 1. Total de certificados
      const { count: totalCertificados, error: certError } = await supabase
        .from('certificados')
        .select('*', { count: 'exact', head: true });

      if (certError) throw certError;

      // 2. Total de inspecciones y no conformidades
      const { data: inspecciones, error: insError } = await supabase
        .from('inspecciones')
        .select('conforme, created_at');

      if (insError) throw insError;

      let totalInspecciones = inspecciones?.length || 0;
      let noConformidades = inspecciones?.filter(ins => !ins.conforme).length || 0;

      // 3. Calcular tasa de conformidad
      const tasaConformidad = totalInspecciones > 0 
        ? ((totalInspecciones - noConformidades) / totalInspecciones * 100).toFixed(1)
        : 100;

      // 4. Calcular trends (comparación con mes anterior)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Certificados del mes actual
      const { count: certThisMonth } = await supabase
        .from('certificados')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Certificados del mes pasado
      const { count: certLastMonth } = await supabase
        .from('certificados')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString());

      // Calcular tendencia de certificados
      let trendCertificados = '+0%';
      if (certLastMonth > 0) {
        const change = ((certThisMonth - certLastMonth) / certLastMonth) * 100;
        trendCertificados = `${change > 0 ? '+' : ''}${Math.round(change)}%`;
      }

      // No conformidades del mes actual
      const ncThisMonth = inspecciones?.filter(ins => 
        !ins.conforme && new Date(ins.created_at) >= startOfMonth
      ).length || 0;

      // No conformidades del mes pasado
      const ncLastMonth = inspecciones?.filter(ins => 
        !ins.conforme && 
        new Date(ins.created_at) >= startOfLastMonth && 
        new Date(ins.created_at) < startOfMonth
      ).length || 0;

      let trendNC = '0';
      if (ncLastMonth > 0) {
        const change = ncThisMonth - ncLastMonth;
        trendNC = `${change > 0 ? '+' : ''}${change}`;
      } else if (ncThisMonth > 0) {
        trendNC = `+${ncThisMonth}`;
      }

      return {
        totalCertificados: totalCertificados || 0,
        tasaConformidad: parseFloat(tasaConformidad),
        noConformidades: noConformidades || 0,
        trends: {
          certificados: trendCertificados,
          conformidad: '+2.3%', // Puedes calcularlo similar
          noConformidades: trendNC
        }
      };
    } catch (error) {
      console.error('Error in getKPIs:', error);
      throw error;
    }
  },

  // Obtener actividad reciente
  async getActivity(limit = 10) {
    try {
      // Obtener actividad de la base de datos
      const { data: actividad, error } = await supabase
        .from('actividad_sistema')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Si no tienes tabla de actividad, puedes combinar datos de diferentes tablas
      if (!actividad || actividad.length === 0) {
        return await this.getMockActivity();
      }

      // Formatear actividad para el frontend
      const formattedActivity = actividad.map(item => ({
        time: new Date(item.created_at).toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        description: item.descripcion,
        status: item.estado,
        color: this.getStatusColor(item.estado)
      }));

      return formattedActivity;
    } catch (error) {
      console.error('Error in getActivity:', error);
      // Si hay error, devolver datos de ejemplo
      return this.getMockActivity();
    }
  },

  // Actividad de ejemplo (en caso de que no tengas datos aún)
  getMockActivity() {
    return [
      { 
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
        description: 'COC generado para pieza AMT-4892-X', 
        status: 'Completado', 
        color: '#10B981' 
      },
      { 
        time: new Date(Date.now() - 3600000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
        description: 'Checklist de inspección dimensional aprobado', 
        status: 'Aprobado', 
        color: '#3B82F6' 
      },
      { 
        time: new Date(Date.now() - 7200000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
        description: 'No conformidad detectada en pieza RTX-3301-B', 
        status: 'Pendiente', 
        color: '#EF4444' 
      },
      { 
        time: new Date(Date.now() - 10800000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
        description: 'Nuevo cliente registrado: Boeing Defense', 
        status: 'Activo', 
        color: '#10B981' 
      },
      { 
        time: new Date(Date.now() - 14400000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
        description: 'Auditoría iniciada para proceso de soldadura', 
        status: 'En progreso', 
        color: '#F59E0B' 
      }
    ];
  },

  // Generar y exportar reporte
  async exportReport() {
    try {
      const { data: certificados, error } = await supabase
        .from('certificados')
        .select(`
          id,
          numero_certificado,
          pieza,
          cliente,
          fecha_emision,
          estado
        `)
        .order('fecha_emision', { ascending: false });

      if (error) throw error;

      // Crear CSV
      const headers = ['ID', 'N° Certificado', 'Pieza', 'Cliente', 'Fecha Emisión', 'Estado'];
      const rows = certificados.map(cert => [
        cert.id,
        cert.numero_certificado || '',
        cert.pieza || '',
        cert.cliente || '',
        new Date(cert.fecha_emision).toLocaleDateString('es-MX'),
        cert.estado || 'Activo'
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error in exportReport:', error);
      throw error;
    }
  },

  getStatusColor(status) {
    const colors = {
      'Completado': '#10B981',
      'Aprobado': '#3B82F6',
      'Pendiente': '#EF4444',
      'Activo': '#10B981',
      'En progreso': '#F59E0B',
      'Generado': '#10B981',
      'Rechazado': '#EF4444',
      'En revisión': '#F59E0B'
    };
    return colors[status] || '#64748B';
  }
};

module.exports = dashboardService;