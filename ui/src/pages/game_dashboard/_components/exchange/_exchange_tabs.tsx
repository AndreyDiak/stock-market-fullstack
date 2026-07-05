export type ExchangeTabId = 'market' | 'portfolio';

const TAB_ITEMS: { id: ExchangeTabId; label: string }[] = [
  { id: 'market', label: 'Рынок' },
  { id: 'portfolio', label: 'Портфель' },
];

export function ExchangeTabs({
  active,
  onChange,
  portfolioCount,
}: {
  active: ExchangeTabId;
  onChange: (tab: ExchangeTabId) => void;
  portfolioCount: number;
}) {
  return (
    <div className="exchange-tabs" role="tablist" aria-label="Разделы биржи">
      {TAB_ITEMS.map((tab) => {
        const label =
          tab.id === 'portfolio' && portfolioCount > 0
            ? `${tab.label} · ${portfolioCount}`
            : tab.label;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            className={`exchange-tabs__item${active === tab.id ? ' exchange-tabs__item--active' : ''}`}
            onClick={() => onChange(tab.id)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
