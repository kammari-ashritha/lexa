// scripts/seedSampleDocs.js
// Run: node scripts/seedSampleDocs.js
// Seeds 10 sample documents with scope="sample" for public demo

require('dotenv').config({ path: '../backend/.env' })
const axios   = require('axios')
const { MongoClient } = require('mongodb')

const MONGO_URI = process.env.MONGO_URI
const AI_URL    = process.env.AI_SERVICE_URL || 'http://localhost:8000'

const SAMPLE_DOCS = [
  {
    title: 'Machine Learning Fundamentals',
    category: 'Technology',
    tags: ['ML', 'AI', 'deep learning'],
    content: `Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. Algorithms improve automatically through experience. Key types include supervised learning where models train on labeled datasets, unsupervised learning for pattern discovery in unlabeled data, and reinforcement learning where agents learn through reward signals. Neural networks form the backbone of deep learning, enabling breakthroughs in image recognition, natural language processing, and predictive analytics. Applications span healthcare diagnostics, financial fraud detection, recommendation systems, and autonomous vehicles. Feature engineering, model selection, and hyperparameter tuning are critical steps in building effective machine learning systems. Cross-validation helps prevent overfitting and ensures models generalize well to unseen data.`
  },
  {
    title: 'Remote Work Policy Guidelines',
    category: 'HR',
    tags: ['remote work', 'policy', 'employees'],
    content: `This policy establishes guidelines for employees working from home or remote locations. Employees must maintain core working hours from 10 AM to 3 PM in their local timezone and remain accessible via company communication tools. Home office setup requirements include a dedicated workspace, reliable internet connection with minimum 25 Mbps speed, and a functioning webcam for video meetings. Security protocols mandate VPN usage for all company systems, encrypted storage for sensitive documents, and two-factor authentication on all accounts. Performance evaluation for remote workers focuses on deliverables and outcomes rather than time tracking. Managers should conduct weekly one-on-one check-ins to maintain team cohesion. Equipment reimbursement is available for home office setup up to $500 annually. Remote work arrangements are subject to business needs and manager approval.`
  },
  {
    title: 'Cardiovascular Disease Prevention',
    category: 'Medical',
    tags: ['heart disease', 'prevention', 'health'],
    content: `Cardiovascular disease remains the leading cause of mortality worldwide. Prevention strategies focus on modifiable risk factors including hypertension, hyperlipidemia, diabetes, smoking, obesity, and physical inactivity. Regular aerobic exercise of at least 150 minutes per week at moderate intensity significantly reduces cardiovascular risk. Dietary interventions include reducing saturated fat and sodium intake, increasing consumption of fruits, vegetables, and whole grains, and following Mediterranean or DASH diet patterns. Blood pressure monitoring and management is critical, with target levels below 130/80 mmHg for most adults. Statin therapy is recommended for individuals with elevated LDL cholesterol or established cardiovascular disease. Smoking cessation provides immediate cardiovascular benefits regardless of prior smoking history. Regular screenings including lipid panels, blood glucose testing, and cardiac stress tests enable early detection and intervention.`
  },
  {
    title: 'Financial Crisis and Economic Recession',
    category: 'Finance',
    tags: ['recession', 'economy', 'financial crisis'],
    content: `Economic recessions are characterized by two consecutive quarters of negative GDP growth, rising unemployment, reduced consumer spending, and declining business investment. The 2008 global financial crisis originated from the collapse of the housing bubble and securitized mortgage products. Central banks responded with unconventional monetary policies including quantitative easing and near-zero interest rates. Fiscal stimulus packages involving government spending and tax cuts helped stabilize aggregate demand. Leading economic indicators such as manufacturing PMI, consumer confidence indices, and yield curve inversions can signal impending downturns. Corporate debt levels, credit market conditions, and asset price bubbles are monitored as systemic risk indicators. Recovery typically requires structural reforms addressing underlying imbalances. International coordination through G20 and IMF frameworks helps prevent contagion across global financial markets.`
  },
  {
    title: 'Artificial Intelligence in Healthcare',
    category: 'Medical',
    tags: ['AI', 'healthcare', 'diagnostics'],
    content: `Artificial intelligence is transforming healthcare through enhanced diagnostic accuracy, drug discovery acceleration, and personalized treatment planning. Deep learning algorithms analyze medical imaging with radiologist-level accuracy for detecting cancers, diabetic retinopathy, and cardiac abnormalities. Natural language processing extracts insights from clinical notes and electronic health records, improving care coordination and reducing documentation burden. AI-powered predictive models identify high-risk patients for early intervention, reducing hospital readmissions and emergency visits. Drug discovery pipelines using AI reduce development timelines from decades to years by predicting molecular interactions and optimizing clinical trial design. Robotic surgery systems enhance precision and minimize invasiveness in complex procedures. Regulatory frameworks from FDA and EMA are evolving to address AI medical device validation and post-market surveillance requirements.`
  },
  {
    title: 'Cloud Computing Infrastructure',
    category: 'Technology',
    tags: ['cloud', 'AWS', 'infrastructure'],
    content: `Cloud computing delivers computing resources including servers, storage, databases, networking, software, and analytics over the internet on a pay-as-you-go basis. Infrastructure as a Service provides virtualized computing resources while Platform as a Service offers development and deployment environments. Software as a Service delivers complete applications managed by cloud providers. Multi-cloud strategies distribute workloads across AWS, Azure, and Google Cloud to avoid vendor lock-in and optimize costs. Containerization using Docker and orchestration via Kubernetes enable consistent deployment across environments. Cloud security requires shared responsibility models where providers secure infrastructure while customers protect their data and applications. Cost optimization strategies include reserved instances, spot pricing, auto-scaling, and right-sizing of compute resources. Disaster recovery and business continuity planning leverage geographic redundancy across multiple availability zones and regions.`
  },
  {
    title: 'Employee Performance Review Process',
    category: 'HR',
    tags: ['performance', 'review', 'evaluation'],
    content: `The annual performance review process evaluates employee contributions against established goals and competency frameworks. Managers should provide continuous feedback throughout the year rather than saving observations for annual reviews. Self-assessments encourage employees to reflect on achievements, challenges, and development areas. 360-degree feedback incorporates perspectives from peers, direct reports, and cross-functional colleagues. Performance ratings should be calibrated across teams to ensure consistency and fairness. Documentation of specific accomplishments and areas for improvement must reference observable behaviors rather than personality traits. Development plans identify skill gaps and create actionable learning objectives aligned with career aspirations and business needs. Compensation adjustments, promotions, and recognition should be clearly linked to performance outcomes. Poor performance requires documented corrective action plans with clear expectations, support resources, and timelines for improvement.`
  },
  {
    title: 'Blockchain Technology and Cryptocurrency',
    category: 'Finance',
    tags: ['blockchain', 'crypto', 'DeFi'],
    content: `Blockchain technology creates immutable distributed ledgers recording transactions across peer-to-peer networks without central authority. Consensus mechanisms including Proof of Work and Proof of Stake validate transactions and secure networks against double-spending attacks. Bitcoin pioneered cryptocurrency as a decentralized digital currency resistant to censorship and inflation through fixed monetary supply. Ethereum introduced programmable smart contracts enabling decentralized applications and DeFi protocols. Decentralized finance replicates traditional financial services including lending, borrowing, and trading without intermediaries. Non-fungible tokens establish provable digital ownership and scarcity for digital assets. Regulatory uncertainty remains a significant challenge with jurisdictions taking varied approaches to cryptocurrency classification and taxation. Enterprise blockchain implementations from Hyperledger and R3 Corda focus on permissioned networks for supply chain transparency, trade finance, and cross-border payments.`
  },
  {
    title: 'Data Privacy and GDPR Compliance',
    category: 'Legal',
    tags: ['privacy', 'GDPR', 'compliance'],
    content: `The General Data Protection Regulation establishes comprehensive data privacy rights for EU residents and extraterritorial obligations for organizations processing their data. Legal bases for processing include consent, contractual necessity, legal obligation, vital interests, public task, and legitimate interests. Data subjects have rights to access, rectification, erasure, portability, and objection to processing. Data Protection Officers must be appointed for large-scale systematic processing of sensitive data. Privacy by design mandates embedding data protection into systems and processes from inception. Data breach notification requires informing supervisory authorities within 72 hours and affected individuals without undue delay. Cross-border data transfers require adequate protection mechanisms including standard contractual clauses or binding corporate rules. Penalties for non-compliance reach up to 4% of global annual turnover or 20 million euros. Organizations must maintain comprehensive records of processing activities demonstrating accountability.`
  },
  {
    title: 'Renewable Energy and Climate Change',
    category: 'Research',
    tags: ['solar', 'wind', 'climate', 'sustainability'],
    content: `Renewable energy sources including solar, wind, hydroelectric, geothermal, and biomass are essential for decarbonizing global energy systems. Solar photovoltaic costs have declined over 90% in the past decade making it the cheapest electricity source in history in many regions. Offshore wind capacity is rapidly expanding with turbines exceeding 15 megawatts enabling cost-competitive generation in deeper waters. Grid integration challenges from variable renewable generation require energy storage solutions, demand response programs, and transmission infrastructure upgrades. Lithium-ion battery storage costs are following a similar trajectory to solar, enabling economically viable grid-scale storage. Green hydrogen produced via electrolysis powered by renewables offers a pathway to decarbonize hard-to-abate sectors including steel, cement, and long-haul transportation. Carbon pricing mechanisms create economic incentives for emission reductions across sectors. International climate agreements under the Paris framework target limiting warming to 1.5 degrees Celsius above pre-industrial levels.`
  }
]

