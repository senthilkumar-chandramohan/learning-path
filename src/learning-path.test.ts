import test from 'node:test'
import assert from 'node:assert/strict'

import { buildLearningPathPrompt, extractJsonResponse } from './learning-path.js'

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
})

test('extractJsonResponse strips markdown fences and parses JSON', () => {
  const value = extractJsonResponse('```json\n{ "title": "Plan", "chapters": [{ "topic": "Intro", "estimated_learning_time_in_hours": 2, "planned_start_date": "2026-09-10", "planned_end_date": "2026-09-12", "description": "Starter", "study_materials": [{ "title": "Docs", "link": "https://example.com", "type": "reference" }, { "title": "More Docs", "link": "https://example.org", "type": "reference" }], "quiz": [{ "question": "What is 2+2?", "options": ["3", "4"], "correct_option": 1 }, { "question": "What is 4+4?", "options": ["8", "9"], "correct_option": 0 }, { "question": "True or False: 2 + 2 = 4", "options": ["True", "False"], "correct_option": 0 }, { "question": "What is 5+5?", "options": ["10", "11"], "correct_option": 0 }, { "question": "What is 1+1?", "options": ["2", "3"], "correct_option": 0 }, { "question": "True or False: 3 + 3 = 6", "options": ["True", "False"], "correct_option": 0 }, { "question": "What is 6+6?", "options": ["12", "13"], "correct_option": 0 }, { "question": "What is 7+7?", "options": ["14", "15"], "correct_option": 0 }, { "question": "True or False: 9 + 1 = 10", "options": ["True", "False"], "correct_option": 0 }, { "question": "What is 8+8?", "options": ["16", "17"], "correct_option": 0 }] }] }\n```')

  assert.equal(value.title, 'Plan')
  assert.equal(value.chapters.length, 1)
})
