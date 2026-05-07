// providers.js — Abstraction multi-provider (Mistral / Groq / OpenAI)
// Chaque provider expose la même interface : { chat(messages) }

import dotenv from "dotenv";
dotenv.config({ override: true });

// ─── Config par provider ────────────────────────────────────────────────────

const PROVIDERS_CONFIG = {
  mistral: {
    url: "https://api.mistral.ai/v1/chat/completions",
    model: "mistral-small-latest",
    apiKey: process.env.MISTRAL_API_KEY,
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama2-70b-4096",
    apiKey: process.env.GROQ_API_KEY,
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
  },
};

// ─── Sélection du provider actif ────────────────────────────────────────────

const providerName = (process.env.LLM_PROVIDER || "mistral").toLowerCase();
const config = PROVIDERS_CONFIG[providerName];

if (!config) {
  throw new Error(
    `Provider "${providerName}" inconnu. Valeurs acceptées : mistral | groq | openai`,
  );
}

if (!config.apiKey) {
  throw new Error(
    `Clé API manquante pour le provider "${providerName}". Vérifiez votre .env`,
  );
}

console.log(`Provider actif : ${providerName} (${config.model})`);

// ─── Fonction principale ─────────────────────────────────────────────────────

/**
 * Envoie un tableau de messages au LLM sélectionné et retourne la réponse.
 * @param {Array<{role: string, content: string}>} messages
 * @param {number} maxTokens
 * @returns {Promise<string>}
 */
export async function chat(messages, maxTokens = 800) {
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.2, // Basse température = réponses plus précises pour du RAG
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Erreur API ${providerName} (${response.status}) : ${
        error?.error?.message || response.statusText
      }`,
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export { providerName };
