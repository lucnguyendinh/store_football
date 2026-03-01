interface LoadingOverlayProps {
  text?: string
}

export default function LoadingOverlay({ text = 'Đang tải dữ liệu...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
        <span className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <span className="text-sm font-medium text-gray-700">{text}</span>
      </div>
    </div>
  )
}
