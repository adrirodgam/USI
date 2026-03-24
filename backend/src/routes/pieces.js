// backend/routes/pieces.js
const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const verifyToken = require('../middleware/auth.middleware');

// GET /api/pieces/:clientId - Get pieces by client
router.get('/:clientId', verifyToken, async (req, res) => {
    const { clientId } = req.params;
    
    try {
        const { data, error } = await supabase
            .from('pieces')
            .select('*, customers(name)')
            .eq('customer_id', clientId);   

        if (error) return res.status(400).json({ error: error.message });

        res.json(data);
    } catch (err) {
        console.error('Error en GET pieces:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/pieces/ - Create new piece
router.post('/', verifyToken, async (req, res) => {
    const { part_number, drawing_no, revision, customer_id, default_comments } = req.body;
    
    console.log('Recibida solicitud POST en /api/pieces:', req.body); // Debug

    // Validación básica
    if (!part_number || !drawing_no || !revision || !customer_id) {
        return res.status(400).json({ 
            error: 'Faltan campos requeridos: part_number, drawing_no, revision, customer_id son obligatorios' 
        });
    }

    try {
        const { data, error } = await supabase
            .from('pieces')
            .insert([{ 
                part_number, 
                drawing_no, 
                revision, 
                customer_id, 
                default_comments: default_comments || null 
            }])
            .select()
            .single();
            
        if (error) {
            console.error('Error de Supabase:', error);
            return res.status(400).json({ error: error.message });
        }

        console.log('Pieza creada exitosamente:', data);
        res.status(201).json(data);
    } catch (err) {
        console.error('Error en servidor:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

module.exports = router;