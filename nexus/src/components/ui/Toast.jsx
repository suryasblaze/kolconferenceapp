export default function Toast({ message, type = 'success' }) {
  return (
    <div className="toast-container">
      <div className={`toast ${type}`}>
        {message}
      </div>
    </div>
  );
}
