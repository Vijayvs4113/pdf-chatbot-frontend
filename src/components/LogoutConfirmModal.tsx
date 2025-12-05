import "./logoutModal.css";

export default function LogoutConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="logout-modal">
        <h3>Are you sure you want to logout?</h3>

        <div className="logout-actions">
          <button className="cancel-btn" onClick={onCancel}>
            No
          </button>

          <button className="confirm-btn" onClick={onConfirm}>
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}
