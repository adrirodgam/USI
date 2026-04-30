const express = require('express');
const { z } = require('zod');
const supabase = require('../services/supabase');
const generateCertificate = require('../services/certificate');
const { saveCertificate } = require('../services/smartsheet');

const router = express.Router();

// POST /api/certificates - Generate certificate
router.post('/', async (req, res) => {
    console.log('Starting certificate generation...');

    try {
        const data = req.body;

        // Fetch inspector signature from the 'users' table
        const { data: signatureData, error } = await supabase
            .from('users')
            .select('signature_url')
            .eq('employee_id', data.employee_id)
            .single();

        // Validate if there is a DB error, missing user, null signature, or 'EMPTY' signature
        if (
            error || 
            !signatureData || 
            !signatureData.signature_url || 
            signatureData.signature_url === 'EMPTY'
        ) {
            console.error('Error finding inspector:', error);
            return res.status(400).json({ error: 'No tienes una firma registrada. Contacta a Soporte.' });
        }

        data.signature_url = signatureData.signature_url;
        console.log('Signature URL found:', signatureData.signature_url);

        const certificateBuffer = await generateCertificate(data);

        // Save to Smartsheet
        const smartsheetResult = await saveCertificate(
            {
                inspector: data.inspector,
                partNo: data.part_number,
                drawingNo: data.drawing_no,
                cliente: data.customer_name,
                
            },
            certificateBuffer,
            `COC_${data.part_number}.docx`
        );
        console.log('Saved to Smartsheet:', smartsheetResult);

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename=certificate_${data.customer_name}.docx`
        });

        return res.send(certificateBuffer);

    } catch (err) {
        console.error('Error in process:', err);
        return res.status(500).json({ error: 'Internal error while generating certificate' });
    }
});

module.exports = router;