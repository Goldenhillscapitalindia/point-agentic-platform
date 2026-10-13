# Point — Agentic Intelligence for Investment Teams

A static marketing site + demo platform for **Point Agentic Solutions**: a landing
page and a fully-populated (dummy-data) platform app showcasing the ten specialist
agents, the Point Conductor, Action Cards, risk/PnL/research views, the 24/7
tokenized market, Point MCP and Point Execute.

Pure HTML/CSS/JS — no framework, no backend, no build tooling beyond Node for
bundling. Fonts load from Google Fonts; everything else is inline.

## Ask Portfolio Intelligence

Visitors choose a fund and ask a question immediately. There is no API-key form,
vector-store input, or indexing control in the visitor interface. Conversations
stay in browser memory and are separated by fund and demo account.

The pages remain static. One Vercel Function, `api/chat.js`, calls OpenAI using
server-only environment variables. It loads trusted fund snapshots generated
from the same datasets and table headings as the UI. The browser sends only the
fund, question and recent conversation. The server chooses the model and store;
visitor-supplied credentials, models, portfolio facts and resource IDs are ignored.

### Environment setup

Copy `.env.example` to `.env.local` and supply your key locally. Both `.env`
and `.env.local` are supported by `npm run dev` (local values take precedence).
Do not commit either file. Set the same variables in Vercel Project Settings:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Required. Key with Responses and read access to the configured vector store. |
| `OPENAI_VECTOR_STORE_ID` | Optional platform knowledge base. Existing ID: `vs_6acdd4ab3c448191b81ceb4a5be4be11`. |
| `OPENAI_TERMINAL_VECTOR_STORE_ID` | Optional separate terminal index; leave blank for snapshot-only answers. |
| `OPENAI_MODEL` | Optional; defaults to `gpt-5.4-mini`. |

These values are read during function execution, never embedded during the static
build. No public-prefixed variables are needed. After changing Vercel variables,
redeploy. With no key configured, visitors see a friendly unavailable message;
there is no fallback that asks them for credentials.

### Local development and Vercel

Use Node 22 or later, then `npm run dev`. Open
`http://127.0.0.1:4178/app.html` or `/terminal.html`. Set `PORT` to use another
port. This local server serves only the built pages and the same chat function;
it never serves env files or repository source.

On Vercel, deploy the **repository root**, with Framework Preset **Other**.
Use build command `npm run build` and output directory `dist`; the root
`vercel.json` supplies these settings. Keep the Vercel Root Directory empty
(or `.`), not `dist`, so Vercel includes `api/chat.js` and its data.
Uploading only `dist` serves the pages but cannot run the chatbot.

This is a shared, publicly callable demo endpoint; all visitors' questions use
the configured OpenAI account. Request/history lengths and response tokens are
bounded, but the route is not user authentication or a global rate limiter. Use
Vercel Deployment Protection for a private demo or Firewall rate limits for a
public rollout, and monitor OpenAI usage. The simulated account picker does not
restrict access to confidential data. Only public illustrative data belongs here.

### Knowledge base maintenance

Each answer includes the latest built fund snapshot. Optional retrieval matches
fund, platform/terminal and dataset revision, so stale documents cannot override
updated briefs. If the index is older than the site, the answer uses the current
snapshot and reports that no matching indexed version was found.

After changing fund data, the owner can run `npm run index:knowledge -- platform`
(or `-- terminal`) with environment variables configured. This uploads one file
per section and lets OpenAI generate embeddings. It adds the new revision to the
configured store, or creates a store if the corresponding ID is blank. The command
prints the resulting store ID. Non-secret resumable checkpoints live in ignored
`.point-index/`. Repeating the same completed revision does not upload it again.
There is no public indexing endpoint. Indexing may incur OpenAI charges; it does
not delete older documents. Manage obsolete files and stores in OpenAI Storage.
After an ambiguous network failure, inspect OpenAI Storage before retrying.

### Data and verification

The platform and terminal share a fund roster but have separate datasets. Only Alpha has detailed terminal
holdings; other terminal funds get their own headline figures. Positions are
partial and some example figures conflict. Answers must identify conflicts,
cite sections and avoid inventing risk calculations. Recommendations use the
supplied sizing and triggers; they cannot approve or execute trades.

`build-data.js` generates `server/portfolio-data.json` at build time from the
source datasets and adapters. `chat-core.js` handles OpenAI/retrieval and owner
indexing; `chat-ui.js` sends visitor questions to `/api/chat`. Responses use
`store: false`, which does not mean zero retention by OpenAI. Index documents
persist until deleted.

Run `npm test` for mocked API checks. Run `node tests/browser-preview.cjs` and
open `http://127.0.0.1:4186/app.html` for a clearly labeled mock UI preview that
uses the real local route with a mocked upstream. Neither command needs a real
key or makes paid requests. Prior browser-only live tests verified indexing and
answers; the new server route requires configured environment variables for a
live deployment check.

Official references: [OpenAI authentication](https://developers.openai.com/api/reference/overview),
[Vercel functions](https://vercel.com/docs/functions),
[Vercel environment variables](https://vercel.com/docs/environment-variables).

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
| **Vercel** | Deploy the repository root; root `vercel.json` builds `dist` plus the chat function |
| **GitHub Pages** | Commit `dist/` contents to the Pages branch/root |
| **Cloudflare Pages** | Set the output directory to `dist` |
| **S3 / any web server** | Copy both files to the web root |

Static-only hosts serve the pages. The shared chatbot needs the Vercel function and server environment variables described above.

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