async function seedSampleDocs() {
  const client = new MongoClient(MONGO_URI)
  try {
    await client.connect()
    const db  = client.db('lexa_db')
    const col = db.collection('documents')

    console.log('Connected to MongoDB')
    console.log(`Seeding ${SAMPLE_DOCS.length} sample documents...`)

    let inserted = 0
    let skipped  = 0

    for (const doc of SAMPLE_DOCS) {
      // Check if already exists
      const existing = await col.findOne({ title: doc.title, scope: 'sample' })
      if (existing) {
        console.log(`  Skipping (exists): ${doc.title}`)
        skipped++
        continue
      }

      // Get embeddings
      const crypto    = require('crypto')
      const checksum  = crypto.createHash('md5').update(doc.content).digest('hex')
      const words     = doc.content.split(/\s+/)
      const chunks    = []
      let i = 0
      while (i < words.length) {
        const chunk = words.slice(i, i + 500).join(' ')
        if (chunk.split(/\s+/).length >= 20) chunks.push(chunk)
        i += 450
      }
      if (!chunks.length) chunks.push(doc.content)

      // Embed
      let embeddings = []
      try {
        const batchRes = await axios.post(`${AI_URL}/embed-batch`, { texts: chunks }, { timeout: 60000 })
        embeddings = batchRes.data.embeddings
      } catch (e) {
        for (const chunk of chunks) {
          const r = await axios.post(`${AI_URL}/embed`, { text: chunk }, { timeout: 30000 })
          embeddings.push(r.data.embedding)
        }
      }

      const docsToInsert = chunks.map((chunk, idx) => ({
        title:          doc.title,
        content:        chunk,
        category:       doc.category,
        tags:           doc.tags,
        embedding:      embeddings[idx],
        chunk_index:    idx,
        total_chunks:   chunks.length,
        word_count:     chunk.split(/\s+/).length,
        checksum:       idx === 0 ? checksum : null,
        scope:          'sample',          // PUBLIC — visible to everyone
        organizationId: null,
        model:          'voyage-3-lite',
        dimensions:     embeddings[idx].length,
        created_at:     new Date()
      }))

      await col.insertMany(docsToInsert)
      console.log(`  Inserted: ${doc.title} (${chunks.length} chunks, ${embeddings[0].length} dims)`)
      inserted++
    }

    console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`)
  } catch (err) {
    console.error('Seed error:', err.message)
  } finally {
    await client.close()
  }
}

seedSampleDocs()