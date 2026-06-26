import { NewsBlock } from '../news/_news_block'
import { WorkBlock } from '../sidebar/_work_block'
import { NextTurnForecastBlock } from '../sidebar'
import { PropertyInventoryBlock } from '../property'

export function RightPanel() {
  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col gap-3 lg:w-80 xl:w-96">
      <WorkBlock />
      <NextTurnForecastBlock />
      <PropertyInventoryBlock />

      <div className="flex min-h-0 flex-1 flex-col">
        <NewsBlock />
      </div>
    </aside>
  )
}
