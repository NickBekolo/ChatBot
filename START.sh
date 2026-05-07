#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════╗
# ║           CHATON - Script de démarrage complet               ║
# ║    Démarre backend et frontend dans des terminals séparés    ║
# ╚═══════════════════════════════════════════════════════════════╝

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/chatbot"
FRONTEND_DIR="$PROJECT_ROOT/chaton-ui"

echo "🚀 Démarrage de Chaton..."
echo ""

# Vérifier que les répertoires existent
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Erreur: Dossier backend introuvable: $BACKEND_DIR"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Erreur: Dossier frontend introuvable: $FRONTEND_DIR"
    exit 1
fi

# Vérifier les fichiers .env
echo "📋 Vérification de la configuration..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "⚠️  Attention: $BACKEND_DIR/.env non trouvé"
    echo "   Créez-le avec vos clés API (MISTRAL_API_KEY, PINECONE_API_KEY)"
fi

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    echo "⚠️  Attention: $FRONTEND_DIR/.env.local non trouvé"
    echo "   Créez-le avec: VITE_API_URL=http://localhost:3000"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖥️  BACKEND - Démarrage sur le port 3000..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ouvrir un nouveau terminal avec le backend
osascript <<EOF
tell application "Terminal"
    activate
    create window with default settings
    tell the front window
        do script "cd \"$BACKEND_DIR\" && npm run server"
    end tell
end tell
EOF

sleep 3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚛️  FRONTEND - Démarrage sur le port 5173..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ouvrir un nouveau terminal avec le frontend
osascript <<EOF
tell application "Terminal"
    activate
    create window with default settings
    tell the front window
        do script "cd \"$FRONTEND_DIR\" && npm run dev"
    end tell
end tell
EOF

echo ""
echo "✅ Chaton est en cours de démarrage!"
echo ""
echo "📱 Frontend  : http://localhost:5173"
echo "🔌 Backend   : http://localhost:3000"
echo ""
echo "💡 Tip: Attendez quelques secondes que les deux serveurs démarrent."
echo "   Ouvrez http://localhost:5173 dans votre navigateur."
echo ""
