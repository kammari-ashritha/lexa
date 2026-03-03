const axios = require('axios')

const GROQ_KEY = process.env.GROQ_API_KEY
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

async function getStructuredSummary(query, results) {
  try {
    if (!GROQ_KEY || !results?.length) return null

    const context = results.slice(0, 5).map((r, i) =>
      `[${i+1}] ${r.title}: ${r.content?.slice(0, 400)}`
    ).join('\n\n')

    const prompt = `You are an AI analyst. Based on these documents, answer: "${query}"

Documents:
${context}

Respond with ONLY valid JSON (no markdown, no backticks):
{"intelligence":"2-3 sentence summary","keyInsights":["insight 1","insight 2"],"risks":["risk 1"],"trends":["trend 1"],"confidence":85}`

    const res = await axios.post(GROQ_URL, {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 512
    }, {
      headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      timeout: 20000
    })

    const text = res.data?.choices?.[0]?.message?.content?.trim()
    if (!text) return null
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch (e) {
    console.log('Summary error:', e.message)
    return null
  }
}

module.exports = { getStructuredSummary }