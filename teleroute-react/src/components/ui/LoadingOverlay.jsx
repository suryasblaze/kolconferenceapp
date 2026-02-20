export default function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
      <p className="text-slate-600 font-medium">{message}</p>
    </div>
  );
}
