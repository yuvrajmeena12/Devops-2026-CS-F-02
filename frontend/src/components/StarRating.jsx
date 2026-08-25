export default function StarRating({ value, onChange, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="stars" style={{ fontSize: readOnly ? 14 : 24, cursor: readOnly ? 'default' : 'pointer' }}>
      {stars.map((s) => (
        <span key={s} onClick={() => !readOnly && onChange && onChange(s)}>
          {s <= value ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}
