const axios = require('axios')
const NodeCache = require('node-cache')

const cache = new NodeCache({ stdTTL: 3600 }) // cache 1 hour
const GEMINI_KEY = process.env.GEMINI_API_KEY
const MODEL = 'gemini-2.5-flash'
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

async function callGemini(prompt) {
  const res = await axios.post(
    `${BASE_URL}?key=${GEMINI_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] },
    { timeout: 30000 }
  )
  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || null
}

// Structured executive summary with Key Insights / Risks / Trends
exports.getStructuredSummary = async (query, results) => {
  if (!GEMINI_KEY || results.length === 0) return null

  const cacheKey = `summary_${query.toLowerCase().trim().replace(/\s+/g, '_')}`
  const cached = cache.get(cacheKey)
  if (cached) { console.log('✅ Cache hit:', cacheKey); return cached }

  const context = results.slice(0, 5)
    .map((r, i) => `[Source ${i+1}] ${r.title}: ${r.content.slice(0, 400)}`)
    .join('\n\n')

  const prompt = `You are Lexa AI. Analyze these documents and answer the query: "${query}"

Documents:
${context}

Respond ONLY in this exact JSON format (no markdown, no extra text):
{
  "intelligence": "One sentence direct answer to the query",
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "risks": ["risk 1", "risk 2"],
  "trends": ["trend 1", "trend 2"],
  "confidence": 85
}`

  try {
    const text = await callGemini(prompt)
    if (!text) return null
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    cache.set(cacheKey, parsed)
    return parsed
  } catch(e) {
    console.error('Structured summary error:', e.message)
    // Fallback: plain text summary
    try {
      const fallback = await callGemini(
        `Summarize in 2-3 sentences for query "${query}": ${context}`
      )
      return fallback ? { intelligence: fallback, keyInsights: [], risks: [], trends: [], confidence: 70 } : null
    } catch { return null }
  }
}

// Conversational RAG response
exports.getChatResponse = async (query, context, history = []) => {
  if (!GEMINI_KEY) return 'Gemini API key not configured.'

  const historyText = history.slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Lexa'}: ${m.content}`)
    .join('\n')

  const prompt = `You are Lexa, an intelligent document assistant. Answer using ONLY the provided documents.

${historyText ? `Recent conversation:\n${historyText}\n` : ''}

Retrieved documents:
${context}

User question: "${query}"

Rules:
- Answer ONLY from the documents above
- Include [Source N] citations
- If not found in documents, say: "I couldn't find relevant information in the uploaded documents."
- Be concise (2-4 sentences)`

  try {
    return await callGemini(prompt)
  } catch(e) {
    console.error('Chat Gemini error:', e.message)
    return null
  }
}