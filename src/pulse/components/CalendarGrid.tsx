import { useState } from 'react'
import { format, isSameMonth } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getMonthGrid, getWeekDays,
  navigateMonth, navigateWeek,
  formatMonthYear, formatWeekRange,
  formatDateKey, isToday,
  getQueryRange,
  groupByDateAndDept,
  groupByDateTypeDept
} from '@/pulse/lib/calendarUtils'
import { ShiftCard } from './ShiftCard'
import { ShiftDialog } from './ShiftDialog'
import { useShifts } from '@/pulse/hooks/useShifts'
import { useDepartments } from '@/pulse/hooks/useDepartments'
import type { Shift, Department, ViewMode } from '@/pulse/types'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const SHIFT_TYPES = ['day', 'evening', 'night'] as const
const SHIFT_LABELS = { day: 'Day', evening: 'Evening', night: 'Night' }

export function CalendarGrid() {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { start, end } = getQueryRange(viewMode, currentDate)
  const { data: shifts = [] } = useShifts(start, end)
  const { data: departments = [] } = useDepartments()

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]))
  const byDateDept = groupByDateAndDept(shifts)
  const byDateTypeDept = groupByDateTypeDept(shifts)

  function openCreate(date: Date) {
    setSelectedDate(date)
    setEditingShift(null)
    setDialogOpen(true)
  }

  function openEdit(shift: Shift, e: React.MouseEvent) {
    e.stopPropagation()
    setEditingShift(shift)
    setSelectedDate(new Date(shift.date))
    setDialogOpen(true)
  }

  function navigate(dir: 'prev' | 'next') {
    setCurrentDate((d) => viewMode === 'month' ? navigateMonth(d, dir) : navigateWeek(d, dir))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#dddddd] flex-none">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-[#222222]">
            {viewMode === 'month' ? formatMonthYear(currentDate) : formatWeekRange(currentDate)}
          </h1>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('prev')}>
              <ChevronLeft size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('next')}>
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
        <div className="flex rounded-md border border-[#dddddd] overflow-hidden text-xs">
          <button
            onClick={() => setViewMode('month')}
            className={cn('px-3 py-1.5 font-medium transition-colors',
              viewMode === 'month' ? 'bg-[#222222] text-white' : 'text-[#6a6a6a] hover:bg-[#f7f7f7]'
            )}
          >Month</button>
          <button
            onClick={() => setViewMode('week')}
            className={cn('px-3 py-1.5 font-medium transition-colors',
              viewMode === 'week' ? 'bg-[#222222] text-white' : 'text-[#6a6a6a] hover:bg-[#f7f7f7]'
            )}
          >Week</button>
        </div>
      </div>

      {/* Day labels */}
      <div className={cn('grid border-b border-[#dddddd] flex-none', viewMode === 'week' ? 'grid-cols-[80px_repeat(7,1fr)]' : 'grid-cols-7')}>
        {viewMode === 'week' && <div className="border-r border-[#ebebeb]" />}
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-medium text-[#6a6a6a] uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'month' ? (
          <MonthBody
            currentDate={currentDate}
            byDateDept={byDateDept}
            deptMap={deptMap}
            onCellClick={openCreate}
            onShiftClick={openEdit}
          />
        ) : (
          <WeekBody
            currentDate={currentDate}
            byDateTypeDept={byDateTypeDept}
            deptMap={deptMap}
            onCellClick={openCreate}
            onShiftClick={openEdit}
          />
        )}
      </div>

      <ShiftDialog
        open={dialogOpen}
        date={selectedDate}
        shift={editingShift}
        departments={departments}
        onClose={() => { setDialogOpen(false); setEditingShift(null) }}
      />
    </div>
  )
}

function MonthBody({
  currentDate, byDateDept, deptMap, onCellClick, onShiftClick
}: {
  currentDate: Date
  byDateDept: Record<string, Record<string, Shift[]>>
  deptMap: Record<string, Department>
  onCellClick: (d: Date) => void
  onShiftClick: (s: Shift, e: React.MouseEvent) => void
}) {
  const weeks = getMonthGrid(currentDate)

  return (
    <div className="grid grid-cols-7 h-full">
      {weeks.flat().map((day, i) => {
        const key = formatDateKey(day)
        const dayDepts = byDateDept[key] ?? {}
        const inMonth = isSameMonth(day, currentDate)

        return (
          <div
            key={i}
            className={cn(
              'h-[140px] border-b border-r border-[#ebebeb] cursor-pointer transition-colors flex flex-col',
              inMonth ? 'bg-white hover:bg-[#fafafa]' : 'bg-[#fafafa]',
            )}
            onClick={() => onCellClick(day)}
          >
            <div className="px-2 pt-2 flex-none">
              <div className={cn(
                'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                isToday(day) ? 'bg-[#ff385c] text-white' :
                inMonth ? 'text-[#222222]' : 'text-[#c1c1c1]'
              )}>
                {format(day, 'd')}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
              {Object.entries(dayDepts).map(([deptId, depShifts]) => {
                const dept = deptMap[deptId]
                if (!dept) return null
                return (
                  <ShiftCard
                    key={deptId}
                    department={dept}
                    shifts={depShifts}
                    onCardClick={onShiftClick}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function WeekBody({
  currentDate, byDateTypeDept, deptMap, onCellClick, onShiftClick
}: {
  currentDate: Date
  byDateTypeDept: Record<string, Record<string, Record<string, Shift[]>>>
  deptMap: Record<string, Department>
  onCellClick: (d: Date) => void
  onShiftClick: (s: Shift, e: React.MouseEvent) => void
}) {
  const days = getWeekDays(currentDate)

  return (
    <div>
      {SHIFT_TYPES.map((type) => (
        <div key={type} className="grid grid-cols-[80px_repeat(7,1fr)]">
          <div className="border-b border-r border-[#ebebeb] flex items-center justify-center">
            <span className="text-[10px] font-semibold text-[#6a6a6a] uppercase tracking-widest">
              {SHIFT_LABELS[type]}
            </span>
          </div>
          {days.map((day, i) => {
            const key = formatDateKey(day)
            const depts = byDateTypeDept[key]?.[type] ?? {}
            return (
              <div
                key={i}
                className="min-h-[100px] border-b border-r border-[#ebebeb] p-2 cursor-pointer hover:bg-[#fafafa] transition-colors"
                onClick={() => onCellClick(day)}
              >
                {Object.entries(depts).map(([deptId, depShifts]) => {
                  const dept = deptMap[deptId]
                  if (!dept) return null
                  return (
                    <ShiftCard
                      key={deptId}
                      department={dept}
                      shifts={depShifts}
                      onCardClick={onShiftClick}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
