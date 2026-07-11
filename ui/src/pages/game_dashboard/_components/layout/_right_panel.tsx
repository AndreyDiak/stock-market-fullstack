import { NewsBlock } from '../news/_news_block'
import { WorkBlock } from '../sidebar/_work_block'
import { NextTurnForecastBlock } from '../sidebar'
import { PropertyInventoryBlock } from '../property'

export function RightPanel() {
  return (
    <aside className="flex h-full min-h-0 w-full min-w-0 shrink-0 flex-col gap-3">
      <WorkBlock />
      <NextTurnForecastBlock />
      <PropertyInventoryBlock />
      <NewsBlock />
    </aside>
  )
}
