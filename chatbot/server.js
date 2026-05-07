// server.js - Serveur Express pour le chatbot Chaton
// Lance le serveur avec : npm run server

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { chat, providerName } from './provider.js'
import { Pinecone } from '@pinecone-database/pinecone'
import fetch from 'node-fetch'

dotenv.config({ override: true })

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}))
app.use(express.json({ limit: '50mb' }))

// Configuration
const PINECONE_API_KEY = process.env.PINECONE_API_KEY
const PINECONE_ENV = process.env.PINECONE_ENVIRONMENT || 'us-east-1'
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'chatbot'
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
const TOP_K = parseInt(process.env.TOP_K) || 3

// System prompt pour le RAG
const SYSTEM_PROMPT = `Tu es un assistant RH spécialisé pour répondre aux questions des candidats 
qui postulent au poste de Développeur IA.

RÈGLES STRICTES :
1. Tu réponds UNIQUEMENT en te basant sur les documents fournis dans le contexte.
2. Si la réponse ne se trouve pas dans le contexte, tu dois répondre EXACTEMENT :
   "Je ne trouve pas cette information dans les documents fournis."
3. Tu cites toujours la source du document entre crochets, ex : [fiche_poste.txt]
4. Tu es professionnel, clair et bienveillant.
5. Tu ne dois jamais inventer d'informations.`

let pc = null

// Initialiser Pinecone
async function initPinecone() {
  try {
    pc = new Pinecone({
      apiKey: PINECONE_API_KEY,
      environment: PINECONE_ENV
    })
    console.log('✓ Pinecone initialisé')
  } catch (err) {
    console.error('✗ Erreur initialisation Pinecone:', err.message)
  }
}

// Embedding de texte
async function embedText(text) {
  try {
    const response = await fetch('https://api.mistral.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-embed',
        input: [text]
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(`Erreur embedding: ${JSON.stringify(err)}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (err) {
    console.error('Erreur lors de l\'embedding:', err.message)
    throw err
  }
}

// Recherche dans Pinecone
async function searchDocuments(queryEmbedding) {
  try {
    if (!pc) return []
    
    const index = pc.Index(INDEX_NAME)
    const results = await index.query({
      vector: queryEmbedding,
      topK: TOP_K,
      includeMetadata: true
    })

    return results.matches || []
  } catch (err) {
    console.error('Erreur recherche Pinecone:', err.message)
    return []
  }
}

// Route santé
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: providerName,
    timestamp: new Date().toISOString()
  })
})

// Route chat principal
app.post('/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message requis' })
    }

    console.log(`\n📨 Message reçu (Conv ${conversationId}): ${message.substring(0, 50)}...`)

    // Étape 1: Embedding de la question
    const queryEmbedding = await embedText(message)
    console.log('✓ Question embédée')

    // Étape 2: Recherche des documents similaires
    const searchResults = await searchDocuments(queryEmbedding)
    console.log(`✓ ${searchResults.length} documents trouvés`)

    // Étape 3: Construire le contexte
    let context = ''
    if (searchResults.length > 0) {
      context = searchResults
        .map((match, idx) => {
          const source = match.metadata?.source || 'unknown'
          const text = match.metadata?.text || ''
          return `[${source}]\n${text}`
        })
        .join('\n\n---\n\n')
    } else {
      context = 'Aucun document pertinent trouvé.'
    }

    // Étape 4: Appel au LLM avec le contexte
    const messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Contexte des documents:\n\n${context}\n\nQuestion de l'utilisateur: ${message}`
      }
    ]

    console.log('📡 Appel au LLM...')
    const response = await chat(messages)
    console.log('✓ Réponse reçue du LLM')

    res.json({
      response: response,
      source: providerName,
      documentsUsed: searchResults.length
    })

  } catch (err) {
    console.error('✗ Erreur dans /chat:', err.message)
    res.status(500).json({
      error: 'Erreur lors du traitement',
      message: err.message
    })
  }
})

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'Serveur Chaton actif!',
    provider: providerName,
    endpoints: {
      chat: 'POST /chat',
      health: 'GET /health',
      test: 'GET /test'
    }
  })
})

// Route test
app.get('/test', (req, res) => {
  res.json({
    message: 'Serveur Chaton actif!',
    provider: providerName,
    endpoints: {
      chat: 'POST /chat',
      health: 'GET /health',
      test: 'GET /test'
    }
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err)
  res.status(500).json({
    error: 'Erreur serveur interne',
    message: err.message
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// Démarrer le serveur
async function startServer() {
  await initPinecone()
  
  app.listen(PORT, () => {
    console.log('\n🐱 Serveur Chaton démarré!')
    console.log(`✓ Port: ${PORT}`)
    console.log(`✓ Provider: ${providerName}`)
    console.log(`✓ CORS: http://localhost:5173`)
    console.log(`\nURL: http://localhost:${PORT}`)
    console.log('Appuyez sur Ctrl+C pour arrêter')
  })
}

startServer().catch(err => {
  console.error('Erreur au démarrage:', err.message)
  process.exit(1)
})
