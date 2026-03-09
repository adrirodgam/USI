const express = require('express');
const { z } = require('zod');
const supabase = require('../services/supabase');
const generarCertificado = require('../services/certificado');

const router = express.Router();

// POST /api/certificados - Generar certificado
router.post('/', async (req, res) => {
    console.log('Iniciando generación de certificado...');

    try {
        const data = req.body;

        
        const { data: firmaData, error } = await supabase
            .from('usuarios')
            .select('firma_url')
            .eq('nombre', data.inspector)
            .single();

        if (error || !firmaData) {
            console.error('Error al buscar inspector:', error);
            return res.status(404).json({ error: 'Inspector no encontrado en la base de datos' });
        }

       
        data.firma_url = firmaData.firma_url;

     
        const certificadoBuffer = await generarCertificado(data);

  
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename=certificado_${data.customer_name}.docx`
        });

        return res.send(certificadoBuffer);

    } catch (err) {
        console.error('Error en el proceso:', err);
        return res.status(500).json({ error: 'Error interno al generar el certificado' });
    }
});

module.exports = router;