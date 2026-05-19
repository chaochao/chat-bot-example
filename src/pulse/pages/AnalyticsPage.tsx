import { BarChart2 } from 'lucide-react'

export function AnalyticsPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-[#f7f7f7] flex items-center justify-center">
        <BarChart2 size={28} className="text-[#6a6a6a]" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#222222]">Analytics</h2>
        <p className="text-[#6a6a6a] text-sm mt-1">
          Staffing insights and demand forecasting — coming in a future update.
        </p>
      </div>
    </div>
  )
}
