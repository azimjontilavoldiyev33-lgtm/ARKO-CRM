export default function LoginScreen({
  code,
  error,
  loading,
  onDigit,
  onDelete,
}: {
  code: string;
  error: string;
  loading: boolean;
  onDigit: (d: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="wp-login">
      <div className="wp-login-icon">🔐</div>
      <div className="wp-login-title">Ishchi kirishi</div>
      <div className="wp-login-sub">4 XONALI KODINGIZNI KIRITING</div>

      {/* Code display */}
      <div className="wp-code-display">
        {[0,1,2,3].map(i => (
          <div key={i} className={`wp-code-dot ${i < code.length ? 'filled' : ''}`}>
            {i < code.length ? '•' : ''}
          </div>
        ))}
      </div>

      {/* Numpad */}
      <div className="wp-numpad">
        {['1','2','3','4','5','6','7','8','9'].map(d => (
          <button key={d} className="wp-num-btn" onClick={() => onDigit(d)}>
            {d}
          </button>
        ))}
        <div />
        <button className="wp-num-btn" onClick={() => onDigit('0')}>0</button>
        <button className="wp-del-btn" onClick={onDelete}>⌫</button>
      </div>

      {error && <div className="wp-error">{error}</div>}
      {loading && (
        <div className="wp-loading-bar">
          <div className="wp-loading-fill" />
        </div>
      )}
    </div>
  );
}
