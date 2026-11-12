// About page: what the project is, how to run the desktop app, the web app and the static site, and credits (README).
import { route, app, isStatic } from './core.js';

route('about', () => {
  app().innerHTML = `
  <p class="kicker">About</p>
  <h1>Go Game</h1>
  <p class="lead">A simple implementation of the board game Go (Weiqi, Baduk): <code>go_game.py</code> holds the rules
  (captures, ko, suicide, passing, territory scoring with 6.5 komi), <code>go_ai.py</code> a basic AI that plays a random
  legal move, and <code>go_gui.py</code> a PyQt5 board where you play Black against the AI.</p>

  <h2>This web version</h2>
  <p>The game here is the Python code ported to JavaScript (<code>go_engine.js</code>, <code>go_ai.js</code>,
  <code>py_random.js</code>), tested move for move against the Python. The demo game on the Watch page was recorded by the
  Python code itself. ${isStatic() ? 'This static site needs no server; only "Check with Python" needs the local app.' : ''}</p>
  <div class="callout">While building this site, four bugs in the Python were fixed: the ko rule was never enforced,
  multi-stone suicide was allowed (one-stone suicide was not), the AI could pick a suicide point (stalling the desktop game),
  and <code>pyproject.toml</code> named a build backend that does not exist. See the README and SESSION_LOG.md.</div>
  <p>The AI plays a random legal move that does not fill its own eye and passes when none is left, so when you pass
  after it does, the game ends and is scored.</p>

  <h2>Run the desktop app</h2>
  <pre>pip install -r requirements.txt     # PyQt5, numpy
python go_main.py</pre>

  <h2>Run the web app</h2>
  <pre>pip install -r requirements-web.txt
python run_web.py          # http://127.0.0.1:8160</pre>
  <p>Build the static site (what GitHub Pages serves) with <code>python scripts/build_static.py</code>; run the tests with
  <code>python -m pytest -q</code> (the web tests include the node engine test).</p>

  <h2>Credits</h2>
  <ul>
    <li>The rules of Go are based on standard Japanese rules (README).</li>
    <li>Thanks to the PyQt5 team for the GUI framework used by the desktop app.</li>
    <li>Inspired by the rich history of Go spanning over 2,500 years.</li>
  </ul>
  <p>MIT licence. Built with AI assistance from <a href="https://claude.com/" target="_blank" rel="noopener">Claude (Anthropic)</a>.
  Source: <a href="https://github.com/gddickinson/go" target="_blank" rel="noopener">github.com/gddickinson/go</a>.</p>`;
});
