import type { GeneratedNewsItem } from '../../api/gameTurn';
import { gameAudio } from './game_audio';

interface PropertyInstallmentPayload {
  paidOff?: boolean;
}

function isInstallmentPaidOffNews(item: GeneratedNewsItem) {
  if (item.kind !== 'PROPERTY_INSTALLMENT') return false;
  const payload = item.payload as PropertyInstallmentPayload | undefined;
  return payload?.paidOff === true;
}

export function playTurnResultSounds(
  news: GeneratedNewsItem[],
  itemsPaidOff: string[],
) {
  const hasInsiderNews = news.some((item) => item.kind === 'INSIDER');
  const hasPaidOffInstallment =
    itemsPaidOff.length > 0 || news.some(isInstallmentPaidOffNews);

  if (hasInsiderNews) {
    gameAudio.playSfx('goodNews');
    return;
  }

  if (hasPaidOffInstallment) {
    gameAudio.playSfx('goodNews');
  }
}
