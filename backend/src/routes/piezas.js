const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const verificarToken = require('../middleware/auth');

// GET /api/piezas/:clienteId - Obtener piezas por cliente
router.get('/:clienteId', verificarToken, async (req, res) => {
    const { clienteId } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('piezas')
            .select('*')
            .eq('cliente_id', clienteId);   

        if (error) return res.status(400).json({ error: error.message });

        res.json(data);
        } catch (err) {
            res.status(500).json({ error: 'Error en el servidor' });
        }
    });
    
    module.exports = router;