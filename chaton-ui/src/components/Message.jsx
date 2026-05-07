import '../styles/Message.css'

export default function Message({ message }) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🐱'}
      </div>
      <div className="message-content">
        {message.content}
      </div>
    </div>
  )
}
