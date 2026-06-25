function ConfirmModal({ isOpen, message, confirmText = '확인', onConfirm }) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="ofme-modal__overlay" role="presentation">
      <div className="ofme-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <h2 id="confirm-modal-title" className="ofme-modal__title">
          알림
        </h2>
        <p className="ofme-modal__message">{message}</p>
        <button type="button" className="ofme-modal__button" onClick={onConfirm}>
          {confirmText}
        </button>
      </div>
    </div>
  )
}

export default ConfirmModal
