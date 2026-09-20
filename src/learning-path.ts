import { ChatOpenAI } from '@langchain/openai'

export type LearningPathRequest = {
  objective: string
  outcome: string
  timeframe: number
  timeframe_unit: string
  hours_per_day: number
  frequency: string
  start_date: string
  learning_medium: string
}

export type StudyMaterial = {
  title: string
  link: string
  type: 'video' | 'reference' | 'pdf' | 'book' | string
}

export type QuizQuestion = {
  question: string
  options: string[]
  correct_option: number
}

export type LearningChapter = {
  topic: string
  estimated_learning_time_in_hours: number
  planned_start_date: string
  planned_end_date: string
  description: string
  study_materials: StudyMaterial[]
  quiz: QuizQuestion[]
}

export type LearningPathResponse = {
  title: string
  start_date: string
  end_date: string
  learning_frequency: 'daily' | 'weekend' | 'workweek' | string
  estimated_total_hours: number
  chapters: LearningChapter[]
}

export function buildLearningPathPrompt(payload: LearningPathRequest): string {
  return `I want to learn ${payload.objective} to become ${payload.outcome}. Put together a ${payload.timeframe} ${payload.timeframe_unit}, ${payload.hours_per_day} hours a day, ${payload.frequency} learning plan starting ${payload.start_date}. Divide learning into logical chapters and include multiple study links of ${payload.learning_medium} that can help learn each chapter. Also include a quiz for each chapter. The quiz should be objective with only one correct answer, with a mix of multiple-choice and true/false questions (80% multiple-choice, 20% true/false). True/false questions must include the exact prefix "True or False: " at the beginning of the question text. Include exactly 10 quiz questions per chapter.

Critical anti-hallucination instructions:
- Never invent, guess, or fabricate study links, titles, webpages, or domains.
- Only include links that are real, public, and likely to be valid and accessible today.
- Prefer official documentation, official product/platform pages, reputable educational resources, official YouTube channels, and canonical documentation hubs.
- If you are not fully certain that a URL is real, active, and relevant, omit it rather than guessing.
- Never use placeholders, sample URLs, made-up domains, test domains, generic template links, or example.com-like values.
- Every study_materials item must include a descriptive title and a valid https:// URL.
- Keep the links directly relevant to ${payload.learning_medium} and the chapter topic.
- Use at least 2-3 valid study materials per chapter when possible; do not include weak or fabricated links to fill the quota.
- Include only resources that are credible, official, or well-established.

Critical quality rules:
- Output valid JSON only and no markdown fences.
- No extra text before or after the JSON.
- Keep the structure exactly like the sample format below.
- Ensure every chapter has exactly 10 quiz items.
- Every quiz question must have exactly one correct answer.
- Use realistic dates that match the start date and timeframe.
- Do not include any additional properties beyond the sample structure.

Response should be in JSON format with no additional text before or after, like the sample provided below, do not include any additional parameters:
{
  title: '4-Week Solidity Developer Learning Plan',
  start_date: '2026-09-06',
  end_date: '2026-10-03',
  learning_frequency: 'weekends',
  estimated_total_hours: 32,
  chapters: [
    {
      topic: 'Introduction to Blockchain, Ethereum and Web3',
      estimated_learning_time_in_hours: 8,
      planned_start_date: '2026-09-06',
      planned_end_date: '2026-09-12',
      description: 'Learn blockchain fundamentals, distributed ledgers, cryptographic hashing, wallets, accounts, transactions, blocks, consensus, Ethereum, Ether, smart contracts, dApps and the Ethereum development stack. The objective is to build the mental model needed before writing Solidity.',
      study_materials: [
        { title: 'Technical Introduction to Ethereum', link: 'https://ethereum.org/developers/docs/intro-to-ethereum/', type: 'reference' },
        { title: 'Ethereum Development Documentation', link: 'https://ethereum.org/developers/docs/', type: 'reference' },
        { title: 'Ethereum Whitepaper', link: 'https://ethereum.org/whitepaper/', type: 'pdf' },
        { title: 'Learn Solidity Smart Contract Development - Full Course', link: 'https://www.youtube.com/watch?v=-1GB6m39-rM', type: 'video' },
        { title: 'Mastering Ethereum', link: 'https://masteringethereum.xyz/', type: 'reference' },
      ],
      quiz: [
        { question: 'What is the primary purpose of a blockchain?', options: ['To provide a shared tamper-resistant state or ledger', 'To replace all databases', 'To provide unlimited storage', 'To eliminate cryptography'], correct_option: 0 },
        { question: 'What is the native asset of Ethereum?', options: ['BTC', 'ETH', 'SOL', 'USDC'], correct_option: 1 },
        { question: 'True or False: The native currency used to pay Ethereum transaction fees is ETH.', options: ['True', 'False'], correct_option: 0 },
      ],
    },
    {
      topic: 'Ethereum Accounts, Transactions, Gas and EVM',
      estimated_learning_time_in_hours: 8,
      planned_start_date: '2026-09-13',
      planned_end_date: '2026-09-19',
      description: 'Understand EOAs and contract accounts, transaction lifecycle, nonce, gas, calldata, return data, logs, events, contract creation and EVM execution. Learn enough EVM fundamentals to reason about what Solidity code actually does on-chain.',
      study_materials: [
        { title: 'Ethereum Accounts', link: 'https://ethereum.org/developers/docs/accounts/', type: 'reference' },
        { title: 'Ethereum Yellow Paper', link: 'https://ethereum.github.io/yellowpaper/paper.pdf', type: 'pdf' },
      ],
      quiz: [
        { question: 'Which account type is controlled by a private key?', options: ['Externally Owned Account', 'Contract Account', 'Validator Contract', 'Storage Account'], correct_option: 0 },
        { question: 'True or False: Persistent contract state is primarily stored in EVM storage.', options: ['True', 'False'], correct_option: 0 },
      ],
    },
    {
      topic: 'Solidity Fundamentals',
      estimated_learning_time_in_hours: 4,
      planned_start_date: '2026-09-20',
      planned_end_date: '2026-09-20',
      description: 'Learn Solidity syntax and core programming constructs: source files, pragma, contracts, variables, primitive types, arrays, mappings, structs, enums, functions, visibility, modifiers, constructors, events, errors, constants and immutables.',
      study_materials: [
        { title: 'Official Solidity Documentation', link: 'https://docs.solidity.org/en/latest/', type: 'reference' },
        { title: 'Learn Solidity Smart Contract Development', link: 'https://updraft.cyfrin.io/courses/solidity', type: 'video' },
      ],
      quiz: [
        { question: 'Which keyword declares a Solidity contract?', options: ['contract', 'class', 'program', 'module'], correct_option: 0 },
        { question: 'Which keyword is used to define a contract function that does not change state?', options: ['view', 'constant', 'mutable', 'write'], correct_option: 0 },
        { question: 'True or False: A Solidity function that does not modify state can be declared with the view modifier.', options: ['True', 'False'], correct_option: 0 },
      ],
    },
    {
      topic: 'Advanced Solidity: Storage, Memory, Calldata, Ether and Contract Interaction',
      estimated_learning_time_in_hours: 8,
      planned_start_date: '2026-09-26',
      planned_end_date: '2026-09-27',
      description: 'Master Solidity data locations, storage layout, payable functions, Ether transfers, receive and fallback functions, msg.sender, msg.value, interfaces, contract-to-contract calls, call, delegatecall and staticcall.',
      study_materials: [
        { title: 'Solidity Contracts', link: 'https://docs.solidity.org/en/latest/contracts.html', type: 'reference' },
      ],
      quiz: [
        { question: 'Which data location persists between transactions?', options: ['storage', 'memory', 'calldata', 'stack'], correct_option: 0 },
        { question: 'Which modifier allows a function to receive Ether?', options: ['payable', 'view', 'override', 'private'], correct_option: 0 },
        { question: 'True or False: msg.value represents the Wei sent with the current call.', options: ['True', 'False'], correct_option: 0 },
      ],
    },
  ],
}

Important constraints:
- Output valid JSON only.
- No markdown fences or surrounding commentary.
- Ensure every chapter has exactly 10 quiz questions.
- Keep study links relevant to ${payload.learning_medium}.
- Use a realistic date range based on the start date and the timeframe.
- Every quiz question must have exactly one correct option.
- Do not include any extra properties beyond the example structure.`
}

