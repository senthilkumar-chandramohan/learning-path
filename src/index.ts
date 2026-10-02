import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import cors from 'cors'
import express from 'express'
import { extractJsonResponse, streamLearningPathText, type LearningPathResponse } from './learning-path.js'

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

const learningPathRequests = new Map<string, LearningPathResponse | null>()
const learningPathErrors = new Map<string, string>()
const learningPathRequestCreatedAt = new Map<string, number>()
const requestRetentionMs = 30 * 60 * 1000

function removeExpiredRequests() {
  const expirationTime = Date.now() - requestRetentionMs

  for (const [requestId, createdAt] of learningPathRequestCreatedAt) {
    if (createdAt < expirationTime) {
      learningPathRequests.delete(requestId)
      learningPathErrors.delete(requestId)
      learningPathRequestCreatedAt.delete(requestId)
    }
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'learning-path-api' })
})

app.post('/api/learning-path', (request, response) => {
  removeExpiredRequests()
  const requestId = randomUUID()
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

  learningPathRequests.set(requestId, null)
  learningPathRequestCreatedAt.set(requestId, Date.now())
  response.status(200).json({ requestId })

  void (async () => {
    try {
      let rawContent = ''
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
        rawContent += chunk
      }

      learningPathRequests.set(requestId, extractJsonResponse(rawContent))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to generate the learning path.'
      learningPathErrors.set(requestId, message)
    }
  })()
})

app.get('/api/learning-path/:requestId', (request, response) => {
  removeExpiredRequests()
  const { requestId } = request.params

  if (!learningPathRequests.has(requestId)) {
    response.status(404).json({ status: 'not_found', error: 'Learning path request was not found or has expired.' })
    return
  }

  const error = learningPathErrors.get(requestId)
  if (error) {
    learningPathRequests.delete(requestId)
    learningPathErrors.delete(requestId)
    learningPathRequestCreatedAt.delete(requestId)
    response.status(500).json({ status: 'error', error })
    return
  }

  const result = learningPathRequests.get(requestId)
  if (result === null) {
    response.json({ status: 'pending' })
    return
  }

  learningPathRequests.delete(requestId)
  learningPathRequestCreatedAt.delete(requestId)
  response.json({ status: 'complete', result })
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
