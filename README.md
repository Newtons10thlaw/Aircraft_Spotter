# PlaneSpotter — Boeing or Airbus?

A free, responsive aircraft-identification game. Each round shows 10 real aircraft photographs; guess **Boeing** or **Airbus**, earn points, build a streak, and learn an identification clue after every answer.

## How the pictures work

**No photographs are downloaded, uploaded, or committed to the repository.** On page load, the site's JavaScript contacts Wikipedia's MediaWiki API (`prop=pageimages`), requests representative, freely licensed photos for a list of aircraft model articles, and displays the URLs served by Wikimedia. A second API call gets photographer credits and licences where available.

The game shows source/credit details after you answer, so the answer isn't spoiled in advance. Photos and their licences belong to the individual creators; see each linked Wikimedia Commons file page for details. A network connection is required. Wikimedia might change which representative photographs appear or impose service limits, so this should not be treated as an offline/static image collection.

## Put it on GitHub Pages (free)

1. Create a new public GitHub repository, e.g. `aircraft-spotter`.
2. Upload **`index.html`, `style.css`, `script.js`, `.nojekyll` and `README.md`** directly into its root (not inside an extra folder).
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, then select **main** and **/(root)**; save.
5. Your site will appear at `https://YOUR-USERNAME.github.io/aircraft-spotter/` once Pages finishes deploying.

No API key, server, npm, Node, React, or package installation is needed.

## Run locally

In the folder containing the site files:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. (The game needs the internet to request photos.)

## Personalise it

In `script.js`:
- Update the `AIRCRAFT` list to add or remove models, or edit the identification clues.
- Keep the `article` field equal to an existing English Wikipedia article title for the model.
- Change `ROUND_TARGET` if you want a different even number of questions. Ensure you have at least `ROUND_TARGET / 2` usable Wikipedia images for **each** manufacturer.

In `style.css`, adjust `--accent`, `--bg` and other CSS variables to change the colour scheme.

## Technical details

- Static HTML/CSS/JavaScript, suitable for GitHub Pages.
- External images: Wikimedia Commons (via English Wikipedia's MediaWiki PageImages API).
- Balanced round: five Airbus and five Boeing pictures, randomly selected from the pool without repeats within a round.
- Score and streak. Personal-best value saved in browser `localStorage` (when available).
- Keyboard shortcuts: `A` for Airbus, `B` for Boeing, `Enter` for the next photo after answering.
- Accessible alt text deliberately avoids revealing the answer; source links are displayed after answering.

Built as a small aviation learning project; not affiliated with Airbus, Boeing, Wikipedia, or Wikimedia.
