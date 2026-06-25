import type { right_panel_props } from '../_model/types'
import { NewsBlock } from './_news_block'
import { WorkBlock } from './_work_block'
import { NextTurnForecastBlock } from './next_turn_forecast_block'
import { PropertyInventoryBlock } from './property_inventory_block'

export function RightPanel(props: right_panel_props) {
  const { theme } = props

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col gap-3 lg:w-80 xl:w-96">
      <WorkBlock
        careerLevel={props.careerLevel}
        salary={props.salary}
        turnsUntilSalary={props.turnsUntilSalary}
        theme={theme}
      />

      <NextTurnForecastBlock forecast={props.nextTurnForecast} theme={theme} />

      <PropertyInventoryBlock slots={props.propertySlots} theme={theme} />

      <div className="flex min-h-0 flex-1 flex-col">
        <NewsBlock
          news={props.news}
          turn={props.turn}
          theme={theme}
          onOpenNews={props.onOpenNews}
          onSelectNews={props.onSelectNews}
        />
      </div>
    </aside>
  )
}
