import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      staffId: string
      departmentId: string
      date: string
      type: string
      hours: number
    }) => {
      const res = await fetch('/api/pulse/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to create shift')
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success(`Shift created — ${data.staff.name}, ${data.department.name}`)
    },
    onError: () => toast.error('Failed to create shift')
  })
}

export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id, staffId, departmentId, type, hours, status
    }: { id: string; staffId: string; departmentId: string; type: string; hours: number; status: string }) => {
      const res = await fetch(`/api/pulse/shifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, departmentId, type, hours, status })
      })
      if (!res.ok) throw new Error('Failed to update shift')
      return res.json()
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.info(`Shift updated — ${data.staff.name}, ${data.department.name}`)
    },
    onError: () => toast.error('Failed to update shift')
  })
}

export function useDeleteShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; staffName: string; deptName: string }) => {
      const res = await fetch(`/api/pulse/shifts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete shift')
      return res.json()
    },
    onSuccess: (_, { staffName, deptName }) => {
      qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.error(`Shift deleted — ${staffName}, ${deptName}`)
    },
    onError: () => toast.error('Failed to delete shift')
  })
}
