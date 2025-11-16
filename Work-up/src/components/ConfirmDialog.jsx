import "../css/ConfirmDialog.css";

export default function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <p>{message}</p>
        <div className="buttons">
          <button className="confirm-btn" onClick={onConfirm}>
            Sim
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            Não
          </button>
        </div>
      </div>
    </div>
  );
}
