import { useEffect } from 'react';
import { gameAudio } from '../lib/audio/game_audio';
import { useGameSettingsStore } from '../stores/game_settings.store';

export function useGameBackgroundMusic(active: boolean) {
  const musicEnabled = useGameSettingsStore((state) => state.musicEnabled);
  const musicVolume = useGameSettingsStore((state) => state.musicVolume);
  const sfxEnabled = useGameSettingsStore((state) => state.sfxEnabled);
  const sfxVolume = useGameSettingsStore((state) => state.sfxVolume);

  useEffect(() => {
    gameAudio.applySettings({ musicEnabled, musicVolume, sfxEnabled, sfxVolume });
  }, [musicEnabled, musicVolume, sfxEnabled, sfxVolume]);

  useEffect(() => {
    if (!active) {
      gameAudio.stopBackgroundMusic();
      return;
    }

    gameAudio.startBackgroundMusic();

    const unlock = () => {
      gameAudio.unlockFromUserGesture();
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      gameAudio.stopBackgroundMusic();
    };
  }, [active]);
}
