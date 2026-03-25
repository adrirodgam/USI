// backend/src/routes/dashboard.js
const express = require('express');
const router = express.Router();

// ============================================
// DATOS MOCK - Funciona sin Supabase
// ============================================

const getKPIs = async () => {
  return {
    totalCertificados: 7,
    tasaConformidad: 98.5,
    noConformidades: 2,
    trends: {
      certificados: '+12%',
      conformidad: '+2.3%',
      noConformidades: '-1'
    }
  };
};

const getActivity = async (limit = 10) => {
  const now = new Date();
  return [
    { 
      time: now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
      description: 'COC generado para pieza AMT-4892-X', 
      status: 'Completado', 
      color: '#10B981' 
    },
    { 
      time: new Date(now - 3600000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
      description: 'Checklist de inspección dimensional aprobado', 
      status: 'Aprobado', 
      color: '#3B82F6' 
    },
    { 
      time: new Date(now - 7200000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
      description: 'No conformidad detectada en pieza RTX-3301-B', 
      status: 'Pendiente', 
      color: '#EF4444' 
    },
    { 
      time: new Date(now - 10800000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
      description: 'Nuevo cliente registrado: Boeing Defense', 
      status: 'Activo', 
      color: '#10B981' 
    },
    { 
      time: new Date(now - 14400000).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), 
      description: 'Auditoría iniciada para proceso de soldadura', 
      status: 'En progreso', 
      color: '#F59E0B' 
    }
  ].slice(0, limit);
};

const searchPieces = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }
  
  const term = searchTerm.toLowerCase();
  const mockPieces = [
    { id: '1', code: 'AMT-4892-X', name: 'Pieza de aluminio', client: 'Boeing', status: 'Active' },
    { id: '2', code: 'RTX-3301-B', name: 'Componente de titanio', client: 'Raytheon', status: 'Active' },
    { id: '3', code: 'NAC-7823-A', name: 'Soporte estructural', client: 'Northrop', status: 'Inactive' },
  ];
  
  return mockPieces.filter(piece => 
    piece.code.toLowerCase().includes(term) ||
    piece.name.toLowerCase().includes(term)
  );
};

const getPieceDetails = async (pieceId) => {
  return {
    id: pieceId,
    code: 'AMT-4892-X',
    name: 'Pieza de aluminio',
    client: 'Boeing',
    created_at: new Date().toISOString(),
    status: 'Active',
    certificates: [
      { id: '1', number: 'COC-2024-001', issue_date: new Date().toISOString(), status: 'Approved' }
    ],
    inspections: [
      { id: '1', date: new Date().toISOString(), compliant: true }
    ]
  };
};

const exportReport = async () => {
  const headers = ['ID', 'N° Certificado', 'Pieza', 'Cliente', 'Fecha Emisión', 'Estado'];
  const rows = [
    [1, 'COC-2024-001', 'AMT-4892-X', 'Boeing', new Date().toLocaleDateString('es-MX'), 'Activo'],
    [2, 'COC-2024-002', 'RTX-3301-B', 'Raytheon', new Date().toLocaleDateString('es-MX'), 'Activo'],
  ];
  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

// ============================================
// MIDDLEWARE
// ============================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // Para pruebas, aceptamos cualquier token
  req.user = { id: 1, name: 'Test User' };
  next();
};

// ============================================
// RUTAS
// ============================================

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Dashboard router is working!' });
});

router.get('/kpis', authenticateToken, async (req, res) => {
  try {
    const data = await getKPIs();
    res.json(data);
  } catch (error) {
    console.error('Error in /kpis:', error);
    res.status(500).json({ error: 'Error al obtener métricas' });
  }
});

router.get('/activity', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await getActivity(limit);
    res.json(data);
  } catch (error) {
    console.error('Error in /activity:', error);
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
});

router.get('/search-pieces', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const data = await searchPieces(q);
    res.json(data);
  } catch (error) {
    console.error('Error in /search-pieces:', error);
    res.status(500).json({ error: 'Error al buscar piezas' });
  }
});

router.get('/piece/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getPieceDetails(id);
    res.json(data);
  } catch (error) {
    console.error('Error in /piece/:id:', error);
    res.status(500).json({ error: 'Error al obtener detalles' });
  }
});

router.get('/export', authenticateToken, async (req, res) => {
  try {
    const csvContent = await exportReport();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=reporte_${new Date().toISOString()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error in /export:', error);
    res.status(500).json({ error: 'Error al exportar reporte' });
  }
});

module.exports = router;