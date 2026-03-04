const express = require('express')
const app = express()
const clientesRouter = require('./routes/clientes')
const authRoutes = require('./routes/auth')


app.use(express.json())
app.use('/api/clientes', clientesRouter)
app.use('/api/auth', authRoutes)

app.get('/', (req, res) => {
  res.send('USI backend funcionando')
})

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000')
})


