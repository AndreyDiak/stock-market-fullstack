import { BACKGROUND_TRACKS, SFX, type SfxId } from './sounds';

export interface AudioSettings {
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicEnabled: true,
  sfxEnabled: true,
  musicVolume: 0.45,
  sfxVolume: 0.7,
};

class GameAudioManager {
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private bgm: HTMLAudioElement | null = null;
  private bgmIndex = 0;
  private bgmActive = false;
  private onBgmEnded = () => {
    this.playNextBackgroundTrack();
  };

  applySettings(next: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...next };

    if (this.bgm) {
      this.bgm.volume = this.settings.musicEnabled ? this.settings.musicVolume : 0;
    }

    if (!this.settings.musicEnabled) {
      this.pauseBackgroundMusic();
      return;
    }

    if (this.bgmActive) {
      void this.resumeBackgroundMusic();
    }
  }

  getSettings(): AudioSettings {
    return this.settings;
  }

  startBackgroundMusic() {
    this.bgmActive = true;
    if (!this.settings.musicEnabled) return;

    if (!this.bgm) {
      this.bgm = new Audio(BACKGROUND_TRACKS[this.bgmIndex]);
      this.bgm.preload = 'auto';
      this.bgm.addEventListener('ended', this.onBgmEnded);
    }

    this.bgm.volume = this.settings.musicVolume;
    void this.bgm.play().catch(() => {
      // Браузер может заблокировать autoplay до первого жеста пользователя.
    });
  }

  stopBackgroundMusic() {
    this.bgmActive = false;
    if (!this.bgm) return;

    this.bgm.pause();
    this.bgm.currentTime = 0;
  }

  private pauseBackgroundMusic() {
    this.bgm?.pause();
  }

  private async resumeBackgroundMusic() {
    if (!this.bgmActive || !this.settings.musicEnabled || !this.bgm) return;

    this.bgm.volume = this.settings.musicVolume;
    try {
      await this.bgm.play();
    } catch {
      // Игнорируем блокировку autoplay.
    }
  }

  private playNextBackgroundTrack() {
    if (!this.bgmActive || !this.settings.musicEnabled) return;

    this.bgmIndex = (this.bgmIndex + 1) % BACKGROUND_TRACKS.length;
    if (!this.bgm) return;

    this.bgm.src = BACKGROUND_TRACKS[this.bgmIndex];
    this.bgm.volume = this.settings.musicVolume;
    void this.bgm.play().catch(() => {
      // Игнорируем блокировку autoplay.
    });
  }

  unlockFromUserGesture() {
    if (!this.bgmActive || !this.settings.musicEnabled) return;

    if (!this.bgm) {
      this.startBackgroundMusic();
      return;
    }

    if (this.bgm.paused) {
      void this.resumeBackgroundMusic();
    }
  }

  playSfx(id: SfxId) {
    if (!this.settings.sfxEnabled) return;

    const audio = new Audio(SFX[id]);
    audio.volume = this.settings.sfxVolume;
    void audio.play().catch(() => {
      // Игнорируем ошибки воспроизведения.
    });
  }
}

export const gameAudio = new GameAudioManager();
