import { useMemo } from 'react';
import type { PriceHistoryPoint } from '../../../../api/stocks';
import { buildSparklinePolyline } from './_stock_sparkline_utils';

export function StockSparkline({
  history,
  up,
  width = 280,
  height = 76,
  className = '',
}: {
  history: PriceHistoryPoint[];
  up: boolean;
  width?: number;
  height?: number;
  className?: string;
}) {
  const points = useMemo(
    () => buildSparklinePolyline(history, width, height),
    [history, width, height],
  );

  const areaPoints = useMemo(() => {
    if (!points) return '';
    const firstX = points.split(' ')[0]?.split(',')[0] ?? '0';
    const lastX = points.split(' ').at(-1)?.split(',')[0] ?? String(width);
    return `${firstX},${height} ${points} ${lastX},${height}`;
  }, [points, width, height]);

  if (history.length < 2) {
    return (
      <div className={`stock-card__chart stock-card__chart--empty ${className}`.trim()}>
        <span className="text-[11px] text-slate-500">Нет данных графика</span>
      </div>
    );
  }

  const stroke = up ? '#34d399' : '#fb7185';
  const fill = up ? 'rgba(52, 211, 153, 0.12)' : 'rgba(251, 113, 133, 0.12)';

  return (
    <div className={`stock-card__chart ${className}`.trim()}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="stock-card__chart-svg"
        role="img"
        aria-hidden
      >
        <polygon fill={fill} points={areaPoints} />
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
      </svg>
    </div>
  );
}
