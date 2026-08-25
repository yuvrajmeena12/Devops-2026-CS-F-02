import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function Chat() {
  const { swapId } = useParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const currentUserId = JSON.parse(localStorage.getItem('user'))._id;
  const bottomRef = useRef(null);

  const load = async () => {
    const { data } = await api.get(`/messages/${swapId}`);
    setMessages(data);
  };

  useEffect(() => {
    load();
    // Simple polling every 4s for near-real-time updates.
    // Upgrade path: replace with Socket.io for true real-time push.
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [swapId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.post('/messages', { swapRequestId: swapId, text });
    setText('');
    load();
  };

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <h2 style={{ marginBottom: 16 }}>Chat</h2>
      <div className="card" style={{ height: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m) => (
          <div
            key={m._id}
            style={{
              alignSelf: m.sender._id === currentUserId ? 'flex-end' : 'flex-start',
              background: m.sender._id === currentUserId ? 'var(--amber)' : '#334155',
              padding: '8px 12px',
              borderRadius: 10,
              maxWidth: '75%',
            }}
          >
            <div style={{ fontSize: 12, opacity: 0.7 }}>{m.sender.name}</div>
            <div style={{ fontSize: 14 }}>{m.text}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." style={{ marginBottom: 0 }} />
        <button className="btn">Send</button>
      </form>
    </div>
  );
}
