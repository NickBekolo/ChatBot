import '../styles/Sidebar.css'

export default function Sidebar({ 
  conversations, 
  activeConversationId, 
  onSelectConversation, 
  onNewConversation,
  onDeleteConversation 
}) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={onNewConversation}>
          + Nouveau chat
        </button>
      </div>

      <div className="conversations-list">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <span className="conversation-title">{conv.title}</span>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation()
                onDeleteConversation(conv.id)
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="footer-text">Chaton v1.0</div>
      </div>
    </div>
  )
}
