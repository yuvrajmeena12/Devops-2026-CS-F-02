import { useState } from 'react';
import api from '../api/axios';
import StarRating from './StarRating';

export default function ReviewModal({ swap, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  // Determine the "other" user to review (works whether current user is fromUser or toUser)
  const currentUserId = JSON.parse(localStorage.getItem('user'))._id;
  const revieweeId = swap.fromUser._id === currentUserId ? swap.toUser._id : swap.fromUser._id;

  const handleSubmit = async () => {
    setError('');
    try {
      // In a full build, fetch the session id linked to this swap first.
      // For simplicity here we call complete on the swap's most recent session via backend logic.
      const { data: sessions } = await api.get(`/sessions/swap/${swap._id}`);
      const latestSession = sessions[0];
      if (!latestSession) { setError('No scheduled session found for this swap yet.'); return; }

      await api.put(`/sessions/${latestSession._id}/complete`);
      await api.post('/reviews', { sessionId: latestSession._id, revieweeId, rating, comment });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="card" style={{ maxWidth: 420, width: '90%' }}>
        <h3 style={{ marginBottom: 10 }}>Rate this Swap</h3>
        {error && <p className="error-text">{error}</p>}
        <StarRating value={rating} onChange={setRating} />
        <label style={{ marginTop: 10 }}>Comment</label>
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn" onClick={handleSubmit}>Submit Review</button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
