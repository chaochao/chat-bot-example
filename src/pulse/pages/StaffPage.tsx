import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { startOfMonth, endOfMonth } from 'date-fns'
import { useStaff } from '@/pulse/hooks/useStaff'
import { useShifts } from '@/pulse/hooks/useShifts'

export function StaffPage() {
  const today = new Date()
  const navigate = useNavigate()
  const { data: staff = [] } = useStaff()
  const { data: shifts = [] } = useShifts(startOfMonth(today), endOfMonth(today))

  const shiftsByStaff = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of shifts) map[s.staffId] = (map[s.staffId] ?? 0) + 1
    return map
  }, [shifts])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#dddddd] flex-none">
        <h1 className="text-lg font-semibold text-[#222222]">Staff</h1>
        <span className="text-xs text-[#aaaaaa]">Shifts count for current month</span>
      </div>
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#ebebeb]">
              {['Name', 'Role', 'Department', 'Shifts This Month'].map(h => (
                <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-[#6a6a6a] uppercase tracking-wide last:pr-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(s => (
              <tr
                key={s.id}
                className="border-b border-[#f5f5f5] hover:bg-[#fafafa] transition-colors cursor-pointer"
                onClick={() => navigate(`/pulse/staff/${s.id}`)}
              >
                <td className="py-2.5 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-none" style={{ backgroundColor: s.department.color }} />
                    <span className="text-[#222222] font-medium">{s.name}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-4 text-[#6a6a6a]">{s.role}</td>
                <td className="py-2.5 pr-4">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: `${s.department.color}18`, color: s.department.color }}
                  >
                    {s.department.name}
                  </span>
                </td>
                <td className="py-2.5 text-[#6a6a6a] font-medium">{shiftsByStaff[s.id] ?? 0}</td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-[#6a6a6a]">No staff found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
