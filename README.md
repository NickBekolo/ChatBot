# Chaton - Chatbot RAG avec Interface React

Un chatbot intelligent combinant une interface React moderne avec une pipeline AI sophistiquée utilisant **Retrieval-Augmented Generation (RAG)**. Alimenté par **Mistral LLM** et **Pinecone** pour des réponses précises basées sur des documents.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Node](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

##  Vue d'ensemble

**Chaton** est un chatbot complet qui répond aux questions en recherchant les documents pertinents dans une base vectorielle, puis en générant des réponses intelligentes avec citations des sources.

### Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                     Interface React (5173)                   │
│   ChatContainer → MessageList → InputArea → Sidebar         │
└──────────────────────┬──────────────────────────────────────┘
                       │ Fetch API
                       ↓
┌─────────────────────────────────────────────────────────────┐
│            Express Backend (3000) - RAG Pipeline            │
│   /chat endpoint → Query Vectorization → Search in DB      │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴───────────────┐
       ↓                       ↓
  Pinecone DB            Mistral LLM
  (Vector Search)        (Response Generation)
```

---

##  Démarrage rapide

### Prérequis
- Node.js v18+
- Clés API : [Mistral](https://mistral.ai) et [Pinecone](https://www.pinecone.io)

### 1️ Installation

```bash
# Cloner le repo
git clone https://github.com/NickBekolo/ChatBot.git
cd ChatBot

# Installer les dépendances
cd chaton-ui && npm install
cd ../chatbot && npm install
```

### 2️ Configuration

Créer `chatbot/.env`:
```env
LLM_PROVIDER=mistral
MISTRAL_API_KEY=votre_clé_mistral
PINECONE_API_KEY=votre_clé_pinecone
PINECONE_INDEX_NAME=chatbot
```

Créer `chaton-ui/.env.local`:
```env
VITE_API_URL=http://localhost:3000
```

### 3️ Initialiser la base de données

```bash
cd chatbot

# Créer l'index Pinecone (une seule fois)
node create-index.js

# Indexer les documents
node embed-documents.js
```

### 4️ Démarrage

**Terminal 1 - Backend:**
```bash
cd chatbot
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd chaton-ui
npm run dev
```

Ouvrir: **http://localhost:5173**

---

## 📁 Structure du projet

```
ChatBot/
├──  README.md                    # Ce fichier
├──  COMMANDS.md                  # Toutes les commandes utiles
├──  START.sh                     # Script de démarrage automatique
├── Rd/                             # Documentation et guides
│   ├── COMMANDS.md                 # Commands de test
│   └── START.sh                    # Auto-start script
│
├──  chaton-ui/                   # Frontend React
│   ├── src/
│   │   ├── components/             # Composants React
│   │   │   ├── ChatContainer.jsx   # Conteneur principal
│   │   │   ├── MessageList.jsx     # Liste des messages
│   │   │   ├── Message.jsx         # Message individuel
│   │   │   ├── InputArea.jsx       # Zone de saisie
│   │   │   └── Sidebar.jsx         # Barre de conversations
│   │   ├── services/
│   │   │   └── chatApiService.js   # Service API (fetch)
│   │   ├── config/
│   │   │   └── api.js              # Configuration API
│   │   ├── styles/                 # CSS modulaires
│   │   ├── App.jsx                 # App principal
│   │   └── main.jsx                # Point d'entrée
│   ├── README.md                   # Guide complet du frontend
│   ├── package.json
│   └── vite.config.js
│
└──  chatbot/                     # Backend Node.js
    ├── server.js                   # Serveur Express
    ├── rag-pipeline.js             # Pipeline RAG complète
    ├── provider.js                 # Abstraction LLM
    ├── create-index.js             # Créer index Pinecone
    ├── embed-documents.js          # Indexer documents
    ├── documents/                  # Documents source
    │   ├── competences_tech.txt
    │   ├── faq_rh.txt
    │   ├── fiche_poste.txt
    │   └── guide_entretien.txt
    ├── package.json
    └── .env.example
```

---

##  Utilisation

### 1. Interface du navigateur
- Accéder à **http://localhost:5173**
- Cliquer **"+ Nouveau chat"** pour créer une conversation
- Taper une question et appuyer sur **Entrée**

### 2. Tests en ligne de commande

```bash
# Vérifier le backend
curl http://localhost:3000/health

# Tester le chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quelles sont les compétences requises?"}'

# Avec formatage JSON
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Parle-moi de la fiche de poste"}' | jq .
```

### 3. Questions d'exemple
- "Quelles sont les compétences requises pour ce poste ?"
- "Raconte-moi la fiche de poste"
- "Qu'est-ce que les embeddings ?"
- "Explique les tokens et leur impact"

---

## 🔧 Configuration des endpoints

### Backend (Express)
| Endpoint | Méthode | Corps | Description |
|----------|---------|-------|------------|
| `/` | GET | - | Route racine |
| `/health` | GET | - | Vérifier l'état |
| `/chat` | POST | `{message, conversationId}` | Envoyer un message |

### Frontend (Vite)
- **URL**: http://localhost:5173
- **API Base**: http://localhost:3000
- **Configurable via**: `chaton-ui/.env.local` (`VITE_API_URL`)

---

##  Comment fonctionne le RAG

### Phase 1: Préparation (une seule fois)
1. **Chunking** - Documents découpés en morceaux (500 chars avec chevauchement)
2. **Vectorisation** - Chaque chunk transformé en vecteur 1024D via Mistral
3. **Stockage** - Vecteurs + métadonnées stockés dans Pinecone

### Phase 2: Chat (à chaque message)
1. **Utilisateur** envoie une question
2. **Frontend** appelle `POST /chat` du backend
3. **Backend** vectorise la question (même modèle Mistral)
4. **Pinecone** recherche les 3 documents les plus similaires
5. **Mistral** génère une réponse basée sur ces documents
6. **Réponse** renvoyée au frontend avec citations

---

##  Design UI/UX

### Caractéristiques
-  **Interface intuitive** - Style ChatGPT
-  **Design épuré** - Noir et blanc minimaliste
-  **Responsive** - Desktop, tablette, mobile
-  **Multi-conversations** - Créer/gérer plusieurs chats
-  **Raccourcis clavier** - Entrée pour envoyer, Maj+Entrée pour nouveau ligne
-  **Animations** - Transitions fluides et indicateur de frappe

### Palette de couleurs
```
Blanc:          #ffffff
Noir primaire:  #0d0d0d
Gris clair:     #f7f7f8
Gris bordure:   #e5e5e5
Gris texte:     #8b8b99, #565869, #c5c5c5
```

---

##  Technologies

| Composant | Tech |
|-----------|------|
| **Frontend** | React 18.2 + Vite 8.0 |
| **Backend** | Node.js + Express 4.x |
| **CSS** | CSS3 (Flexbox, Grid, Animations) |
| **LLM** | Mistral API |
| **Embeddings** | Mistral (1024D) |
| **Vector DB** | Pinecone |
| **HTTP** | Fetch API |

---

##  Documentation

- **[chaton-ui/README.md](chaton-ui/README.md)** - Guide complet du frontend
- **[chatbot/README.md](chatbot/README.md)** - Guide du backend
- **[COMMANDS.md](COMMANDS.md)** - Commandes de test
- **[Rd/COMMANDS.md](Rd/COMMANDS.md)** - Référence rapide

---

##  Dépannage

### "Load failed" dans l'interface
```bash
# 1. Vérifier le backend
curl http://localhost:3000/health

# 2. Vérifier les logs navigateur (F12)

# 3. Vérifier MISTRAL_API_KEY dans chatbot/.env
cat chatbot/.env | grep MISTRAL
```

### Index Pinecone inexistant
```bash
cd chatbot
node create-index.js      # Créer
node embed-documents.js   # Indexer
```

### Port déjà utilisé
```bash
# Trouver et tuer le processus
lsof -i :3000             # Backend
lsof -i :5173             # Frontend
```

---

##  Optimisations futures

- [ ] Support multi-utilisateurs avec authentification
- [ ] Historique persistant avec base de données
- [ ] Support d'autres LLMs (GPT-4, Claude, Llama)
- [ ] Interface en temps réel avec WebSockets
- [ ] Analyse de sentiments
- [ ] Feedback utilisateur sur les réponses

---

##  Résumé du projet

**Chaton** combine une interface React moderne avec une architecture RAG sophistiquée. Le système recherche les documents pertinents dans Pinecone, puis utilise Mistral pour générer des réponses contextuelles avec citations. L'ensemble est modulaire, permettant de changer facilement le LLM, la plateforme vectorielle ou personnaliser l'UI. Parfait pour des chatbots d'entreprise basés sur des connaissances internes.

---

##  Licence

MIT License - Voir [LICENSE](LICENSE)

---

##  Auteur

**NickBekolo** - [GitHub](https://github.com/NickBekolo)

---

##  Contribution

Les contributions sont bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

---

**Dernière mise à jour**: Mai 2026 | **Version**: 1.0
