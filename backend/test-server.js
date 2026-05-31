const express = require('express')
const app = express()

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', from: 'test-server' })
})

app.listen(3001, () => {
  console.log('Test server running on 3001')
})
