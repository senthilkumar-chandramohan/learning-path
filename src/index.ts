import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { generateLearningPath } from './learning-path.js'

const app = express()
const port = Number(process.env.PORT) || 3000

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', service: 'learning-path-api' })
})

app.post('/api/learning-path', async (request, response) => {
  try {
    const payload = request.body ?? {}
    const learningPath = await generateLearningPath({
      objective: String(payload.objective ?? ''),
      outcome: String(payload.outcome ?? ''),
      timeframe: Number(payload.timeframe ?? 0),
      timeframe_unit: String(payload.timeframe_unit ?? ''),
      hours_per_day: Number(payload.hours_per_day ?? 0),
      frequency: String(payload.frequency ?? ''),
      start_date: String(payload.start_date ?? ''),
      learning_medium: String(payload.learning_medium ?? ''),
    })

    response.json(learningPath)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate the learning path.'
    response.status(500).json({ error: message })
  }
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
