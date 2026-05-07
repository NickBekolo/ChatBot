import { useState, useRef } from 'react'
import '../styles/InputArea.css'

export default function InputArea({ onSendMessage, isLoading }) {
  const [input, setInput] = useState('')
  const textareaRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input)
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e) => {
    setInput(e.target.value)
    // Auto-expand textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px'
    }
  }

  return (
    <div className="input-area">
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question..."
            disabled={isLoading}
            rows="1"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="send-button"
            title="Envoyer (Entrée)"
          >
            ➤
          </button>
        </div>
      </form>
      <p className="input-hint">Utilisez Maj+Entrée pour une nouvelle ligne</p>
    </div>
  )
}
