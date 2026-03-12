const express = require('express')
const router = express.Router()
const supabase = require('../services/supabase')

router.get('/', async (req, res) => {
  console.log('Attempting to fetch customers...')
  const { data, error } = await supabase
    .from('customers')
    .select('*')
  if (error) {
    console.error('Supabase error:', error)
    res.status(500).json({ error: error.message })
  } else {
    console.log('Data fetched:', data)
    res.json(data)
  }
})

module.exports = router