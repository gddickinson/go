// Home page: hero, facts from /api/info, a live mini board, cards to the pages, and how the site is built.
import { route, api, app, isStatic } from './core.js';
import { GoGame, apply } from './go_engine.js';
import { boardSvg } from './board_view.js';

route('home', async () => {
  const [info, demo] = await Promise.all([api('/info'), api('/demo')]);
  const g = new GoGame(demo.size);
  demo.moves.slice(0, 40).forEach(m => apply(g, m));
  app().innerHTML = `
  <section class="hero split">
    <div>
      <p class="kicker">Weiqi · Baduk · 围棋</p>
      <h1 class="glow">Go Game</h1>
      <p class="lead">A simple implementation of the ancient board game Go, written in Python with a PyQt5 interface and a
      basic AI opponent. Here the same rules engine and AI run in your browser: place stones, capture, fight a ko, pass, and
      let the code count the score.</p>
      <a class="btn" href="#/play">Play a game</a><a class="btn alt" href="#/watch">Watch the AI</a>
    </div>
    <div class="hero-board" aria-hidden="true">${boardSvg(demo.size, g.board, { labels: false, title: 'Position after 40 moves of the demo game' })}</div>
  </section>
  <div class="tiles">
    <div class="tile"><b>${info.board_sizes.length}</b><span>board sizes: ${info.board_sizes.join(', ')}</span></div>
    <div class="tile"><b>${info.komi}</b><span>komi for White</span></div>
    <div class="tile"><b>${info.modules.length}</b><span>Python modules</span></div>
    <div class="tile"><b>1</b><span>AI: random legal move</span></div>
  </div>
  <div class="grid">
    <a class="card" href="#/play"><b>Play</b><small>9×9, 13×13 or 19×19, against SimpleGoAI or a friend</small><span>Pass, ko and suicide checks, live count of prisoners and territory.</span></a>
    <a class="card" href="#/watch"><b>Watch</b><small>AI against AI, recorded by Python</small><span>Step through a seeded game and see the browser engine reach the same position.</span></a>
    <a class="card" href="#/rules"><b>Rules</b><small>as go_game.py implements them</small><span>Captures, simple ko, no suicide, two passes, territory scoring with komi.</span></a>
    <a class="card" href="#/about"><b>About</b><small>desktop app, web app, credits</small><span>How to run the PyQt5 game and this site locally.</span></a>
  </div>
  <h2>How this site works</h2>
  <div class="flow">
    <div><code>GoGame</code> (<code>go_game.py</code>) and <code>SimpleGoAI</code> (<code>go_ai.py</code>) are ported line for line
      to JavaScript, including Python's Mersenne Twister so a seeded AI picks the same moves.</div>
    <div>A node test replays move sequences recorded from the Python (rule positions, thousands of random legal and illegal
      attempts, seeded AI games on every board size) and requires identical boards, ko points, captures and scores.</div>
    <div>${isStatic() ? 'Run the app locally (see About) to' : 'Here, in the local app, you can'} send any game you play to the
      Python engine with "Check with Python".</div>
  </div>`;
});
