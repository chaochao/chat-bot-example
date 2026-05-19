import { useQuery } from '@tanstack/react-query'
import type { Staff } from '@/pulse/types'

export function useStaff() {
  return useQuery<Staff[]>({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await fetch('/api/pulse/staff')
      if (!res.ok) throw new Error('Failed to fetch staff')
      return res.json()
    },
    staleTime: Infinity
  })
}
