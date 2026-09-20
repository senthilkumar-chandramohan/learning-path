import { FormEvent, type CSSProperties, useEffect, useRef, useState } from 'react'

type TopicProgress = {
  id: string
  title: string
  link: string
  type: string
  completed: boolean
}

type Plan = {
  id: number
  objective: string
  outcome: string
  timeframe: string
  hours: string
  cadence: string
  startDate: string
  progress: number
  color: string
  modules: string[]
  chapters?: ChapterProgress[]
}

type StudyMaterial = {
  title: string
  link: string
  type: string
}

type QuizQuestion = {
  question: string
  options: string[]
  correct_option: number
}

type QuizResult = {
  correct: number
  total: number
  percentage: number
}

type Chapter = {
  topic: string
  estimated_learning_time_in_hours: number
  planned_start_date: string
  planned_end_date: string
  description: string
  study_materials: StudyMaterial[]
  quiz?: QuizQuestion[]
}

type ChapterProgress = Chapter & {
  id: string
  topics: TopicProgress[]
  quiz: QuizQuestion[]
}

type LearningPathResponse = {
  title: string
  start_date: string
  end_date: string
  learning_frequency: string
  estimated_total_hours: number
  chapters: Chapter[]
}

const STORAGE_KEY = 'learning-paths-v1'
const QUIZ_STORAGE_KEY = 'learning-path-quiz-state-v1'

function formatRouteIndex(index: number) {
  return index < 9 ? `0${index + 1}` : `${index + 1}`
}

function getStoredQuizState() {
  if (typeof window === 'undefined') {
    return { answers: {} as Record<string, Record<number, number>>, results: {} as Record<string, QuizResult> }
  }

  try {
    const storedQuiz = window.localStorage.getItem(QUIZ_STORAGE_KEY)
    if (!storedQuiz) {
      return { answers: {} as Record<string, Record<number, number>>, results: {} as Record<string, QuizResult> }
    }

    const parsedQuiz = JSON.parse(storedQuiz)
    return {
      answers: parsedQuiz?.answers ?? {},
      results: parsedQuiz?.results ?? {},
    }
  } catch {
    return { answers: {} as Record<string, Record<number, number>>, results: {} as Record<string, QuizResult> }
  }
}

function getStoredPlans(): Plan[] {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const storedPlans = window.localStorage.getItem(STORAGE_KEY)
    if (!storedPlans) {
      return []
    }

    const parsedPlans = JSON.parse(storedPlans)
    if (!Array.isArray(parsedPlans)) {
      return []
    }

    return parsedPlans.map((plan) => ({
      ...plan,
      chapters: Array.isArray(plan.chapters)
        ? plan.chapters.map((chapter: ChapterProgress, chapterIndex: number) => ({
            ...chapter,
            id: chapter.id ?? `${plan.id}-chapter-${chapterIndex}`,
            topics: Array.isArray(chapter.topics) && chapter.topics.length > 0
              ? chapter.topics.map((topic: TopicProgress, topicIndex: number) => ({
                  ...topic,
                  id: topic.id ?? `${plan.id}-topic-${chapterIndex}-${topicIndex}`,
                  title: topic.title ?? chapter.study_materials?.[topicIndex]?.title ?? '',
                  link: topic.link ?? chapter.study_materials?.[topicIndex]?.link ?? '#',
                  type: topic.type ?? chapter.study_materials?.[topicIndex]?.type ?? 'reference',
                  completed: Boolean(topic.completed),
                }))
              : (chapter.study_materials ?? []).map((material: StudyMaterial, topicIndex: number) => ({
                  id: `${plan.id}-topic-${chapterIndex}-${topicIndex}`,
                  title: material.title,
                  link: material.link,
                  type: material.type,
                  completed: false,
                })),
            quiz: Array.isArray(chapter.quiz) ? chapter.quiz.map((question: QuizQuestion, questionIndex: number) => ({
              ...question,
              question: question.question ?? `Question ${questionIndex + 1}`,
              options: Array.isArray(question.options) ? question.options : ['True', 'False'],
              correct_option: typeof question.correct_option === 'number' ? question.correct_option : 0,
            })) : [],
          }))
        : [],
    }))
  } catch {
    return []
  }
}

function computePlanProgress(chapters: ChapterProgress[] = []): number {
  const totalTopics = chapters.reduce((total, chapter) => total + (chapter.topics?.length ?? chapter.study_materials.length), 0)
  if (totalTopics === 0) {
    return 0
  }

  const completedTopics = chapters.reduce((total, chapter) => total + (chapter.topics?.filter((topic) => topic.completed).length ?? 0), 0)
  return Math.round((completedTopics / totalTopics) * 100)
}

