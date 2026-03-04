const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/clientes', async (req, res) => {
  console.log('Intentando obtener clientes...')
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
  if (error) {
    console.error('Error de Supabase:', error)
    res.status(500).json({ error: error.message })
  } else {
    console.log('Datos obtenidos:', data)
    res.json(data)
  }
})

module.exports = router
