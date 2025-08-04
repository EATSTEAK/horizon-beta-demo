import { Application, Container } from "pixi.js";
import { Game } from "./game/Game";

async function bootstrap() {
  const app = new Application();
  await app.init({
    antialias: true,
    background: "#05070a",
    resizeTo: window,
  });

  const mount = document.getElementById("app")!;
  mount.appendChild(app.canvas);

  const stage = new Container();
  app.stage.addChild(stage);

  const game = new Game(app, stage);
  game.start();

  // Clean up on hot-reload
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      game.destroy();
      app.destroy(true, { children: true, texture: true, baseTexture: true });
    });
  }
}

bootstrap();