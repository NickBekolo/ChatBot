// Configuration de l'API Chaton
const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  ENDPOINTS: {
    CHAT: '/chat',
    CONVERSATIONS: '/conversations',
  },
  TIMEOUT: 30000, // 30 secondes
}

console.log('📡 Configuration API:')
console.log('   Backend URL:', API_CONFIG.BASE_URL)
console.log('   Environment:', import.meta.env.MODE)

export default API_CONFIG
