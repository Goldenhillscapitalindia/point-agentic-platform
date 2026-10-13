# Point — Agentic Intelligence for Investment Teams

A static marketing site + demo platform for **Point Agentic Solutions**: a landing
page and a fully-populated (dummy-data) platform app showcasing the ten specialist
agents, the Point Conductor, Action Cards, risk/PnL/research views, the 24/7
tokenized market, Point MCP and Point Execute.

Pure HTML/CSS/JS — no framework, no backend, no build tooling beyond Node for
bundling. Fonts load from Google Fonts; everything else is inline.

## Private OpenAI chatbot

Both the platform and institutional terminal include a browser-only **Ask Point**
chat. Serve the site over localhost or HTTPS, open Ask Point, and enter your own
OpenAI API key in **Connection**. Do not paste keys into chat or source files.
The key is kept only in this tab's memory and cleared on disconnect/reload; it is
never saved to localStorage, sessionStorage, the repository, or a build artifact.
Any script or browser extension with access to the page can still access browser
memory, so this is a private bring-your-own-key demo, not a way to distribute a
shared secret on a public website. A Vercel frontend environment variable does
not make an embedded key private. API billing must be enabled separately from a
ChatGPT subscription.

1. Open `dist/app.html`, choose a fund, open **Ask Point**, and connect your key.
2. Ask a question immediately using that fund's website snapshot.
3. In **Connection**, select **Create knowledge base** to upload the available
   funds' documents to your key's OpenAI project. OpenAI creates and stores the
   embeddings automatically. API and vector storage charges may apply.
4. Wait for **Ready**, then copy the `vs_...` value or choose **Download store
   details**. The download contains the vector store ID, model, dataset revision,
   batch and file IDs, and readiness. It contains no credentials. The ID is not an
   embedding token or an authentication key; another app still needs authorized
   API access to the same OpenAI project.

Indexing uploads one document per fund/section. Non-secret checkpoints are saved
locally so **Resume indexing** can reuse uploaded files and poll the same batch.
If the network fails during a write, the remote operation may have succeeded;
check OpenAI Storage before restarting. **Start a new index** resets only the
local checkpoint and does not delete old cloud files or stores. Manage/delete
unused stores and files in the OpenAI dashboard to control ongoing storage.
Disconnecting does not delete cloud resources. Failed indexing is never marked
ready. If storage is blocked, keep the store ID before closing the tab.

Every question includes the selected fund's current structured demo snapshot.
When a store is configured, semantic/keyword retrieval is filtered by fund,
platform vs terminal, and a hash of the dataset. A changed or unindexed dataset
is explicitly reported and the current snapshot is used. Rebuild the index after
editing the data. The platform's four funds and the terminal's four funds are
different datasets; each page builds its own scoped store. The simulated account
picker is a demo convenience, not an authentication or authorization boundary.
All client-side demo data is publicly readable by anyone with the static files.

Conversations stay in memory and are separated by selected fund/account.
Switching funds cancels pending answers. Responses use `store: false`; this does
not mean zero retention by OpenAI. Uploaded knowledge-base documents persist
until deleted. The client sends requests only to `https://api.openai.com/v1`.

Data limitations: positions are partial; some sample prices, percentages, dates,
and scenarios conflict. The instructions tell the model to identify conflicts,
cite the supplied sections, and avoid inventing totals or risk calculations.
The terminal only has detailed positions for Apex; other funds get their own
headline figures and an explicit missing-data explanation. Model calculations
are estimates, not a deterministic portfolio analytics engine. There are no
live feeds, web search, approvals, or trading actions in the chatbot.

`chat-config.js` contains the existing platform vector store ID, so a fresh
browser or Vercel deployment prefills it automatically. It is a public resource
identifier, not a secret. Connect a key authorized for the same OpenAI project.
The institutional terminal has no default store; it can use its snapshot alone
or create its own separate index. Do not recreate the platform index just to
open a new browser session.

