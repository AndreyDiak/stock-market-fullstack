import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { ExchangeTable } from '../exchange'
import { NewsPanel } from '../news'
import { OtcDealsPanel } from '../otc'
import { BankView } from '../bank'
import { CharacterProfilePanel } from '../character'
import { GameSettingsPanel } from '../settings'
import { RealEstatePanel } from '../real_estate'

export function CenterPanel() {
  const theme = useDashboardTheme()
  const { activeTab } = useDashboardUi()

  return (
    <section
      className={`flex min-h-0 min-w-0 flex-1 flex-col p-4 md:p-5 ${theme.frameDeep}`}
    >
      {activeTab === 'settings' && <GameSettingsPanel />}
      {activeTab === 'character' && <CharacterProfilePanel />}
      {activeTab === 'bank' && <BankView />}
      {activeTab === 'exchange' && <ExchangeTable />}
      {activeTab === 'news' && <NewsPanel />}
      {activeTab === 'otc' && <OtcDealsPanel />}
      {activeTab === 'real-estate' && <RealEstatePanel />}
    </section>
  )
}
