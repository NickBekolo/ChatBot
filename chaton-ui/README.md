# Chaton - Chatbot RAG avec Interface React

Une application de chat intelligente avec Retrieval-Augmented Generation (RAG), alimentée par Mistral et Pinecone. Interface épurée en React inspirée de ChatGPT avec design noir et blanc minimaliste.

---

## 🎯 Vue d'ensemble

**Chaton** est un chatbot complet qui répond aux questions en se basant sur une base de documents vectorisés (FAQ RH, fiches de poste, compétences techniques, etc.). Le système récupère les documents pertinents et utilise Mistral LLM pour générer des réponses contextuelles.

**Architecture globale :**
- **Frontend**: React + Vite (port 5173) - Interface utilisateur responsive
- **Backend**: Node.js + Express (port 3000) - Pipeline RAG + API
- **Base de données**: Pinecone - Stockage vectoriel des documents
- **LLM**: Mistral - Génération de réponses intelligentes

---

## 🚀 Installation et démarrage rapide

### Prérequis
- Node.js v18+
- Clés API : Mistral et Pinecone

### 1. Configuration des variables d'environnement

**Dans `chatbot/.env`:**
```
LLM_PROVIDER=mistral
MISTRAL_API_KEY=votre_clé_mistral
PINECONE_API_KEY=votre_clé_pinecone
PINECONE_INDEX_NAME=chatbot
```

**Dans `chaton-ui/.env.local`:**
```
VITE_API_URL=http://localhost:3000
```

### 2. Initialisation de la base de données vectorielle

```bash
cd chatbot

# Créer l'index Pinecone (une fois seulement)
node create-index.js

# Indexer les documents
node embed-documents.js
```

### 3. Démarrage du backend

```bash
cd chatbot
npm run server
# ou: node server.js
```

Le backend sera disponible sur `http://localhost:3000`

Vérification : `curl http://localhost:3000/health`

### 4. Démarrage du frontend

```bash
cd chaton-ui
npm install
npm run dev
```

Le frontend sera disponible sur `http://localhost:5173`

---

## 🧪 Commandes de test en ligne de commande

### Tester le backend directement

**Vérifier que le backend fonctionne :**
```bash
curl http://localhost:3000/health
```

Réponse attendue:
```json
{"status":"ok","provider":"mistral","timestamp":"2026-05-07T08:27:17.711Z"}
```

**Tester le chat :**
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quelles sont les compétences requises?"}'
```

Réponse attendue:
```json
{
  "response": "Voici les compétences requises...",
  "source": "mistral",
  "documentsUsed": 3
}
```

**Tester la pipeline RAG :**
```bash
node rag-pipeline.js
```

### Utiliser curl avec jq (formatage JSON)

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Parle-moi de la fiche de poste"}' | jq .
```

---

## 💻 Tests dans l'application React

### 1. Ouvrir l'interface
Accédez à `http://localhost:5173` dans votre navigateur.

### 2. Créer une conversation
Cliquez sur le bouton **"+ Nouveau chat"** dans la barre latérale.

### 3. Envoyer des messages
Tapez vos questions dans la zone de texte et appuyez sur **Entrée** pour envoyer.

**Exemples de questions :**
- "Quelles sont les compétences requises pour ce poste ?"
- "Raconte-moi la fiche de poste"
- "Qu'est-ce que le chunking ?"
- "Explique les tokens et embeddings"

### 4. Raccourcis clavier
- **Entrée** : Envoyer le message
- **Maj+Entrée** : Nouvelle ligne dans le texte

### 5. Déboguer avec la console navigateur
Ouvrez **DevTools (F12)** → onglet **Console** pour voir :
- 📡 L'URL du backend appelée
- ✓ Le statut de la réponse
- ❌ Les erreurs de connexion

---

## 🎨 Caractéristiques UI/UX

### Design
- **Palette**: Noir et blanc minimaliste
- **Police**: San Francisco (macOS), Segoe UI (Windows), Helvetica (Linux)
- **Responsive**: Desktop, tablette, mobile

### Fonctionnalités
- 💬 Interface de chat intuitive
- 🐱 Avatars distinctifs (utilisateur vs assistant)
- 📱 Design responsive et fluide
- 💾 Gestion de plusieurs conversations
- ⌨️ Support clavier complet
- 🎨 Animations et transitions fluides
- 📝 Indicateur de frappe

---

## 📂 Structure du projet

