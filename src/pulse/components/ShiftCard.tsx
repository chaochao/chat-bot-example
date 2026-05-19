import { Sun, Moon } from 'lucide-react'
import type { Department, Shift } from '@/pulse/types'

const MAX_VISIBLE = 3

interface ShiftCardProps {
  department: Department
  shifts: Shift[]
  onCardClick: (shifts: Shift[], e: React.MouseEvent) => void
}

export function ShiftCard({ department, shifts, onCardClick }: ShiftCardProps) {
  const bg = `${department.color}15`
  const visible = shifts.slice(0, MAX_VISIBLE)
  const overflow = shifts.length - MAX_VISIBLE

  return (
    <div
      className="rounded-md mb-0.5 border-l-[2px] select-none w-full text-left overflow-hidden cursor-pointer hover:brightness-95 transition-all"
      style={{ backgroundColor: bg, borderColor: department.color }}
      onClick={(e) => { e.stopPropagation(); onCardClick(shifts, e) }}
    >
      <div
        className="px-2 py-0.5 text-[11px] truncate"
        style={{ color: department.color }}
      >
        {department.name}
      </div>
      {visible.map((shift) => (
        <div key={shift.id} className="px-2 py-0.5 flex items-center gap-1.5 border-t border-white/40">
          {shift.type === 'day'
            ? <Sun size={10} className="flex-none text-[#f59e0b]" />
            : <Moon size={10} className="flex-none text-[#6366f1]" />
          }
          <span className="text-[11px] text-[#333333] truncate">
            {shift.staff.name}
            <span className="text-[#888888] ml-1">— {shift.staff.role}</span>
          </span>
        </div>
      ))}
      {overflow > 0 && (
        <div className="px-2 py-0.5 text-[10px] text-[#888888] border-t border-white/40">
          +{overflow} more
        </div>
      )}
    </div>
  )
}
