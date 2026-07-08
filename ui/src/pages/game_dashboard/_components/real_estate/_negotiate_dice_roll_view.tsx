import { useEffect, useRef, useState } from 'react';
import Dice3D from 'react-3d-dice';
import { gameAudio } from '../../../../lib/audio/game_audio';

const D20_COLOR = 0x334155;
const DICE_HEIGHT_PX = 364;
/** Минимальное время вращения d20 перед показом результата. */
export const DICE_SPIN_MIN_MS = 2400;
/** Длительность анимации остановки на грани (react-3d-dice settle ≈ 600ms). */
export const SETTLE_ANIMATION_MS = 650;

export function NegotiateDiceRollView({
  finalD20,
  reputationBonus,
  target,
}: {
  finalD20: number | null;
  reputationBonus: number;
  target: number;
}) {
  const [isRolling, setIsRolling] = useState(true);
  const [results, setResults] = useState<number[]>([1]);
  const [rollTrigger, setRollTrigger] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setIsRolling(true);
    setResults([1]);
    setRollTrigger((value) => value + 1);
    gameAudio.playSfx('dice');
  }, []);

  useEffect(() => {
    if (finalD20 == null) return;

    setResults([finalD20]);
    setIsRolling(false);
  }, [finalD20]);

  const isTumbling = finalD20 === null;
  const totalRoll = finalD20 === null ? null : finalD20 + reputationBonus;
  const isSuccess = totalRoll !== null && totalRoll >= target;

  return (
    <div className="trade-modal__dice-roll" aria-live="polite" aria-busy={isTumbling}>
      <p className="trade-modal__dice-roll-label">Проверка предложения</p>

      <div className="trade-modal__dice-scene trade-modal__dice-scene--3d">
        <Dice3D
          sides={20}
          color={D20_COLOR}
          results={results}
          isRolling={isRolling}
          rollTrigger={rollTrigger}
          animationMode="full"
          height={DICE_HEIGHT_PX}
          className="trade-modal__dice-3d"
          emptyText=""
        />
      </div>

      <p className="trade-modal__dice-roll-status">
        {isTumbling ? 'Бросаем кубик…' : `Выпало ${finalD20}`}
      </p>

      {!isTumbling && totalRoll !== null ? (
        <p
          className={[
            'trade-modal__dice-roll-result',
            isSuccess ? 'trade-modal__dice-roll-result--success' : 'trade-modal__dice-roll-result--failure',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {finalD20} + {reputationBonus} = {totalRoll}
          <span className="trade-modal__dice-roll-target">
            {' '}
            · нужно {target}+
          </span>
        </p>
      ) : null}
    </div>
  );
}
