const express = require('express')
const cors = require('cors') 
const app = express()

const clientesRouter = require('./routes/clientes')
const authRoutes = require('./routes/auth')
const piezasRoutes = require('./routes/piezas');
const certificadosRoutes = require('./routes/certificados');

app.use(cors()) 
app.use(express.json())

app.use('/api/clientes', clientesRouter)
app.use('/api/auth', authRoutes)
app.use('/api/piezas', piezasRoutes);
app.use('/api/certificados', certificadosRoutes);

console.log('Certificados registrado')

app.get('/', (req, res) => {
  res.send('USI backend funcionando')
})

console.log('Rutas registradas')

app.listen(3000, () => {
  console.log('Servidor corriendo en puerto 3000')
})