```
Chatbot/
├── chatbot/                          # Backend (Node.js/Express)
│   ├── server.js                     # Serveur Express + endpoints
│   ├── provider.js                   # Abstraction LLM (Mistral/Groq/OpenAI)
│   ├── rag-pipeline.js               # Pipeline RAG
│   ├── create-index.js               # Création d'index Pinecone
│   ├── embed-documents.js            # Indexation des documents
│   ├── documents/                    # Documents source (FAQ, fiches, etc.)
│   └── .env                          # Variables d'environnement
│
└── chaton-ui/                        # Frontend (React + Vite)
    ├── src/
    │   ├── components/
    │   │   ├── ChatContainer.jsx     # Conteneur principal
    │   │   ├── MessageList.jsx       # Liste des messages
    │   │   ├── Message.jsx           # Composant message
    │   │   ├── InputArea.jsx         # Zone de saisie
    │   │   └── Sidebar.jsx           # Barre de conversations
    │   ├── services/
    │   │   └── chatApiService.js     # Service API (fetch)
    │   ├── config/
    │   │   └── api.js                # Configuration API
    │   ├── styles/                   # Fichiers CSS modulaires
    │   ├── App.jsx                   # App principal
    │   └── main.jsx                  # Point d'entrée
    ├── .env.local                    # Variables d'environnement
    └── package.json
```

---

## 🔧 Configuration des endpoints

### Backend (Express)
- `GET /` - Route racine
- `GET /health` - Vérification du statut
- `POST /chat` - Envoi de message (corps: `{message, conversationId}`)

### Frontend (Vite)
- Point d'entrée: `http://localhost:5173`
- API de base: `http://localhost:3000`

---

## 📚 Comment fonctionne le chatbot RAG

1. **Préparation des documents** (une fois)
   - Les documents sont découpés en chunks (chunks de 500 caractères avec chevauchement)
   - Chaque chunk est vectorisé via Mistral (`mistral-embed` → vecteurs 1024D)
   - Les vecteurs sont stockés dans Pinecone avec métadonnées

2. **Conversation utilisateur** (à chaque message)
   - L'utilisateur envoie une question via le frontend
   - Le frontend appelle l'API backend (`POST /chat`)
   - Le backend reçoit la question et la vectorise
   - Pinecone recherche les documents les plus similaires (Top-K = 3)
   - Les chunks pertinents sont extraits avec leurs sources
   - Mistral génère une réponse en utilisant les chunks comme contexte
   - La réponse complète est renvoyée au frontend avec les sources

3. **Affichage**
   - Le frontend affiche la réponse avec l'indicateur de source
   - L'historique des messages est géré localement (sessionStorage)
   - Les conversations multiples peuvent être créées/supprimées

---

## 🐛 Dépannage

### "Load failed" - Erreur de connexion
- ✅ Vérifier que le backend fonctionne: `curl http://localhost:3000/health`
- ✅ Vérifier les logs dans la console navigateur (F12)
- ✅ Vérifier que MISTRAL_API_KEY est configurée dans `chatbot/.env`

### L'index Pinecone n'existe pas
```bash
cd chatbot
node create-index.js      # Créer l'index
node embed-documents.js   # Indexer les documents
```

### Les réponses sont vides ou incohérentes
- Vérifier que `embed-documents.js` s'est exécuté sans erreur
- Vérifier que les documents dans `chatbot/documents/` existent et ont du contenu
- Vérifier que PINECONE_API_KEY est correcte

---

## 📝 Résumé du projet

Nous avons créé **Chaton**, un chatbot RAG complet combinant une interface React moderne avec une pipeline AI sophistiquée. Le système utilise la **Retrieval-Augmented Generation** : il recherche dans une base vectorielle (Pinecone) les documents pertinents, puis demande à Mistral de générer des réponses basées sur ces documents. Cela garantit des réponses précises, citant les sources. Le frontend offre une expérience ChatGPT-like avec design noir et blanc épuré, historique de conversations, et raccourcis clavier. Le backend expose une API REST simple qui orchestrate la recherche vectorielle et la génération de réponses. L'ensemble est modulaire : on peut changer le LLM (Groq, OpenAI), la plateforme vectorielle, ou personnaliser l'UI sans modifier le cœur du système.

---

## 🛠️ Technologies utilisées

| Composant | Technologie |
|-----------|------------|
| Frontend | React 18.2 + Vite 8.0 |
| Backend | Node.js + Express 4.x |
| CSS | CSS3 (Flexbox, Grid, Animations) |
| LLM | Mistral API |
| Vectorisation | Mistral Embeddings (1024D) |
| Base vectorielle | Pinecone |
| HTTP Client | Fetch API |

---

**Version**: 1.0 | **Date**: Mai 2026 | **Auteur**: Chaton Team 🐱
