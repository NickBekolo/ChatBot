// rag-pipeline.js — Chatbot RAG complet : retrieval + generation + historique
// Lancer avec : node rag-pipeline.js

import dotenv from "dotenv";
import readline from "readline";
import { chat, providerName } from "./provider.js";
dotenv.config({ override: true });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "chatbot";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const TOP_K = parseInt(process.env.TOP_K) || 3;

// ─── Prompt système ────────────────────────────────────────────────────────────
// Le system prompt définit le comportement du chatbot

const SYSTEM_PROMPT = `Tu es un assistant RH spécialisé pour répondre aux questions des candidats 
qui postulent au poste de Développeur IA.

RÈGLES STRICTES :
1. Tu réponds UNIQUEMENT en te basant sur les documents fournis dans le contexte.
2. Si la réponse ne se trouve pas dans le contexte, tu dois répondre EXACTEMENT :
   "Je ne trouve pas cette information dans les documents fournis."
3. Tu cites toujours la source du document entre crochets, ex : [fiche_poste.txt]
4. Tu es professionnel, clair et bienveillant.
5. Tu ne dois jamais inventer d'informations.`;

// ─── 1. Embedding de la question ──────────────────────────────────────────────

async function embedQuery(query) {
  const response = await fetch("https://api.mistral.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-embed",
      input: [query],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Erreur embedding question : ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// ─── 2. Récupération du host Pinecone ─────────────────────────────────────────

let _pineconeHost = null; // Cache pour éviter de refetch à chaque question

async function getPineconeHost() {
  if (_pineconeHost) return _pineconeHost;

  const res = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { "Api-Key": PINECONE_API_KEY },
  });

  if (!res.ok)
    throw new Error(`Index "${INDEX_NAME}" introuvable sur Pinecone`);
  const data = await res.json();
  _pineconeHost = data.host;
  return _pineconeHost;
}

// ─── 3. Retrieval — recherche des chunks pertinents ───────────────────────────
// On cherche les TOP_K chunks les plus proches sémantiquement de la question

async function retrieveContext(queryEmbedding) {
  const host = await getPineconeHost();

  const res = await fetch(`https://${host}/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": PINECONE_API_KEY,
    },
    body: JSON.stringify({
      vector: queryEmbedding,
      topK: TOP_K,
      includeMetadata: true, // Important : on veut récupérer le texte et la source
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erreur Pinecone query : ${JSON.stringify(err)}`);
  }

  const data = await res.json();

  // Formatter les chunks récupérés en contexte lisible
  return data.matches.map((match) => ({
    text: match.metadata.text,
    source: match.metadata.source,
    score: match.score, // Score de similarité cosinus (0 à 1)
  }));
}

// ─── 4. Construction du prompt augmenté ───────────────────────────────────────

function buildAugmentedPrompt(question, contextChunks) {
  const contextText = contextChunks
    .map(
      (c) =>
        `[${c.source}] (similarité: ${(c.score * 100).toFixed(1)}%)\n${c.text}`,
    )
    .join("\n\n---\n\n");

  return `Voici les extraits de documents pertinents pour répondre à la question :

${contextText}

---

Question du candidat : ${question}

Réponds en te basant UNIQUEMENT sur ces extraits. Cite la source entre crochets.`;
}

// ─── 5. Génération de la réponse ──────────────────────────────────────────────

async function generateCompletion(question, conversationHistory) {
  // Vectoriser la question
  const queryEmbedding = await embedQuery(question);

  // Retrieval : chercher les chunks pertinents
  const contextChunks = await retrieveContext(queryEmbedding);

  // Construire le message utilisateur enrichi du contexte
  const augmentedUserMessage = buildAugmentedPrompt(question, contextChunks);

  // Construire le tableau de messages complet (avec historique)
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: augmentedUserMessage },
  ];

  // Appel au LLM via le provider configuré
  const answer = await chat(messages, 800);

  return {
    answer,
    sources: [...new Set(contextChunks.map((c) => c.source))], // Sources uniques
  };
}

// ─── 6. Interface CLI interactive ─────────────────────────────────────────────

async function startChatbot() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║    CHATBOT ASSISTANT RECRUTEMENT TECH               ║");
  console.log("╚══════════════════════════════════════════════════════╝");
  console.log(`\n   Provider : ${providerName.toUpperCase()}`);
  console.log(`   Index    : ${INDEX_NAME}`);
  console.log(`   Top-K    : ${TOP_K} chunks\n`);
  console.log("Posez vos questions sur le poste de Développeur IA.");
  console.log('Tapez "exit" ou "quit" pour quitter.\n');
  console.log("─".repeat(54));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Fermer proprement le readline si stdin se ferme
  rl.on("close", () => {
    process.exit(0);
  });

  const conversationHistory = []; // Historique des échanges (Jour 2 du cours)

  const askQuestion = () => {
    // Vérifier si le readline est fermé avant de poser une question
    if (rl.closed) return;

    rl.question("\nVous : ", async (input) => {
      const question = input.trim();

      // Commandes spéciales
      if (!question) return askQuestion();
      if (["exit", "quit", "q"].includes(question.toLowerCase())) {
        console.log("\nAu revoir et bonne chance dans votre candidature !");
        rl.close();
        return;
      }
      if (question.toLowerCase() === "historique") {
        console.log(
          `\nHistorique : ${conversationHistory.length / 2} échange(s)`,
        );
        return askQuestion();
      }
      if (question.toLowerCase() === "reset") {
        conversationHistory.length = 0;
        console.log("Historique effacé.");
        return askQuestion();
      }

      try {
        process.stdout.write("\nAssistant : Recherche en cours...");

        const { answer, sources } = await generateCompletion(
          question,
          conversationHistory,
        );

        // Effacer le message de chargement
        process.stdout.write("\r" + " ".repeat(50) + "\r");

        console.log(`\nAssistant : ${answer}`);

        if (sources.length > 0) {
          console.log(`\n   Sources consultées : ${sources.join(", ")}`);
        }

        // Sauvegarder dans l'historique (version courte sans le contexte RAG)
        conversationHistory.push(
          { role: "user", content: question },
          { role: "assistant", content: answer },
        );

        // Limiter l'historique à 10 échanges pour éviter de dépasser max_tokens
        if (conversationHistory.length > 20) {
          conversationHistory.splice(0, 2);
        }

        console.log("─".repeat(54));
      } catch (err) {
        // Gestion des erreurs API (Jour 5 du cours)
        console.error(`\nErreur : ${err.message}`);

        if (err.message.includes("401")) {
          console.error("   → Vérifiez votre clé API dans le fichier .env");
        } else if (err.message.includes("429")) {
          console.error(
            "   → Limite de requêtes atteinte, attendez quelques secondes",
          );
        } else if (err.message.includes("500")) {
          console.error("   → Erreur serveur, réessayez dans un moment");
        }
      }

      askQuestion(); // Boucle de conversation
    });
  };

  askQuestion();
}

// ─── Démarrage ─────────────────────────────────────────────────────────────────
startChatbot().catch((err) => {
  console.error("Impossible de démarrer le chatbot :", err.message);
  process.exit(1);
});
