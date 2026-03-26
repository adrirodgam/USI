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
            .eq('name', data.inspector)
            .single();

        if (error || !signatureData) {
            console.error('Error finding inspector:', error);
            return res.status(404).json({ error: 'Inspector not found in database' });
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