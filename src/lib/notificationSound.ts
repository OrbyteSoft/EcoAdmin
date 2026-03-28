/**
 * Notification sound utility — lazy AudioContext init to avoid
 * browser autoplay policy blocking sound on page load.
 */
class NotificationSound {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Load saved preference immediately (no AudioContext yet)
    const saved = localStorage.getItem("notificationSoundsEnabled");
    if (saved !== null) {
      this.isEnabled = JSON.parse(saved);
    }
  }

  /** Lazily create AudioContext on first user interaction */
  private getContext(): AudioContext | null {
    if (this.audioContext) return this.audioContext;
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new Ctx();
      return this.audioContext;
    } catch {
      console.warn("AudioContext not supported");
      return null;
    }
  }

  play(): void {
    if (!this.isEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1100, now + 0.1);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn("Failed to play notification sound:", e);
    }
  }

  ensureRunning(): void {
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume().catch(() => {});
    }
  }

  toggle(): void {
    this.isEnabled = !this.isEnabled;
    localStorage.setItem(
      "notificationSoundsEnabled",
      JSON.stringify(this.isEnabled),
    );
  }

  getEnabled(): boolean {
    return this.isEnabled;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    localStorage.setItem("notificationSoundsEnabled", JSON.stringify(enabled));
  }
}

export const notificationSound = new NotificationSound();
