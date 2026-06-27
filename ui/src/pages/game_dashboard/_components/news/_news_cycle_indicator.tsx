import type { news_item } from '../../_model/types';
import {
  NEWS_CATEGORY_CONFIG,
  resolveNewsCycleState,
  type NewsCategory,
} from './_news_category';
import './_news.css';

export function NewsCycleIndicator({ news }: { news: news_item[] }) {
  const { lastType, nextType, cycleOrder } = resolveNewsCycleState(news);

  return (
    <section className="news-cycle" aria-label="Цикл новостей">
      <div className="news-cycle__header">
        <p className="news-cycle__title">Поток новостей</p>
        <div className="news-cycle__summary">
          {lastType ? (
            <span>
              Последняя:{' '}
              <strong>{NEWS_CATEGORY_CONFIG[lastType].label}</strong>
            </span>
          ) : (
            <span>Ожидается первая новость</span>
          )}
          <span>
            Далее: <strong>{NEWS_CATEGORY_CONFIG[nextType].label}</strong>
          </span>
        </div>
      </div>

      <div className="news-cycle__track" aria-hidden>
        {cycleOrder.map((category, index) => (
          <CycleStep
            key={category}
            category={category}
            active={category === lastType}
            showConnector={index < cycleOrder.length - 1}
          />
        ))}
      </div>
    </section>
  );
}

function CycleStep({
  category,
  active,
  showConnector,
}: {
  category: NewsCategory;
  active: boolean;
  showConnector: boolean;
}) {
  const config = NEWS_CATEGORY_CONFIG[category];
  const Icon = config.Icon;

  return (
    <>
      <div
        className={[
          'news-cycle__step',
          `news-cycle__step--${category}`,
          active ? 'news-cycle__step--active' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Icon className="news-cycle__step-icon" />
        <span className="news-cycle__step-label">{config.label}</span>
      </div>
      {showConnector ? <div className="news-cycle__connector" /> : null}
    </>
  );
}
