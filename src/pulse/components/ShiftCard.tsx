import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Department, Shift } from '@/pulse/types'

const MAX_VISIBLE = 3

interface ShiftCardProps {
  department: Department
  shifts: Shift[]
  onCardClick: (shift: Shift, e: React.MouseEvent) => void
}

export function ShiftCard({ department, shifts, onCardClick }: ShiftCardProps) {
  const bg = `${department.color}15`
  const visible = shifts.slice(0, MAX_VISIBLE)
  const overflow = shifts.length - MAX_VISIBLE

  return (
    <Popover>
      <PopoverTrigger
        className="rounded-md mb-0.5 border-l-[2px] select-none w-full text-left block overflow-hidden cursor-pointer hover:brightness-95 transition-all"
        style={{ backgroundColor: bg, borderColor: department.color }}
        onClick={(e) => { e.stopPropagation(); onCardClick(shifts[0], e) }}
      >
        <div
          className="px-2 py-0.5 text-[11px] text-[#444444] truncate"
          style={{ color: department.color }}
        >
          {department.name}
        </div>
        {visible.map((shift) => (
          <div key={shift.id} className="px-2 py-0.5 flex items-center gap-1.5 border-t border-white/40">
            <span
              className="w-1.5 h-1.5 rounded-full flex-none"
              style={{ backgroundColor: department.color }}
            />
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
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" side="right" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs text-[#222222] mb-2" style={{ color: department.color }}>{department.name}</p>
        <div className="space-y-1">
          {shifts.map((shift) => (
            <div key={shift.id} className="flex items-center gap-1.5 text-[11px] text-[#555555]">
              <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ backgroundColor: department.color }} />
              {shift.staff.name}
              <span className="text-[#999999]">— {shift.staff.role}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
