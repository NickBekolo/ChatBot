import API_CONFIG from '../config/api'

class ChatAPIService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
    this.timeout = API_CONFIG.TIMEOUT
  }

  async sendMessage(message, conversationId) {
    try {
      const url = `${this.baseURL}${API_CONFIG.ENDPOINTS.CHAT}`
      console.log('🔌 Envoi vers:', url)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log('✓ Réponse reçue:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erreur serveur:', errorText)
        throw new Error(`Erreur API ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✓ Données parsées:', data)
      return {
        success: true,
        response: data.response || data.message || 'Réponse vide'
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('⏱️ Timeout')
        return {
          success: false,
          error: 'Timeout - la requête a pris trop de temps. Vérifiez que le backend fonctionne.'
        }
      }
      console.error('❌ Erreur API:', error.message)
      
      let errorMsg = error.message
      if (error.message.includes('Failed to fetch')) {
        errorMsg = 'Impossible de se connecter au backend. Vérifiez que le serveur fonctionne sur http://localhost:3000'
      }
      
      return {
        success: false,
        error: errorMsg || 'Erreur de connexion au serveur'
      }
    }
  }

  async getConversations() {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.ENDPOINTS.CONVERSATIONS}`)
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations:', error)
      return []
    }
  }
}

export default new ChatAPIService()
