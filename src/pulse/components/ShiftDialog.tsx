import { useState } from 'react'
import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useStaff } from '@/pulse/hooks/useStaff'
import { useCreateShift, useUpdateShift, useDeleteShift } from '@/pulse/hooks/useShiftMutations'
import type { Department, Shift, ShiftType } from '@/pulse/types'

interface ShiftDialogProps {
  open: boolean
  date: Date | null
  shift: Shift | null
  departments: Department[]
  onClose: () => void
}

export function ShiftDialog({ open, date, shift, departments, onClose }: ShiftDialogProps) {
  const isEdit = shift !== null

  const [departmentId, setDepartmentId] = useState(shift?.departmentId ?? '')
  const [staffId, setStaffId] = useState(shift?.staffId ?? '')
  const [shiftType, setShiftType] = useState<ShiftType>(shift?.type ?? 'day')
  const [hours, setHours] = useState(String(shift?.hours ?? 12))

  const { data: allStaff = [] } = useStaff()
  const createShift = useCreateShift()
  const updateShift = useUpdateShift()
  const deleteShift = useDeleteShift()

  const filteredStaff = allStaff.filter((s) => s.departmentId === departmentId)
  const selectedStaff = allStaff.find((s) => s.id === staffId)
  const selectedDept = departments.find((d) => d.id === departmentId)

  const warnings: string[] = []
  if (selectedStaff && selectedDept) {
    const staffCerts = selectedStaff.certifications.split(',').filter(Boolean)
    const reqCerts = selectedDept.requiredCertifications.split(',').filter(Boolean)
    const missing = reqCerts.filter((c) => !staffCerts.includes(c))
    if (missing.length > 0) {
      warnings.push(`Missing certifications: ${missing.join(', ')}`)
    }
  }

  const isPending = createShift.isPending || updateShift.isPending || deleteShift.isPending

  async function handleSave() {
    if (!date || !departmentId || !staffId) return
    if (isEdit) {
      await updateShift.mutateAsync({ id: shift.id, type: shiftType, hours: Number(hours), status: shift.status })
    } else {
      await createShift.mutateAsync({ staffId, departmentId, date: date.toISOString(), type: shiftType, hours: Number(hours) })
    }
    onClose()
  }

  async function handleDelete() {
    if (!shift) return
    await deleteShift.mutateAsync(shift.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Shift' : `Add Shift — ${date ? format(date, 'MMM d, yyyy') : ''}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select
              value={departmentId}
              onValueChange={(v) => { setDepartmentId(v ?? ''); setStaffId('') }}
              disabled={isEdit}
            >
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Staff</Label>
            <Select value={staffId} onValueChange={(v) => setStaffId(v ?? '')} disabled={isEdit || !departmentId}>
              <SelectTrigger>
                <SelectValue placeholder={departmentId ? 'Select staff member' : 'Select department first'} />
              </SelectTrigger>
              <SelectContent>
                {filteredStaff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {s.role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Shift Type</Label>
            <Select value={shiftType} onValueChange={(v) => setShiftType((v ?? 'day') as ShiftType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day (7am – 7pm)</SelectItem>
                <SelectItem value="evening">Evening (3pm – 11pm)</SelectItem>
                <SelectItem value="night">Night (7pm – 7am)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Select value={hours} onValueChange={(v) => setHours(v ?? '12')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <AlertTriangle size={13} className="flex-none" />
              {w}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <div>
            {isEdit && (
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isPending}>
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending || !departmentId || !staffId}
            >
              {isEdit ? 'Update' : 'Add Shift'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
