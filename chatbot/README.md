# Installation rapide

## Prérequis

- Node.js 18 ou supérieur
- Un fichier `.env` à la racine du projet

## Installation

```bash
npm install
```

## Configuration `.env`

Renseigne au minimum les variables suivantes selon le provider utilisé :

- `LLM_PROVIDER` : `mistral`, `groq` ou `openai`
- `MISTRAL_API_KEY`
- `GROQ_API_KEY`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME` (optionnel, valeur par défaut : `chatbot`)

## Commandes

```bash
npm run create-index
npm run embed
npm run chat
```
