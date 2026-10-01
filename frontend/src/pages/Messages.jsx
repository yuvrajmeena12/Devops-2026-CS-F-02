import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RequestSwapModal from '../components/RequestSwapModal';

export default function Messages() {
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  const targetSwapId = searchParams.get('swap');

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [swapModalSkill, setSwapModalSkill] = useState(null);

  const bottomRef = useRef(null);

  // Load list of conversations
  const loadConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConv(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // When targetUserId is specified in query param, select or load that user
  useEffect(() => {
    if (targetUserId) {
      const existing = conversations.find((c) => c.user?._id === targetUserId);
      if (existing) {
        setActiveUser(existing.user);
      } else {
        // Fetch user profile
        api.get(`/auth/user/${targetUserId}`).then(({ data }) => {
          setActiveUser(data);
        }).catch(() => {});
      }
    } else if (conversations.length > 0 && !activeUser) {
      setActiveUser(conversations[0].user);
    }
  }, [targetUserId, conversations]);

  // Load messages with active user
  const loadMessages = async () => {
    if (!activeUser) return;
    try {
      const { data } = await api.get(`/messages/user/${activeUser._id}`);
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!activeUser) return;
    setLoadingMessages(true);
    loadMessages().finally(() => setLoadingMessages(false));

    const interval = setInterval(loadMessages, 3500);
    return () => clearInterval(interval);
  }, [activeUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUser) return;

    const messageText = text.trim();
    setText('');

    try {
      const { data: newMsg } = await api.post('/messages', {
        toUser: activeUser._id,
        text: messageText,
        swapRequestId: targetSwapId || undefined,
      });
      setMessages((prev) => [...prev, newMsg]);
      loadConversations();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send message');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.2rem)', fontWeight: 800, marginBottom: 4 }}>
          Direct Communication Hub
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14.5, margin: 0 }}>
          Coordinate logistics, share session details, and align expectations before exchanging skills.
        </p>
      </div>

      {/* Main Messenger Panel */}
      <div 
        className="card" 
        style={{ 
          padding: 0, 
          overflow: 'hidden', 
          display: 'grid', 
          gridTemplateColumns: 'minmax(260px, 320px) 1fr', 
          minHeight: '620px',
          height: 'calc(100vh - 240px)'
        }}
      >
        {/* Left: Conversation List */}
        <div style={{ 
          borderRight: '1px solid var(--border-subtle)', 
          background: 'rgba(9, 13, 23, 0.75)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Conversations
            </span>
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 'var(--radius-pill)', color: 'var(--text-muted)' }}>
              {conversations.length}
            </span>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loadingConv && (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Loading conversations...
              </div>
            )}

            {!loadingConv && conversations.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No active conversations yet. Reach out to a skill provider via Explore or Smart Match.
              </div>
            )}

            {conversations.map((c) => {
              const isActive = activeUser && activeUser._id === c.user?._id;
              return (
                <div
                  key={c.user?._id}
                  onClick={() => {
                    setActiveUser(c.user);
                    setSearchParams({ user: c.user._id });
                  }}
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    background: isActive ? 'linear-gradient(90deg, rgba(99,102,241,0.18), rgba(6,182,212,0.12))' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0
                    }}
                  >
                    {c.user?.name?.charAt(0).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.user?.name}
                      </span>
                      {c.unreadCount > 0 && (
                        <span className="nav-badge" style={{ position: 'static' }}>
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {c.lastMessage?.text || 'No messages yet'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Message Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(13, 18, 31, 0.5)' }}>
          {activeUser ? (
            <>
              {/* Active Conversation Top Bar */}
              <div style={{ 
                padding: '14px 24px', 
                borderBottom: '1px solid var(--border-subtle)', 
                background: 'rgba(9, 13, 23, 0.8)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-cyan))',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {activeUser.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{activeUser.name}</span>
                      {activeUser.isVerified && (
                        <span style={{ fontSize: 9.5, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', padding: '2px 6px', borderRadius: 'var(--radius-pill)', fontWeight: 800 }}>
                          ✓ VERIFIED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {activeUser.email}
                    </div>
                  </div>
                </div>

                <Link to={`/profile/${activeUser._id}`} className="btn btn-sm btn-outline">
                  View Profile
                </Link>
              </div>

              {/* Chat Message Bubble Container */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {loadingMessages && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, margin: 'auto' }}>
                    Loading message history...
                  </div>
                )}

                {!loadingMessages && messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, margin: 'auto' }}>
                    Send a message to introduce yourself and propose a swap.
                  </div>
                )}

                {messages.map((m) => {
                  const isMine = m.fromUser === currentUser?._id || m.fromUser?._id === currentUser?._id;
                  return (
                    <div
                      key={m._id}
                      style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '72%',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 18px',
                          borderRadius: isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          background: isMine 
                            ? 'linear-gradient(135deg, var(--accent-primary), #4f46e5)' 
                            : 'rgba(26, 36, 61, 0.85)',
                          color: '#ffffff',
                          fontSize: 14,
                          lineHeight: 1.5,
                          border: isMine ? 'none' : '1px solid var(--border-glass)',
                          boxShadow: isMine ? '0 4px 14px rgba(99,102,241,0.25)' : 'var(--shadow-sm)',
                        }}
                      >
                        {m.text}
                      </div>
                      <div style={{ 
                        fontSize: 10.5, 
                        color: 'var(--text-muted)', 
                        marginTop: 4, 
                        textAlign: isMine ? 'right' : 'left' 
                      }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Message Input Field Form */}
              <form onSubmit={handleSendMessage} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(9, 13, 23, 0.9)', display: 'flex', gap: 10 }}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message or propose a schedule..."
                  style={{ marginBottom: 0, flex: 1, padding: '12px 18px', fontSize: 14 }}
                />
                <button type="submit" className="btn" style={{ padding: '0 24px', flexShrink: 0 }}>
                  <span>➤</span> Send
                </button>
              </form>
            </>
          ) : (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <h3 style={{ fontSize: 18, color: 'var(--text-main)', marginBottom: 6 }}>Select a Conversation</h3>
              <p style={{ fontSize: 13.5 }}>Pick a member from the left sidebar to read and send messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
