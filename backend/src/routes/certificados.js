const express = require('express')
const { z } = require('zod')
const supabase = require('../services/supabase')
const generarCertificado = require('../services/certificado')


const router = express.Router()

// POST /api/certificados - Generar certificado
router.post('/', async (req, res) => {
    console.log('Llegó al endpoint')
    try {
        const data = req.body
        const certificadoBuffer = generarCertificado(data)
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename=certificado_${data.customer_name}.docx`
        })
        res.send(certificadoBuffer)
    } catch (err) {
        res.status(500).json({ error: 'Error al generar el certificado' })
    }
})

module.exports = router 
