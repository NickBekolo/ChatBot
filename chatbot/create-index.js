// create-index.js — Crée l'index Pinecone pour le chatbot recrutement
// Lancer une seule fois : node create-index.js

import dotenv from "dotenv";
dotenv.config({ override: true });

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || "chatbot";

// Mistral Embeddings produit des vecteurs de dimension 1024
// Groq et OpenAI embeddings utilisent 1536 (text-embedding-ada-002)
// On utilise 1024 par défaut (Mistral embed)
const DIMENSION = 1024;

async function createIndex() {
  console.log("Création de l'index Pinecone...");
  console.log(`   Nom    : ${INDEX_NAME}`);
  console.log(`   Dimension : ${DIMENSION}`);

  // ─── Vérifier si l'index existe déjà ──────────────────────────────────────
  const detailsRes = await fetch(
    `https://api.pinecone.io/indexes/${INDEX_NAME}`,
    {
      headers: {
        "Api-Key": PINECONE_API_KEY,
        "Content-Type": "application/json",
      },
    },
  );

  if (detailsRes.ok) {
    const details = await detailsRes.json();
    if (details.dimension === DIMENSION) {
      console.log(
        `L'index "${INDEX_NAME}" existe déjà avec la bonne dimension — aucune action.`,
      );
      return;
    }

    console.log(
      `L'index "${INDEX_NAME}" existe déjà avec la dimension ${details.dimension} ; recréation en ${DIMENSION}...`,
    );

    const deleteRes = await fetch(
      `https://api.pinecone.io/indexes/${INDEX_NAME}`,
      {
        method: "DELETE",
        headers: {
          "Api-Key": PINECONE_API_KEY,
          "Content-Type": "application/json",
        },
      },
    );

    if (!deleteRes.ok) {
      const err = await deleteRes.json().catch(() => ({}));
      throw new Error(
        `Erreur suppression index Pinecone : ${JSON.stringify(err)}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  // ─── Créer l'index ─────────────────────────────────────────────────────────
  const createRes = await fetch("https://api.pinecone.io/indexes", {
    method: "POST",
    headers: {
      "Api-Key": PINECONE_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: INDEX_NAME,
      dimension: DIMENSION,
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`Erreur création index Pinecone : ${JSON.stringify(err)}`);
  }

  console.log(`Index "${INDEX_NAME}" créé avec succès !`);
  console.log("Attente de l'initialisation (30s)...");

  // Pinecone a besoin de quelques secondes pour initialiser l'index
  await new Promise((resolve) => setTimeout(resolve, 30000));
  console.log("Index prêt. Vous pouvez lancer embed-documents.js");
}

// ─── Gestion erreurs ───────────────────────────────────────────────────────
createIndex().catch((err) => {
  console.error("Erreur :", err.message);
  process.exit(1);
});
