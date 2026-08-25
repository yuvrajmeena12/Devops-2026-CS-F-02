import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ScheduleModal from '../components/ScheduleModal';
import ReviewModal from '../components/ReviewModal';
import SwapStepper from '../components/SwapStepper';

export default function MySwaps() {
  const [tab, setTab] = useState('active');
  const [incoming, setIncoming] = useState([]);
  const [sent, setSent] = useState([]);
  const [active, setActive] = useState([]);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [reviewFor, setReviewFor] = useState(null);
  const [sessionsBySwap, setSessionsBySwap] = useState({});
  const currentUserId = JSON.parse(localStorage.getItem('user'))._id;

  const load = async () => {
    const [i, s, a] = await Promise.all([
      api.get('/swaps/incoming'),
      api.get('/swaps/sent'),
      api.get('/swaps/active'),
    ]);
    setIncoming(i.data.filter((x) => x.status === 'pending'));
    setSent(s.data.filter((x) => x.status === 'pending'));
    setActive(a.data);

    const sessionMap = {};
    await Promise.all(
      a.data.map(async (swap) => {
        const { data } = await api.get(`/sessions/swap/${swap._id}`);
        if (data.length > 0) sessionMap[swap._id] = data[0];
      })
    );
    setSessionsBySwap(sessionMap);
  };

  useEffect(() => { load(); }, []);

  const handleConfirmSession = async (sessionId) => {
    await api.put(`/sessions/${sessionId}/confirm`);
    load();
  };
  const handleAccept = async (id) => { await api.put(`/swaps/${id}/accept`); load(); };
  const handleDecline = async (id) => { await api.put(`/swaps/${id}/decline`); load(); };

  // Compute which of the 5 stepper stages this swap is currently at.
  const getStep = (swap) => {
    const session = sessionsBySwap[swap._id];
    if (swap.status === 'completed') return 'completed';
    if (!session) return 'accepted';
    if (session.confirmedByFrom && session.confirmedByTo) return 'confirmed';
    return 'scheduled';
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: 4 }}>My Swaps</h2>
      <p style={{ color: 'var(--ink-muted)', fontSize: 14, marginBottom: 20 }}>
        Track every swap from request to completion in one place.
      </p>

      <div className="tabs">
        <div className={`tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          In Progress {active.length > 0 && `(${active.length})`}
        </div>
        <div className={`tab ${tab === 'incoming' ? 'active' : ''}`} onClick={() => setTab('incoming')}>
          Requests to You {incoming.length > 0 && `(${incoming.length})`}
        </div>
        <div className={`tab ${tab === 'sent' ? 'active' : ''}`} onClick={() => setTab('sent')}>
          Requests You Sent {sent.length > 0 && `(${sent.length})`}
        </div>
      </div>

      {tab === 'active' && (
        active.length ? active.map((s) => {
          const session = sessionsBySwap[s._id];
          const iAmFrom = s.fromUser._id === currentUserId;
          const otherUser = iAmFrom ? s.toUser : s.fromUser;
          const iHaveConfirmed = session && (iAmFrom ? session.confirmedByFrom : session.confirmedByTo);
          const bothConfirmed = session && session.confirmedByFrom && session.confirmedByTo;
          const step = getStep(s);

          return (
            <div key={s._id} className="ticket">
              <div className="ticket-eyebrow">Swap with {otherUser.name}</div>
              <div className="ticket-exchange">
                <span>{s.offeredSkill.title}</span>
                <span className="arrow">⇄</span>
                <span>{s.requestedSkill.title}</span>
              </div>

              <SwapStepper currentStep={step} />

              {session && step === 'scheduled' && (
                <p style={{ fontSize: 12, color: 'var(--paper-muted)', marginBottom: 10 }}>
                  📅 {new Date(session.scheduledDateTime).toLocaleString()} · {session.mode}
                  {' — '}{iHaveConfirmed ? 'waiting on them to confirm' : 'awaiting your confirmation'}
                </p>
              )}
              {session && step === 'confirmed' && (
                <p style={{ fontSize: 12, color: 'var(--paper-muted)', marginBottom: 10 }}>
                  📅 {new Date(session.scheduledDateTime).toLocaleString()} · {session.mode} — locked in
                </p>
              )}

              <div className="ticket-divider" />
              <div className="ticket-row">
                <Link to={`/chat/${s._id}`} className="btn btn-sm btn-outline">Message</Link>

                {/* One primary action, driven by the current step — no guessing which button to press */}
                {step === 'accepted' && (
                  <button className="btn btn-sm" onClick={() => setScheduleFor(s)}>Propose a time</button>
                )}
                {step === 'scheduled' && !iHaveConfirmed && (
                  <button className="btn btn-sm" onClick={() => handleConfirmSession(session._id)}>Confirm time</button>
                )}
                {step === 'scheduled' && iHaveConfirmed && (
                  <span className="badge badge-pending">Waiting on {otherUser.name}</span>
                )}
                {step === 'confirmed' && (
                  <button className="btn btn-sm btn-teal" onClick={() => setReviewFor(s)}>Mark session done</button>
                )}
                {step === 'completed' && (
                  <span className="badge badge-accepted">Swap complete</span>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="empty-state">
            <div className="icon">⇄</div>
            <p>No swaps in progress yet.</p>
            <Link to="/matches" className="btn btn-sm" style={{ marginTop: 14, display: 'inline-block' }}>Find a match</Link>
          </div>
        )
      )}

      {tab === 'incoming' && (
        incoming.length ? incoming.map((swap) => (
          <div key={swap._id} className="ticket">
            <div className="ticket-eyebrow">{swap.fromUser.name} wants to swap</div>
            <div className="ticket-exchange">
              <span>They teach: {swap.offeredSkill.title}</span>
              <span className="arrow">⇄</span>
              <span>For your: {swap.requestedSkill.title}</span>
            </div>
            {swap.message && <p style={{ fontSize: 13, marginTop: 8, fontStyle: 'italic' }}>"{swap.message}"</p>}
            <div className="ticket-divider" />
            <div className="ticket-row">
              <button className="btn btn-sm btn-danger" onClick={() => handleDecline(swap._id)}>Decline</button>
              <button className="btn btn-sm btn-teal" onClick={() => handleAccept(swap._id)}>Accept swap</button>
            </div>
          </div>
        )) : (
          <div className="empty-state"><div className="icon">📥</div><p>No incoming requests right now.</p></div>
        )
      )}

      {tab === 'sent' && (
        sent.length ? sent.map((swap) => (
          <div key={swap._id} className="ticket">
            <div className="ticket-eyebrow">Sent to {swap.toUser.name}</div>
            <div className="ticket-exchange">
              <span>You offer: {swap.offeredSkill.title}</span>
              <span className="arrow">⇄</span>
              <span>For their: {swap.requestedSkill.title}</span>
            </div>
            <div className="ticket-divider" />
            <div className="ticket-row">
              <span className="badge badge-pending">Waiting for {swap.toUser.name} to respond</span>
            </div>
          </div>
        )) : (
          <div className="empty-state"><div className="icon">📤</div><p>You haven't sent any requests yet.</p></div>
        )
      )}

      {scheduleFor && <ScheduleModal swap={scheduleFor} onClose={() => { setScheduleFor(null); load(); }} />}
      {reviewFor && <ReviewModal swap={reviewFor} onClose={() => { setReviewFor(null); load(); }} />}
    </div>
  );
}
