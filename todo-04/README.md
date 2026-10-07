# Todo 04

A dependency-free, single-list todo app. Tasks are stored in the browser with `localStorage`.

## Deploy to Vercel

This repository is ready to import as a Vercel project:

1. Push these files to your connected GitHub repository.
2. In the [Vercel dashboard](https://vercel.com/new), choose **Add New → Project** and import the repository.
3. Keep the detected settings from `vercel.json` and select **Deploy**.

No environment variables are needed. Vercel runs `npm run build` and publishes `dist/`. Future pushes to the production branch will deploy automatically.

If Vercel asks for settings manually, use:

- **Framework Preset:** Other
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install` (default)

## Run locally

From the repository root, start any static HTTP server, for example:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

Serving over HTTP is recommended because browser storage behavior for `file://` pages is inconsistent. To verify the production output locally, run `npm run build` and serve the `dist/` directory.

## Test

```sh
npm install
npx playwright install chromium
npm test
```

## Use

- Type a task and press **Enter** or choose **Add task**.
- Check a task to complete it; use **All**, **Active**, and **Completed** to filter.
- **Delete** and **Clear completed** ask for confirmation before removing tasks.
- Tasks and completion state restore on reload when browser storage is available.
