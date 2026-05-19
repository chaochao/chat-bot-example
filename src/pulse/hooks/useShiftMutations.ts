import { useMutation, useQueryClient } from '@tanstack/react-query'

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] })
  })
}

export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id, type, hours, status
    }: { id: string; type: string; hours: number; status: string }) => {
      const res = await fetch(`/api/pulse/shifts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, hours, status })
      })
      if (!res.ok) throw new Error('Failed to update shift')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] })
  })
}

export function useDeleteShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pulse/shifts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete shift')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] })
  })
}
