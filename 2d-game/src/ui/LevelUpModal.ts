const STYLE = `
  .modal {
    position: fixed;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at center, #051018cc 0%, #02060acc 100%);
    z-index: 20;
  }
  .modal.open { display: flex; }
  .panel {
    width: min(720px, 92vw);
    border: 1px solid #00e5ff55;
    background: #03060aee;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 0 24px #00e5ff33, inset 0 0 24px #8a2be233;
  }
  .panel h2 {
    margin: 0 0 10px 0;
    font-size: 18px;
    letter-spacing: .08em;
    color: #aef3ff;
    text-shadow: 0 0 8px #00e5ff;
  }
  .choices {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .card {
    padding: 12px;
    border: 1px solid #00e5ff33;
    border-radius: 10px;
    background: #050a12cc;
    cursor: pointer;
    transition: transform .08s ease, box-shadow .08s ease, border-color .08s ease;
  }
  .card:hover {
    transform: translateY(-2px);
    border-color: #00e5ff99;
    box-shadow: 0 0 16px #00e5ff33;
  }
  .card .t {
    font-weight: 700;
    color: #d6fbff;
    margin-bottom: 6px;
  }
  .card .d {
    color: #a9d7e0;
    font-size: 13px;
  }
  @media (max-width: 640px) {
    .choices { grid-template-columns: 1fr; }
  }
`;

export type Upgrade = {
  id: string;
  title: string;
  desc: string;
  apply: () => void;
};

export class LevelUpModal {
  private root: HTMLDivElement;
  private styleEl: HTMLStyleElement;
  private openState = false;
  private resolver: ((u: Upgrade) => void) | null = null;

  constructor() {
    this.styleEl = document.createElement("style");
    this.styleEl.textContent = STYLE;
    document.head.appendChild(this.styleEl);

    this.root = document.createElement("div");
    this.root.className = "modal";
    this.root.innerHTML = `
      <div class="panel">
        <h2>LEVEL UP</h2>
        <div class="choices" id="lvlChoices"></div>
      </div>
    `;
    document.body.appendChild(this.root);
  }

  async choose(choices: Upgrade[]): Promise<Upgrade> {
    this.open();
    const container = this.root.querySelector("#lvlChoices") as HTMLDivElement;
    container.innerHTML = "";
    return new Promise<Upgrade>((resolve) => {
      this.resolver = resolve;
      for (const u of choices) {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="t">${u.title}</div>
          <div class="d">${u.desc}</div>
        `;
        card.onclick = () => {
          this.close();
          resolve(u);
        };
        container.appendChild(card);
      }
    });
  }

  open() {
    if (this.openState) return;
    this.openState = true;
    this.root.classList.add("open");
  }

  close() {
    if (!this.openState) return;
    this.openState = false;
    this.root.classList.remove("open");
  }

  destroy() {
    this.close();
    this.root.remove();
    this.styleEl.remove();
  }
}