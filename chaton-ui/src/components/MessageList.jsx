import '../styles/MessageList.css'
import Message from './Message'

export default function MessageList({ messages, isLoading }) {
  if (messages.length === 0) {
    return (
      <div className="messages-container empty">
        <div className="empty-state">
          <h2>Bienvenue dans Chaton</h2>
          <p>Posez-moi vos questions sur nos métiers, notre culture et nos processus de recrutement</p>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-container">
      <div className="messages-inner">
        {messages.map(msg => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
