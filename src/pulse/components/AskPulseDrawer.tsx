export function AskPulseDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute left-0 top-0 h-full w-80 bg-white border-r border-[#dddddd] shadow-lg z-10 flex items-center justify-center">
      <button onClick={onClose} className="text-sm text-[#6a6a6a]">Close (stub)</button>
    </div>
  )
}
