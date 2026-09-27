import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { streamLearningPathText } from './learning-path.js'

const app = express()
const port = Number(process.env.PORT) || 3000

const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`Origin ${origin} not allowed by CORS.`))
  },
  credentials: true,
}))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'learning-path-api' })
})

app.post('/api/learning-path', (request, response) => {
  const {
    objective = '',
    outcome = '',
    timeframe = 0,
    timeframe_unit = '',
    hours_per_day = 0,
    frequency = '',
    start_date = '',
    learning_medium = '',
  } = request.body ?? {}

  response.status(200)
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-cache')
  response.setHeader('Connection', 'keep-alive')
  if (typeof response.flushHeaders === 'function') {
    response.flushHeaders()
  }

  void (async () => {
    try {
      for await (const chunk of streamLearningPathText({
        objective: String(objective),
        outcome: String(outcome),
        timeframe: Number(timeframe),
        timeframe_unit: String(timeframe_unit),
        hours_per_day: Number(hours_per_day),
        frequency: String(frequency),
        start_date: String(start_date),
        learning_medium: String(learning_medium),
      })) {
        response.write(chunk)
      }

      response.end()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate the learning path.'
      if (!response.headersSent) {
        response.status(500)
      }
      response.write(JSON.stringify({ error: message }))
      response.end()
    }
  })()
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
