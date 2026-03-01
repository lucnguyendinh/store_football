'use client'

interface ConfirmModalProps {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmText?: string
  confirmVariant?: 'danger' | 'primary'
}

export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmText = 'Xác nhận',
  confirmVariant = 'danger',
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            {confirmVariant === 'danger' && (
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-gray-600 text-sm mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1" disabled={loading}>
              Hủy
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={confirmVariant === 'danger' ? 'btn-danger flex-1' : 'btn-primary flex-1'}
            >
              {loading ? 'Đang xử lý...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