Implementation: `chat-core.js` handles OpenAI and indexing, `chat-ui.js` handles
the connection and conversations, and `chat.css` styles the shared panel. Fund
adapters live in `app.js` and `institutional.js`. `node build.js` inlines these
assets into `dist/`. `npm test` runs mocked API regression checks without a key
or any paid requests. Mock checks cannot establish billing, model permissions,
browser access or answer quality for a different account. Live smoke tests on
October 13, 2026 verified the platform connection, 48-document indexing,
retrieval-backed answers, a fund switch, and conflicting scenario handling.
For an isolated browser test, run `node tests/browser-preview.cjs` and open
`http://127.0.0.1:4186/app.html`. It replaces all OpenAI calls with mocks; never
enter a real key in that test page. It is not a production backend.

Official references: [Retrieval](https://developers.openai.com/api/docs/guides/retrieval),
[Vector store search](https://developers.openai.com/api/reference/resources/vector_stores/methods/search),
[GPT-5.4 mini](https://developers.openai.com/api/docs/models/gpt-5.4-mini).

---

## Quick start

Open **`dist/index.html`** in any browser, or deploy the `dist/` folder (see below).

To rebuild `dist/` after editing the sources:

```bash
node build.js
```

---

## Project layout

```
staticPoint/
├── build.js            # bundler: sources -> dist/  (run with: node build.js)
├── README.md           # this file
│
├── index.html          # SOURCE · app markup (links styles.css + app.js)
├── styles.css          # SOURCE · app styles
├── app.js              # SOURCE · app logic (routing, charts, tables, theme)
├── landing.html        # SOURCE · marketing page (self-contained)
│
├── point.html          # standalone self-contained app (legacy single file)
│
└── dist/               # GENERATED — deploy this folder
    ├── index.html      #   landing page · the entry point hosts serve by default
    └── app.html        #   full platform app · self-contained
```

### Edit here, not there
Edit the **SOURCE** files in the root. The `dist/` files are generated by
`build.js` — don't hand-edit them (your changes get overwritten on the next build).

- App UI/data → `index.html`, `styles.css`, `app.js`
- Marketing page → `landing.html`

Then run `node build.js` to regenerate `dist/`.

---

## How the build works

`build.js` does three things:

1. **Inlines** `styles.css` and `app.js` into `index.html` to produce a single
   self-contained app file.
2. **Copies** the self-contained `landing.html`.
3. **Rewires cross-links** and writes `dist/`:
   - `landing.html`'s links to the app (`point.html`) → **`app.html`**
   - the app's back-links to the site (`landing.html`) → **`index.html`**

Result: the landing page becomes `dist/index.html` (the file every static host
serves by default), and the app sits beside it as `dist/app.html`.

Navigation flows both ways:
`index.html` → "Launch Platform" → `app.html` → "‹ Site" → `index.html`.

---

## Deploy

Upload the **contents of `dist/`** to any static host. The landing page loads
automatically as `index.html`.

| Host | How |
|------|-----|
| **Netlify** | Drag the `dist` folder onto the Netlify dashboard |
| **Vercel** | `vercel deploy dist` (or point a project at it) |
| **GitHub Pages** | Commit `dist/` contents to the Pages branch/root |
| **Cloudflare Pages** | Set the output directory to `dist` |
| **S3 / any web server** | Copy both files to the web root |

No server, no environment variables, no runtime needed.

---

## Before going live

**Wire the demo form.** The "Request a demo" form on the landing page POSTs to
[Formspree](https://formspree.io). In `landing.html`, replace the placeholder:

```js
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/your_form_id';
```

with your real form ID (create a form at formspree.io → copy its endpoint).
Until then it runs in **demo mode** — it shows the success state without sending.
Rebuild after editing: `node build.js`.

---

## Notes

- **Theme** — light/dark toggle in the header of both pages; the choice is saved to
  `localStorage` and shared across the landing page and the app.
- **Data** — everything in the app is illustrative dummy data (positions, PnL,
  Action Cards, prices). No live feeds.
- **Browser support** — modern evergreen browsers. Uses `fetch`,
  `IntersectionObserver`, and CSS custom properties.
