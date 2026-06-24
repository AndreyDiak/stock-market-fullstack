import { PropertyInventoryBlock } from '../../components/game_dashboard/property_inventory_block'
import { NextTurnForecastBlock } from '../../components/game_dashboard/next_turn_forecast_block'
import type { right_panel_props } from './model/types'
import { NewsBlock } from './_news_block'
import { WorkBlock } from './_work_block'

export function RightPanel(props: right_panel_props) {
  return (
    <aside
      className={`flex w-full shrink-0 flex-col gap-2 p-3 md:px-4 md:py-3 lg:w-80 xl:w-96 ${props.theme.frameDeep}`}
    >
      <NewsBlock news={props.news} theme={props.theme} />
      <NextTurnForecastBlock forecast={props.nextTurnForecast} isLight={props.theme.isLight} />
      <WorkBlock
        careerLevel={props.careerLevel}
        salary={props.salary}
        turnsUntilSalary={props.turnsUntilSalary}
        theme={props.theme}
      />
      <PropertyInventoryBlock
        slots={props.propertySlots}
        nextUnlockPrice={props.propertySlotUnlockPrice}
        onGoToProfile={props.onGoToProfile}
      />
    </aside>
  )
}
