import { gameAudio } from '../../../../lib/audio/game_audio'

export type BankTabId = 'property' | 'history'

const TAB_ITEMS: { id: BankTabId; labelKey: 'property' | 'history' }[] = [
  { id: 'property', labelKey: 'property' },
  { id: 'history', labelKey: 'history' },
]

export function BankTabs({
  active,
  onChange,
  propertyLabel,
}: {
  active: BankTabId
  onChange: (tab: BankTabId) => void
  propertyLabel: string
}) {
  const labels: Record<(typeof TAB_ITEMS)[number]['labelKey'], string> = {
    property: propertyLabel,
    history: 'История операций',
  }

  return (
    <div className="bank-tabs" role="tablist" aria-label="Разделы банка">
      {TAB_ITEMS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`bank-tabs__item${active === tab.id ? ' bank-tabs__item--active' : ''}`}
          onClick={() => { gameAudio.playSfx('buttonClick'); onChange(tab.id) }}
        >
          {labels[tab.labelKey]}
        </button>
      ))}
    </div>
  )
}
