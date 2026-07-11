import bg1 from '../../assets/audio/bg_1.mp3';
import bg2 from '../../assets/audio/bg_2.mp3';
import bg3 from '../../assets/audio/bg_3.mp3';
import goodNews from '../../assets/audio/effects/good_news.mp3';
import buttonClick from '../../assets/audio/effects/click.mp3';
import dice from '../../assets/audio/effects/dice_throw.mp3';
import dealFail from '../../assets/audio/effects/deal_fail.mp3';
import dealSuccess from '../../assets/audio/effects/deal_success.mp3';
import operationCompleted from '../../assets/audio/effects/operation_completed.mp3';

export const BACKGROUND_TRACKS = [bg1, bg2, bg3] as const;

export const SFX = {
  buttonClick,
  goodNews,
  dice,
  dealSuccess,
  dealFail,
  operationCompleted,
} as const;

export type SfxId = keyof typeof SFX;
