const express = require('express')
const cors = require('cors') 
const app = express()

// Route imports
const customersRouter = require('./routes/customers')
const authRoutes = require('./routes/auth')
const piecesRoutes = require('./routes/pieces')
const certificatesRoutes = require('./routes/certificates')
const usersRoutes = require('./routes/users')
const checklistsRoutes = require('./routes/checklists')

app.use(cors()) 
app.use(express.json())

// API Route registration
app.use('/api/customers', customersRouter)
app.use('/api/auth', authRoutes)
app.use('/api/pieces', piecesRoutes)
app.use('/api/certificates', certificatesRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/checklists', checklistsRoutes)

console.log('Certificates registered')

app.get('/', (req, res) => {
  res.send('USI backend running')
})

console.log('Routes registered')

app.listen(3000, () => {
  console.log('Server running on port 3000')
})