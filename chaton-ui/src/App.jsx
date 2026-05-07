import { useState } from 'react'
import './App.css'
import ChatContainer from './components/ChatContainer'
import Sidebar from './components/Sidebar'

function App() {
  const [conversations, setConversations] = useState([
    { id: 1, title: 'Nouvelle conversation', messages: [] }
  ])
  const [activeConversationId, setActiveConversationId] = useState(1)

  const addNewConversation = () => {
    const newId = Math.max(...conversations.map(c => c.id), 0) + 1
    const newConversation = {
      id: newId,
      title: 'Nouvelle conversation',
      messages: []
    }
    setConversations([...conversations, newConversation])
    setActiveConversationId(newId)
  }

  const deleteConversation = (id) => {
    const filtered = conversations.filter(c => c.id !== id)
    setConversations(filtered)
    if (activeConversationId === id && filtered.length > 0) {
      setActiveConversationId(filtered[0].id)
    }
  }

  const updateConversation = (id, updates) => {
    setConversations(conversations.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ))
  }

  const activeConversation = conversations.find(c => c.id === activeConversationId)

  return (
    <div className="app">
        <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={addNewConversation}
        onDeleteConversation={deleteConversation}
      />
      {activeConversation && (
        <ChatContainer
          conversation={activeConversation}
          onUpdateConversation={(updates) => updateConversation(activeConversation.id, updates)}
        />
      )}
    </div>
  )
}

export default App
