// keep-alive.js — run this locally OR add to your cron
// Pings Render every 10 minutes so it never sleeps

const https = require('https')

const URLS = [
  'https://lexa-backend-v0rv.onrender.com/health',
  'https://lexa-ai-service.onrender.com/health',
]

function ping(url) {
  https.get(url, (res) => {
    console.log(`[${new Date().toISOString()}] ✅ ${url} → ${res.statusCode}`)
  }).on('error', (e) => {
    console.log(`[${new Date().toISOString()}] ❌ ${url} → ${e.message}`)
  })
}

console.log('🟢 Keep-alive started — pinging every 10 minutes')
URLS.forEach(ping)
setInterval(() => URLS.forEach(ping), 10 * 60 * 1000)