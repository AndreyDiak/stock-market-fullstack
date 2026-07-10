import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { ExchangeTable } from '../exchange'
import { NewsPanel } from '../news'
import { DealsPanel } from '../deals'
import { DreamPanel } from '../dreams'
import { BankView } from '../bank'
import { CharacterProfilePanel } from '../character'
import { GameSettingsPanel } from '../settings'
import { RealEstatePanel } from '../real_estate'

export function CenterPanel() {
  const theme = useDashboardTheme()
  const { activeTab } = useDashboardUi()

  return (
    <section
      className={`flex h-full min-h-0 min-w-0 flex-col overflow-hidden p-4 pb-6 md:p-5 md:pb-8 ${theme.frameDeep}`}
    >
      {activeTab === 'settings' && <GameSettingsPanel />}
      {activeTab === 'character' && <CharacterProfilePanel />}
      {activeTab === 'bank' && <BankView />}
      {activeTab === 'exchange' && <ExchangeTable />}
      {activeTab === 'news' && <NewsPanel />}
      {activeTab === 'dream' && <DreamPanel />}
      {activeTab === 'deals' && <DealsPanel />}
      {activeTab === 'real-estate' && <RealEstatePanel />}
    </section>
  )
}