export function validateLearningPath(response: LearningPathResponse): void {
  if (!response || typeof response !== 'object' || !Array.isArray(response.chapters)) {
    throw new Error('LLM response did not include a valid learning path object.')
  }

  for (const chapter of response.chapters) {
    if (!chapter || !Array.isArray(chapter.quiz) || chapter.quiz.length !== 10) {
      throw new Error('Each chapter must include exactly 10 quiz questions.')
    }

    if (!Array.isArray(chapter.study_materials) || chapter.study_materials.length < 2) {
      throw new Error('Each chapter must include at least 2 study materials.')
    }

    for (const material of chapter.study_materials) {
      if (!material || typeof material.link !== 'string' || !/^https?:\/\//i.test(material.link)) {
        throw new Error('Each study material must include a valid http(s) link.')
      }
    }
  }
}

export function extractJsonResponse(raw: string): LearningPathResponse {
  const candidate = raw.trim()
  const fencedMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  const sanitized = fencedMatch ? fencedMatch[1].trim() : candidate
  const startIndex = sanitized.indexOf('{')
  const endIndex = sanitized.lastIndexOf('}')

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('Unable to extract JSON from LLM response.')
  }

  const jsonText = sanitized.slice(startIndex, endIndex + 1)
  const parsed = JSON.parse(jsonText) as LearningPathResponse

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('LLM response did not include a valid learning path object.')
  }

  validateLearningPath(parsed)

  return parsed
}

function normalizeContentText(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content.map((part) => normalizeContentText(part)).join('')
  }

  if (content && typeof content === 'object') {
    const maybeText = content as { text?: unknown }
    if (typeof maybeText.text === 'string') {
      return maybeText.text
    }
  }

  return ''
}

export async function* streamLearningPathText(payload: LearningPathRequest): AsyncGenerator<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const modelName = process.env.OPENAI_MODEL ?? 'gpt-5.6-luna'

  const llm = new ChatOpenAI({
    model: modelName,
    temperature: 1,
    reasoningEffort: 'high',
    apiKey,
  })

  const stream = await llm.stream(buildLearningPathPrompt(payload))

  for await (const chunk of stream) {
    const chunkText = normalizeContentText(chunk.content)

    if (chunkText) {
      yield chunkText
    }
  }
}

export async function generateLearningPath(payload: LearningPathRequest): Promise<LearningPathResponse> {
  let rawContent = ''

  for await (const chunk of streamLearningPathText(payload)) {
    rawContent += chunk
  }

  return extractJsonResponse(rawContent)
}