function buildPlanTopics(chapter: Chapter, planId: number, chapterIndex: number): TopicProgress[] {
  return chapter.study_materials.map((material, materialIndex) => ({
    id: `${planId}-topic-${chapterIndex}-${materialIndex}`,
    title: material.title,
    link: material.link,
    type: material.type,
    completed: false,
  }))
}

function App() {
  const [plans, setPlans] = useState<Plan[]>(() => getStoredPlans())
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [darkMode, setDarkMode] = useState(true)
  const [objective, setObjective] = useState('Blockchain')
  const [outcome, setOutcome] = useState('a Blockchain Architect')
  const [timeframe, setTimeframe] = useState('6')
  const [unit, setUnit] = useState('months')
  const [hours, setHours] = useState('2')
  const [cadence, setCadence] = useState('every day')
  const [startDate, setStartDate] = useState('')
  const [expandedChapter, setExpandedChapter] = useState(0)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [apiError, setApiError] = useState('')
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false)
  const [contentPreference, setContentPreference] = useState('Videos and readable materials')
  const [quizModalChapterId, setQuizModalChapterId] = useState<string | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<number, number>>>(() => getStoredQuizState().answers)
  const [quizResults, setQuizResults] = useState<Record<string, QuizResult>>(() => getStoredQuizState().results)
  const [quizError, setQuizError] = useState('')
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const savedPreference = window.localStorage.getItem('learning-path-content-preference')
    if (savedPreference) {
      setContentPreference(savedPreference)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem('learning-path-content-preference', contentPreference)
  }, [contentPreference])

  useEffect(() => {
    if (plans.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plans))
  }, [plans])

  useEffect(() => {
    window.localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify({ answers: quizAnswers, results: quizResults }))
  }, [quizAnswers, quizResults])

  function openDatePicker() {
    const input = dateInputRef.current
    if (!input) return

    input.showPicker()
  }

  function parseStreamedLearningPath(raw: string): LearningPathResponse {
    const candidate = raw.trim()
    const fencedMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    const sanitized = fencedMatch ? fencedMatch[1].trim() : candidate
    const startIndex = sanitized.indexOf('{')
    const endIndex = sanitized.lastIndexOf('}')

    if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
      throw new Error('Unable to parse the streamed learning path response.')
    }

    const jsonText = sanitized.slice(startIndex, endIndex + 1)
    return JSON.parse(jsonText) as LearningPathResponse
  }

  async function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreatingPlan(true)
    setApiError('')

    try {
      const response = await fetch('/api/learning-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective,
          outcome,
          timeframe: Number(timeframe),
          timeframe_unit: unit,
          hours_per_day: Number(hours),
          frequency: cadence,
          start_date: startDate || new Date().toISOString().slice(0, 10),
          learning_medium: contentPreference,
        }),
      })

      if (!response.ok) throw new Error('Unable to chart this path')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Streaming response is not available.')

      const decoder = new TextDecoder()
      let streamedText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        streamedText += decoder.decode(value, { stream: true })
      }

      streamedText += decoder.decode()

      const learningPath = parseStreamedLearningPath(streamedText)
      const nextId = Number(String(Date.now()).slice(-6))
      const tileColors = ['coral', 'lime', 'blue', 'violet']
      const chapters = learningPath.chapters.map((chapter, chapterIndex) => ({
        ...chapter,
        id: `${nextId}-chapter-${chapterIndex}`,
        topics: buildPlanTopics(chapter, nextId, chapterIndex),
        quiz: chapter.quiz ?? [],
      }))
      const newPlan: Plan = {
        id: nextId,
        objective: objective || 'New objective',
        outcome: outcome || 'a new skill',
        timeframe: `${timeframe} ${unit}`,
        hours: `${hours} hrs / day`,
        cadence: cadence.replace(/^./, (letter) => letter.toUpperCase()),
        startDate: startDate || 'Today',
        progress: 0,
        color: tileColors[plans.length % tileColors.length],
        modules: learningPath.chapters.map((chapter) => chapter.topic),
        chapters,
      }
      setPlans((currentPlans) => [newPlan, ...currentPlans])
      setExpandedChapter(0)
      setPlanSelection(newPlan)
    } catch {
      setApiError('We could not chart that path. Check that the API is running and try again.')
    } finally {
      setIsCreatingPlan(false)
    }
  }

  function formatDateLabel(value: string | Date) {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value.toString()
    }

    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
  }

  function addMonthsToDate(date: Date, months: number) {
    const nextDate = new Date(date)
    nextDate.setMonth(nextDate.getMonth() + months)
    return nextDate
  }

  function getEstimatedEndDate(plan: Plan) {
    const timeframeMatch = plan.timeframe.match(/(\d+)/)
    const monthCount = timeframeMatch ? Number(timeframeMatch[1]) : 0
    const startValue = plan.startDate === 'Today' ? new Date() : new Date(plan.startDate)

    if (!Number.isFinite(monthCount) || Number.isNaN(startValue.getTime())) {
      return '—'
    }

    return formatDateLabel(addMonthsToDate(startValue, monthCount))
  }

  function setPlanSelection(plan: Plan | null) {
    setSelectedPlan(plan)

    const nextUrl = new URL(window.location.href)
    if (plan) {
      nextUrl.searchParams.set('path', String(plan.id))
    } else {
      nextUrl.searchParams.delete('path')
    }

    window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}`)
  }

  function deletePlan(planId: number) {
    const plan = plans.find((item) => item.id === planId)
    if (!plan) {
      return
    }

    const confirmed = window.confirm(`Delete the learning path for ${plan.objective}? This action cannot be undone.`)
    if (!confirmed) {
      return
    }

    setPlans((currentPlans) => currentPlans.filter((item) => item.id !== planId))

    if (selectedPlan?.id === planId) {
      setSelectedPlan(null)
      const nextUrl = new URL(window.location.href)
      nextUrl.searchParams.delete('path')
      window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}`)
    }
  }

  useEffect(() => {
    const syncSelectedPlanFromUrl = () => {
      const planId = new URLSearchParams(window.location.search).get('path')
      if (!planId) {
        setSelectedPlan(null)
        return
      }

      const plan = plans.find((item) => item.id === Number(planId)) ?? null
      setSelectedPlan(plan)
    }

    syncSelectedPlanFromUrl()
    window.addEventListener('popstate', syncSelectedPlanFromUrl)

    return () => {
      window.removeEventListener('popstate', syncSelectedPlanFromUrl)
    }
  }, [plans])

  function toggleMaterial(chapterIndex: number, materialIndex: number) {
    if (!selectedPlan) {
      return
    }

    setPlans((currentPlans) => {
      const nextPlans = currentPlans.map((plan) => {
        if (plan.id !== selectedPlan.id) {
          return plan
        }

        const nextChapters = (plan.chapters ?? []).map((chapter, chapterPosition) => {
          if (chapterPosition !== chapterIndex) {
            return chapter
          }

          const nextTopics = (chapter.topics ?? []).map((topic, topicPosition) => topicPosition === materialIndex
            ? { ...topic, completed: !topic.completed }
            : topic)

          return { ...chapter, topics: nextTopics }
        })

        const updatedPlan = {
          ...plan,
          chapters: nextChapters,
          progress: computePlanProgress(nextChapters),
        }

        return updatedPlan
      })

      const updatedSelected = nextPlans.find((plan) => plan.id === selectedPlan.id) ?? null
      setSelectedPlan(updatedSelected)
      return nextPlans
    })
  }

  function openQuiz(chapterId: string) {
    setQuizModalChapterId(chapterId)
    setQuizError('')
    if (quizResults[chapterId]) {
      setQuizAnswers((current) => ({
        ...current,
        [chapterId]: current[chapterId] ?? {},
      }))
    }
  }

  function submitQuiz() {
    if (!selectedPlan || !quizModalChapterId) {
      return
    }

    if (quizResults[quizModalChapterId]) {
      return
    }

    const chapter = selectedPlan.chapters?.find((item) => item.id === quizModalChapterId)
    if (!chapter) {
      return
    }

    const answers = quizAnswers[quizModalChapterId] ?? {}
    const unansweredQuestions = chapter.quiz.filter((_question, index) => typeof answers[index] !== 'number')

    if (unansweredQuestions.length > 0) {
      setQuizError('Please answer every question before submitting.')
      return
    }

    const correctCount = chapter.quiz.reduce((total, question, index) => total + (answers[index] === question.correct_option ? 1 : 0), 0)
    const nextResult: QuizResult = {
      correct: correctCount,
      total: chapter.quiz.length,
      percentage: Math.round((correctCount / chapter.quiz.length) * 100),
    }

    setQuizResults((current) => ({ ...current, [quizModalChapterId]: nextResult }))
    setQuizError('')
  }

  const quizModalChapter = selectedPlan && quizModalChapterId
    ? selectedPlan.chapters?.find((item: ChapterProgress) => item.id === quizModalChapterId)
    : undefined

  if (selectedPlan) {
    const chapters = selectedPlan.chapters ?? []
    const chapterComplete = (chapter: ChapterProgress) => chapter.topics.length > 0 && chapter.topics.every((topic) => topic.completed)
    const completedCount = chapters.reduce((total, chapter) => total + chapter.topics.filter((topic) => topic.completed).length, 0)
    const materialCount = chapters.reduce((total, chapter) => total + chapter.topics.length, 0)
    const progress = materialCount ? Math.round((completedCount / materialCount) * 100) : selectedPlan.progress
    const focusIndex = chapters.findIndex((chapter) => !chapterComplete(chapter))

    return (
      <main className={`app-shell ${darkMode ? 'theme-dark' : ''}`}>
        <nav className="topbar detail-topbar">
          <button className="wordmark" onClick={() => setPlanSelection(null)}>LEARNING<span>/</span>PATH</button>
          <div className="topbar-actions">
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
              {darkMode ? 'LIGHT' : 'DARK'}
            </button>
          </div>
        </nav>
        {quizModalChapter && (() => {
          const chapter = quizModalChapter
          if (!Array.isArray(chapter.quiz) || chapter.quiz.length === 0) {
            return null
          }

          const chapterResult = quizResults[chapter.id]
          const answers = quizAnswers[chapter.id] ?? {}

          return (
            <div className="modal-overlay" onClick={() => setQuizModalChapterId(null)}>
              <div className="quiz-modal" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="modal-close" onClick={() => setQuizModalChapterId(null)} aria-label="Close quiz">×</button>
                <p className="section-marker">CHAPTER QUIZ</p>
                <h3>{chapter.topic}</h3>
                {!chapterResult ? (
                  <>
                    <div className="quiz-questions">
                      {chapter.quiz.map((question: QuizQuestion, questionIndex: number) => (
                        <div className="quiz-question" key={`${chapter.id}-${questionIndex}`}>
                          <p>{question.question}</p>
                          <div className="quiz-options">
                            {question.options.map((option: string, optionIndex: number) => (
                              <label className="quiz-option" key={`${question.question}-${optionIndex}`}>
                                <input
                                  type="radio"
                                  name={`${chapter.id}-${questionIndex}`}
                                  checked={answers[questionIndex] === optionIndex}
                                  onChange={() => {
                                    setQuizAnswers((current) => ({
                                      ...current,
                                      [chapter.id]: {
                                        ...(current[chapter.id] ?? {}),
                                        [questionIndex]: optionIndex,
                                      },
                                    }))
                                    setQuizError('')
                                  }}
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    {quizError && <p className="quiz-error">{quizError}</p>}
                    <button className="primary-button create-button" type="button" onClick={submitQuiz}>Submit answers</button>
                  </>
                ) : (
                  <div className="quiz-results">
                    <p className="quiz-score-label">You scored</p>
                    <div className="quiz-score-ring" style={{ '--score': `${chapterResult.percentage}%`, '--ring-color': '#2fbf71' } as CSSProperties}>
                      <strong>{chapterResult.percentage}%</strong>
                    </div>
                    <div className="quiz-results-list">
                      {chapter.quiz.map((question: QuizQuestion, questionIndex: number) => {
                        const selectedIndex = answers[questionIndex]
                        const isCorrect = selectedIndex === question.correct_option

                        return (
                          <div className="quiz-question result-question" key={`${chapter.id}-result-${questionIndex}`}>
                            <p>{question.question}</p>
                            <div className="quiz-options">
                              {question.options.map((option: string, optionIndex: number) => {
                                const isSelected = selectedIndex === optionIndex
                                const isCorrectOption = optionIndex === question.correct_option
                                const optionClassNames = ['quiz-option']

                                if (isCorrectOption) optionClassNames.push('is-correct')
                                if (isSelected && !isCorrect) optionClassNames.push('is-selected-wrong')
                                if (isSelected && isCorrect) optionClassNames.push('is-selected-correct')

                                return (
                                  <label key={`${question.question}-${optionIndex}`} className={optionClassNames.join(' ')}>
                                    <input type="radio" checked={isSelected} readOnly />
                                    <span>{option}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p>You scored {chapterResult.correct} out of {chapterResult.total}.</p>
                    <button className="primary-button create-button" type="button" onClick={() => setQuizModalChapterId(null)}>Close</button>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
        <section className="detail-screen">
          <div className="detail-toolbar">
            <button className="back-link" onClick={() => setPlanSelection(null)}>← All paths</button>
          </div>
          <div className="detail-heading">
            <div>
              <h1>Become <em>{selectedPlan.outcome.replace(/^a /, '')}</em>.</h1>
              <p className="detail-subtitle">Your {selectedPlan.timeframe} route to learning {selectedPlan.objective}.</p>
            </div>
            <div className="detail-summary">
              <div className={`progress-ring ${selectedPlan.color}`} style={{ '--progress': `${progress * 3.6}deg` } as CSSProperties}>
                <strong>{progress}%</strong><span>complete</span>
              </div>
              <aside className="detail-aside">
                <div className="stat-block"><span>COMMITMENT</span><strong>{selectedPlan.hours}</strong><small>{selectedPlan.cadence}</small></div>
                <div className="stat-block">
                  <span>START DATE</span>
                  <strong>{selectedPlan.startDate === 'Today' ? formatDateLabel(new Date()) : formatDateLabel(selectedPlan.startDate)}</strong>
                </div>
                <div className="stat-block">
                  <span>ESTIMATED END DATE</span>
                  <strong>{getEstimatedEndDate(selectedPlan)}</strong>
                  <button className="delete-path-button" type="button" onClick={() => deletePlan(selectedPlan.id)}>Delete Path</button>
                </div>
              </aside>
            </div>
          </div>
          <div className="detail-grid">
            <div className="path-map">
              <div className="map-label">THE ROUTE</div>
              <div className="route-line" />
              {chapters.length === 0 && selectedPlan.modules.map((module, index) => (
                <div className={`module ${index === 0 && selectedPlan.progress > 0 ? 'module-done' : ''}`} key={module}>
                  <span className="module-index">{formatRouteIndex(index)}</span>
                  <div><strong>{module}</strong><small>{` (${ (index + 1) * 3 } weeks)`}</small></div>
                </div>
              ))}
              {chapters.map((chapter, chapterIndex) => {
                const isComplete = chapterComplete(chapter)
                const isFocused = chapterIndex === focusIndex
                const isExpanded = expandedChapter === chapterIndex
                return (
                  <div className={`chapter-stop ${isComplete ? 'chapter-complete' : ''} ${isFocused ? 'chapter-focused' : ''}`} key={chapter.topic}>
                    <button className="module chapter-toggle" onClick={() => setExpandedChapter(isExpanded ? -1 : chapterIndex)} aria-expanded={isExpanded}>
                      <span className="module-index">{isComplete ? '✓' : formatRouteIndex(chapterIndex)}</span>
                      <div className="chapter-title"><strong>{chapter.topic}</strong><small>{isComplete ? ' (Completed)' : ` (${chapter.estimated_learning_time_in_hours} hours)`}</small></div>
                      <span className="chapter-chevron">{isExpanded ? '−' : '+'}</span>
                    </button>
                    {isExpanded && <div className="materials-panel">
                      <p>{chapter.description}</p>
                      <div className="materials-list">
                        {chapter.topics.map((topic, materialIndex) => {
                          const complete = topic.completed
                          return <div className={`material-row ${complete ? 'material-complete' : ''}`} key={topic.id}>
                            <button className="material-check" onClick={() => toggleMaterial(chapterIndex, materialIndex)} aria-label={`${complete ? 'Mark incomplete' : 'Mark completed'}: ${topic.title}`}>{complete ? '✓' : ''}</button>
                            <a href={topic.link} target="_blank" rel="noreferrer"><strong>{topic.title}</strong><small>{topic.type} ↗</small></a>
                          </div>
                        })}
                      </div>
                      {isComplete && (
                        <button className="quiz-button" type="button" onClick={() => openQuiz(chapter.id)}>Quiz</button>
                      )}
                    </div>}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`app-shell ${darkMode ? 'theme-dark' : ''}`}>
      <nav className="topbar">
        <button className="wordmark" onClick={() => setPlanSelection(null)}>LEARNING<span>/</span>PATH</button>
        <div className="topbar-actions">
          <span className="plan-count">{plans.length} paths in motion</span>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">{darkMode ? 'LIGHT' : 'DARK'}</button>
          <button className="options-button" type="button" onClick={() => setIsOptionsModalOpen(true)}>OPTIONS</button>
        </div>
      </nav>
      {isOptionsModalOpen && (
        <div className="modal-overlay" onClick={() => setIsOptionsModalOpen(false)}>
          <div className="options-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close" onClick={() => setIsOptionsModalOpen(false)} aria-label="Close options dialog">×</button>
            <p className="section-marker">PREFERENCES</p>
            <h3>Learning Medium</h3>
            <label className="options-select" htmlFor="results-content-preference">
              <select id="results-content-preference" value={contentPreference} onChange={(event) => setContentPreference(event.target.value)}>
                <option>Videos and readable materials</option>
                <option>Videos only</option>
                <option>Readable materials (PDF/Webpage) only</option>
              </select>
            </label>
          </div>
        </div>
      )}
      <section className="builder-section">
        <div className="section-marker">01 <span>/</span> SET YOUR DIRECTION</div>
        <h1>What are you <em>chasing?</em></h1>
        <p className="section-intro">Tell me your goal, I’ll provide a route you can actually follow.</p>
        <form className="objective-form" onSubmit={createPlan}>
          <div className="sentence">
            <span>I want to learn</span>
            <label className="inline-field wide"><input value={objective} onChange={(event) => setObjective(event.target.value)} aria-label="Learning objective" /></label>
            <span>to become</span>
            <label className="inline-field wider"><input value={outcome} onChange={(event) => setOutcome(event.target.value)} aria-label="Desired outcome" /></label>
            <span>in</span>
            <label className="select-field"><select value={timeframe} onChange={(event) => setTimeframe(event.target.value)} aria-label="Timeframe"><option>3</option><option>6</option><option>9</option><option>12</option></select></label>
            <label className="select-field"><select value={unit} onChange={(event) => setUnit(event.target.value)} aria-label="Time unit"><option>months</option><option>weeks</option></select></label>,
            <span>I’m willing to commit</span>
            <label className="select-field"><select value={hours} onChange={(event) => setHours(event.target.value)} aria-label="Hours per day"><option>1</option><option>2</option><option>3</option><option>4</option><option>6</option><option>8</option></select></label>
            <span>hours a day</span>
            <label className="select-field cadence"><select value={cadence} onChange={(event) => setCadence(event.target.value)} aria-label="Cadence"><option>every day</option><option>on the weekends</option><option>in the workweek</option></select></label>
            <span>starting</span>
            <label className="date-field" onClick={(event) => { event.preventDefault(); openDatePicker() }}><input ref={dateInputRef} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="Start date" /><span>{startDate ? startDate : 'today'}</span></label>
            <span>.</span>
          </div>
          <button className="primary-button create-button" type="submit" disabled={isCreatingPlan}>{isCreatingPlan ? 'Charting path...' : 'Chart my path'} <span>↗</span></button>
          {apiError && <p className="api-error" role="alert">{apiError}</p>}
        </form>
      </section>
      <section className="paths-section">
        <div className="section-header"><div><div className="section-marker">02 <span>/</span> YOUR PATHS</div><h2>In motion.</h2></div><span className="grid-note">{plans.length} objectives</span></div>
        <div className="plan-grid">
          {plans.map((plan) => (
            <div className={`plan-card ${plan.color}`} key={plan.id}>
              <div className="card-top">
                <span className="card-number">0{plan.id}</span>
                <div className="card-actions">
                  <button type="button" className="card-arrow" onClick={() => setPlanSelection(plan)}>↗</button>
                </div>
              </div>
              <button type="button" className="card-content-button" onClick={() => setPlanSelection(plan)}>
                <div className="card-content"><span className="card-label">LEARNING {plan.progress > 0 ? 'IN PROGRESS' : 'READY TO START'}</span><h3>{plan.objective}</h3><p>Become {plan.outcome}</p></div>
                <div className="card-footer"><span>{plan.timeframe}</span><span>{plan.progress}% complete</span></div>
                <div className="progress-bar"><span style={{ width: `${plan.progress}%` }} /></div>
              </button>
            </div>
          ))}
          <button className="add-card" onClick={() => document.querySelector('.objective-form')?.scrollIntoView({ behavior: 'smooth' })}><span>+</span><strong>Start a new path</strong><small>Turn the next idea into motion</small></button>
        </div>
      </section>
      <footer><span>LEARNING/PATH © 2026</span><span>MAKE IT COUNT <b>↗</b></span></footer>
    </main>
  )
}

export default App
