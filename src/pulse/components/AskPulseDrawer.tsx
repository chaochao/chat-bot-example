import { useState, useEffect } from 'react'
import { X, Sparkles, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface AskPulseDrawerProps {
  open: boolean
  onClose: () => void
}

export function AskPulseDrawer({ open, onClose }: AskPulseDrawerProps) {
  const [input, setInput] = useState('')
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const t = setTimeout(() => setVisible(true), 16)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), 250)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!mounted) return null

  return (
    <div
      className={`absolute left-0 top-0 h-full w-80 bg-white border-r border-[#dddddd] shadow-xl z-10 flex flex-col transition-transform duration-[250ms] ease-out ${visible ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#dddddd]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#4f86c6]" />
          <span className="font-semibold text-sm text-[#222222]">Ask Pulse</span>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[#6a6a6a] hover:bg-[#f2f2f2] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#4f86c6]/10 flex items-center justify-center">
          <Sparkles size={22} className="text-[#4f86c6]" />
        </div>
        <div>
          <p className="font-semibold text-[#222222] text-sm">Good morning!</p>
          <p className="text-[#6a6a6a] text-xs mt-1 leading-relaxed">
            Ask me anything about your staffing schedule — coverage gaps, rotation fairness, or upcoming demand.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-center">
          {['Plan', 'Analyze', 'Optimize'].map((label) => (
            <button
              key={label}
              className="px-3 py-1 rounded-full text-xs font-medium border border-[#dddddd] text-[#222222] hover:bg-[#f7f7f7] transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-[#dddddd]">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pulse..."
            rows={2}
            className="resize-none text-sm flex-1"
          />
          <Button size="icon" className="h-9 w-9 flex-none" disabled={!input.trim()}>
            <Send size={14} />
          </Button>
        </div>
        <p className="text-[10px] text-[#929292] text-center mt-2">AI features available in Step 2</p>
      </div>
    </div>
  )
}
