# RM Arcade

Four browser games created for Ricardo Moran's TECH3500 game lab with AI assistance.
Built with plain HTML, CSS, JavaScript, Canvas, and Web Audio. No application server,
API keys, sign-in, or package installation is needed to play.

## The games

| Game | Goal | Controls |
| --- | --- | --- |
| Afterlight | Earn 1,000 points, then defeat the Warden boss. | Arrows / A D; Space to fire |
| Break the Grid | Clear three brick layouts with three lives. | Arrows / A D; Space to launch |
| Golden Hour | Collect eight coins, avoid patrols, and reach the exit. | Arrows / W A S D |
| Signal Keep | Defend the relay through six waves using towers and upgrades. | Click pads; 1 / 2 select; Enter sends a wave |

P pauses a running game. Touch controls and on-screen tower buttons are included.
Each game has a local top-five leaderboard. Scores stay in each visitor's browser;
this is not an online shared leaderboard or a multiplayer game.

## Publish on GitHub Pages

1. Create a public GitHub repository for this game, for example `rm-arcade`.
2. Push the files in this repository to its `main` branch.
3. Open the repository's **Settings > Pages**. Under **Build and deployment**,
   choose **GitHub Actions** as the source.
4. Open **Actions > Test and publish RM Arcade**. If necessary, select
   **Run workflow > main > Run workflow** after enabling Pages.
5. Wait for a successful deployment. Copy the actual website URL from
   **Settings > Pages > Visit site**, or from the workflow's deployment result.
6. Share that website URL with players, not the repository's source-code URL.
   Test it while signed out and from another device before submitting it.

The included workflow runs the automated game tests before deploying only `site/`.
All game links are relative, so a GitHub project URL with a repository subpath works.
There is no confirmed public URL until GitHub reports a successful deployment.

Official instructions:
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Vercel for the course submission

GitHub Pages is a public-play option. It does not replace the assignment's explicit
Vercel requirement. In Vercel, import this GitHub repository, set the Root Directory
to `site`, choose the **Other** framework preset, and leave the build command empty.
The site has no install step. Use the resulting production URL after verifying that
it opens for signed-out visitors. Never add private keys or homework evidence.

## Develop and test

Open `site/index.html` directly, or use VS Code Live Server on the `site` folder.
For an optional local web server with Python installed, from the repository root:

```sh
python -m http.server 5515 --directory site
```

Run the deterministic rule tests with Node.js 22 or later:

```sh
node --test tests/engine.test.cjs
```

Tests cover score validation, pause/resume, power-up timing, boss logic, simultaneous
collisions, breakout stages/lives, reachability across 100 seeded mazes, patrols,
time bonuses, tower economy, and six-wave win/loss paths. Automated tests are not
a substitute for peer testing.

## Files and privacy

- `site/index.html`: game lobby
- `site/play.html`: shared game page
- `site/style.css`: responsive presentation and original CSS artwork
- `site/engine.js`: testable game models
- `site/app.js`: input, rendering, sound, and local score storage
- `site/guide.html`: player instructions
- `tests/engine.test.cjs`: automated model tests
- `.github/workflows/pages.yml`: test and deployment workflow

Fonts are requested from Google Fonts, with local fallback fonts. Gameplay uses
procedural drawings rather than downloaded image assets. The application does not
send scores or initials to a server. Standard hosting request logs may still exist.
The local `Submission` folder, recordings, PDFs, credentials, and private documents
are not part of the public repository.
