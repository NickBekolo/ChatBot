# Commandes utiles - Chaton

## 🚀 Démarrage rapide

### Initialisation (une seule fois)

```bash
# 1. Créer l'index Pinecone
cd chatbot
node create-index.js

# 2. Indexer les documents
node embed-documents.js

# 3. Installer les dépendances frontend
cd ../chaton-ui
npm install
```

### Démarrage du projet

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

Puis ouvrir: **http://localhost:5173**

---

## 🧪 Tests en ligne de commande

### Vérifier le backend

```bash
# Santé du serveur
curl http://localhost:3000/health

# Test du chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quelles sont les compétences requises?"}'

# Avec formatage JSON (jq)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Parle de la fiche de poste"}' | jq .
```

### Tests de la pipeline RAG

```bash
cd chatbot

# Vérifier les embeddings
node embed-documents.js

# Lancer la pipeline directement
node rag-pipeline.js
```

---

## 📱 Tests dans l'application

1. Accéder à **http://localhost:5173**
2. Cliquer sur **"+ Nouveau chat"**
3. Envoyer un message
4. Observer la réponse

**Questions d'exemple:**
- "Quelles sont les compétences requises ?"
- "Explique la fiche de poste"
- "C'est quoi les embeddings ?"
- "Raconte moi tout sur le recrutement"

---

## 🐛 Dépannage

### Backend ne répond pas
```bash
# Vérifier que le serveur fonctionne
curl http://localhost:3000/health

# Vérifier les logs pour les erreurs
# Vérifier que MISTRAL_API_KEY est dans chatbot/.env
```

### Index Pinecone introuvable
```bash
cd chatbot
node create-index.js      # Créer l'index
node embed-documents.js   # Indexer les documents
```

### Frontend affiche "Load failed"
1. Ouvrir DevTools (F12)
2. Vérifier la console pour les logs
3. S'assurer que le backend tourne sur port 3000
4. Vérifier que `.env.local` a `VITE_API_URL=http://localhost:3000`

---

## 🔧 Commandes pratiques

```bash
# Tuer les processus sur les ports
lsof -i :3000     # Voir ce qui utilise le port 3000
lsof -i :5173     # Voir ce qui utilise le port 5173

# Nettoyer et réinstaller
cd chaton-ui
rm -rf node_modules package-lock.json
npm install
npm run dev

# Build pour production
npm run build
```

---

## 📊 Vérifier l'état du système

```bash
# Vérifier que Node.js est installé
node --version

# Vérifier npm
npm --version

# Vérifier les variables d'environnement
cat chatbot/.env
cat chaton-ui/.env.local
```

---

**💡 Pro Tips:**
- Utiliser `npm run dev` pour le hot-reload en développement
- Ouvrir F12 dans le navigateur pour déboguer
- Les messages sont stockés en sessionStorage (perdus au refresh)
- Les documents doivent être indexés avec `embed-documents.js` avant de pouvoir poser des questions
