export class HUD {
  private timerEl: HTMLElement | null;
  private xpFillEl: HTMLDivElement | null;

  constructor() {
    this.timerEl = document.getElementById("timer");
    this.xpFillEl = document.getElementById("xpFill") as HTMLDivElement | null;
  }

  setTimer(seconds: number) {
    const t = Math.floor(seconds);
    const mm = String(Math.floor(t / 60)).padStart(2, "0");
    const ss = String(t % 60).padStart(2, "0");
    if (this.timerEl) this.timerEl.textContent = `${mm}:${ss}`;
  }

  setXPProgress(current: number, required: number) {
    if (!this.xpFillEl) return;
    if (current <= 0) {
      this.xpFillEl.style.width = "0%";
      return;
    }
    const pct = Math.min(99, (current / required) * 100);
    this.xpFillEl.style.width = `${pct}%`;
  }

  resetXP() {
    if (this.xpFillEl) this.xpFillEl.style.width = "0%";
  }
}