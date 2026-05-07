import { useState, useRef, useEffect } from 'react'
import '../styles/ChatContainer.css'
import MessageList from './MessageList'
import InputArea from './InputArea'
import chatApiService from '../services/chatApiService'

export default function ChatContainer({ conversation, onUpdateConversation }) {
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation.messages])

  const handleSendMessage = async (text) => {
    if (!text.trim()) return

    // Ajouter le message utilisateur
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    const updatedMessages = [...conversation.messages, userMessage]
    
    // Mettre à jour le titre de la conversation si c'est le premier message
    let updates = { messages: updatedMessages }
    if (conversation.messages.length === 0) {
      updates.title = text.substring(0, 50)
    }
    
    onUpdateConversation(updates)

    // Appel à l'API backend
    setIsLoading(true)
    try {
      const result = await chatApiService.sendMessage(text, conversation.id)
      
      if (result.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        }
        onUpdateConversation({
          messages: [...updatedMessages, assistantMessage]
        })
      } else {
        const errorMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: `Erreur: ${result.error}`,
          timestamp: new Date(),
          isError: true
        }
        onUpdateConversation({
          messages: [...updatedMessages, errorMessage]
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h1>Chaton</h1>
      </div>
      
      <MessageList 
        messages={conversation.messages}
        isLoading={isLoading}
      />
      
      <div ref={messagesEndRef} />
      
      <InputArea 
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  )
}
