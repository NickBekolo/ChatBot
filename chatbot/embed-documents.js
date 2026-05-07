// embed-documents.js — Charge, découpe, vectorise et stocke les documents dans Pinecone
// Lancer après create-index.js : node embed-documents.js

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config({ override: true });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "chatbot-recrutement";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE) || 500;
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP) || 50;
const DOCUMENTS_DIR = "./documents";

// ─── 1. Chargement des fichiers ───────────────────────────────────────────────

function loadDocuments(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".txt"));
  console.log(`${files.length} fichier(s) trouvé(s) dans ${dir}/`);

  return files.map((filename) => {
    const content = fs.readFileSync(path.join(dir, filename), "utf-8");
    console.log(`   ✓ ${filename} (${content.length} caractères)`);
    return { filename, content };
  });
}

// ─── 2. Chunking — découpage en morceaux ─────────────────────────────────────
// On découpe le texte en chunks de CHUNK_SIZE caractères avec CHUNK_OVERLAP de chevauchement
// Le chevauchement évite de couper une info importante en deux chunks

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap; // Avancer en tenant compte du chevauchement
  }

  // Supprimer les chunks trop courts (moins de 50 caractères)
  return chunks.filter((c) => c.length >= 50);
}

// ─── 3. Embedding — vectorisation via Mistral ────────────────────────────────
// Mistral embed-document transforme un texte en vecteur de 1024 dimensions

async function getEmbedding(text) {
  const response = await fetch("https://api.mistral.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-embed",
      input: [text],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Erreur embedding Mistral : ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return data.data[0].embedding; // Vecteur de 1024 floats
}

// ─── 4. Récupération du host Pinecone ─────────────────────────────────────────

async function getPineconeHost() {
  const res = await fetch(`https://api.pinecone.io/indexes/${INDEX_NAME}`, {
    headers: { "Api-Key": PINECONE_API_KEY },
  });

  if (!res.ok)
    throw new Error(`Index "${INDEX_NAME}" introuvable sur Pinecone`);
  const data = await res.json();
  return data.host; // ex: chatbot-recrutement-xxxx.svc.pinecone.io
}

// ─── 5. Upsert dans Pinecone ──────────────────────────────────────────────────

async function upsertVectors(host, vectors) {
  const res = await fetch(`https://${host}/vectors/upsert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": PINECONE_API_KEY,
    },
    body: JSON.stringify({ vectors }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Erreur upsert Pinecone : ${JSON.stringify(err)}`);
  }

  return await res.json();
}

// ─── Pipeline principale ──────────────────────────────────────────────────────

async function embedDocuments() {
  console.log("  Démarrage de l'embedding des documents...\n");

  // Charger les documents
  const documents = loadDocuments(DOCUMENTS_DIR);

  // Récupérer le host Pinecone
  const host = await getPineconeHost();
  console.log(`\n  Pinecone host : ${host}`);

  let totalChunks = 0;
  let totalVectors = 0;

  // Traiter chaque document
  for (const doc of documents) {
    console.log(`\n  Traitement de : ${doc.filename}`);

    // Découper en chunks
    const chunks = chunkText(doc.content);
    console.log(
      `     ${chunks.length} chunks (taille: ${CHUNK_SIZE}, overlap: ${CHUNK_OVERLAP})`,
    );
    totalChunks += chunks.length;

    // Vectoriser et préparer les vecteurs
    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      process.stdout.write(
        `     Embedding chunk ${i + 1}/${chunks.length}...\r`,
      );

      const embedding = await getEmbedding(chunks[i]);

      vectors.push({
        id: `${doc.filename}-chunk-${i}`,
        values: embedding,
        metadata: {
          source: doc.filename, // Pour citer la source dans les réponses
          text: chunks[i], // Le texte original du chunk
          chunkIndex: i,
        },
      });

      // Petite pause pour éviter le rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    // Upsert en Pinecone (par batch de 100)
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await upsertVectors(host, batch);
    }

    totalVectors += vectors.length;
    console.log(
      `\n     ${vectors.length} vecteurs indexés pour ${doc.filename}`,
    );
  }

  console.log(`\n  Embedding terminé !`);
  console.log(
    `     Total : ${totalChunks} chunks | ${totalVectors} vecteurs indexés`,
  );
  console.log(`     Index Pinecone : "${INDEX_NAME}"`);
  console.log(
    `\n  Vous pouvez maintenant lancer le chatbot : node rag-pipeline.js`,
  );
}

// ─── Gestion erreurs ───────────────────────────────────────────────────────
embedDocuments().catch((err) => {
  console.error("\n  Erreur :", err.message);
  process.exit(1);
});
