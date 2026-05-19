import { useQuery } from '@tanstack/react-query'
import type { Shift } from '@/pulse/types'

export function useShifts(start: Date, end: Date) {
  return useQuery<Shift[]>({
    queryKey: ['shifts', start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString()
      })
      const res = await fetch(`/api/pulse/shifts?${params}`)
      if (!res.ok) throw new Error('Failed to fetch shifts')
      return res.json()
    }
  })
}
