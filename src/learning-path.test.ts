import test from 'node:test'
import assert from 'node:assert/strict'

import { buildLearningPathPrompt, extractJsonResponse, validateLearningPath, type LearningPathResponse } from './learning-path.js'

function createLearningPath(materialCount: number): LearningPathResponse {
  return {
    title: 'Plan',
    start_date: '2026-09-10',
    end_date: '2026-09-12',
    learning_frequency: 'daily',
    estimated_total_hours: 2,
    chapters: [{
      topic: 'Intro',
      estimated_learning_time_in_hours: 2,
      planned_start_date: '2026-09-10',
      planned_end_date: '2026-09-12',
      description: 'Starter',
      study_materials: Array.from({ length: materialCount }, (_, index) => ({
        title: `Resource ${index + 1}`,
        link: `https://example.com/${index + 1}`,
        type: 'reference',
      })),
      quiz: Array.from({ length: 10 }, (_, index) => ({
        question: `Question ${index + 1}`,
        options: ['A', 'B'],
        correct_option: 0,
      })),
    }],
  }
}

test('buildLearningPathPrompt fills the template values', () => {
  const prompt = buildLearningPathPrompt({
    objective: 'Blockchain',
    outcome: 'a Blockchain Architect',
    timeframe: 6,
    timeframe_unit: 'months',
    hours_per_day: 2,
    frequency: 'every day',
    start_date: '2026-09-10',
    learning_medium: 'Videos Only',
  })

  assert.match(prompt, /Blockchain/) 
  assert.match(prompt, /a Blockchain Architect/) 
  assert.match(prompt, /6 months/) 
  assert.match(prompt, /2 hours a day/) 
  assert.match(prompt, /starting 2026-09-10/) 
  assert.match(prompt, /Videos Only/) 
  assert.match(prompt, /3 to 10 distinct, valid study materials per chapter/)
})

test('extractJsonResponse strips markdown fences and parses JSON', () => {
  const value = extractJsonResponse(`
    \`\`\`json
    ${JSON.stringify(createLearningPath(3))}
    \`\`\`
  `)

  assert.equal(value.title, 'Plan')
  assert.equal(value.chapters.length, 1)
})

test('validateLearningPath enforces the 3-to-10 study material range', () => {
  assert.doesNotThrow(() => validateLearningPath(createLearningPath(3)))
  assert.doesNotThrow(() => validateLearningPath(createLearningPath(10)))
  assert.throws(() => validateLearningPath(createLearningPath(2)), /between 3 and 10/)
  assert.throws(() => validateLearningPath(createLearningPath(11)), /between 3 and 10/)
})
