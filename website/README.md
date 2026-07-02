# Eismark World Handbook Website

Netlify-hosted GM/player website for browsing the Eismark campaign lore as a modular world handbook.

The site is now a Next.js app. Player users receive only player-safe markdown from the server. GM-only chapters and spoiler-heavy entries are sent only after GM login.

## Framework

- Framework: Next.js App Router
- Frontend: React-rendered shell plus the existing wiki JavaScript
- Backend: Next.js Route Handlers under `app/api`
- Hosting target: Netlify

This is not a static-only site because GM/player access depends on server-side filtering. Netlify can host it as a Next.js app and run the API routes as serverless infrastructure.

## Run Locally

From the `website` folder:

```powershell
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:3000
```

## GM Password

Local default GM password:

```text
5446
```

For hosting, set Netlify environment variables instead of relying on the local default:

- `GM_PASSWORD`: the GM login password.
- `AUTH_SECRET`: a long random secret used to sign the GM session cookie.

The GM session is stored in an httpOnly signed cookie. Static JavaScript no longer contains the GM password hash.

## GitHub Editor Write-Back

GM/Editor mode can reveal and locally edit content after the GM password gate. Permanent production writes require a separate GitHub OAuth login, so knowing the GM password is not enough to commit to the repository.

Create a GitHub OAuth App and set its callback URL to:

```text
https://<site-domain>/api/github/callback
```

For local development, also allow:

```text
http://127.0.0.1:3000/api/github/callback
```

Add these Netlify environment variables:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH`
- `GITHUB_ALLOWED_USERS`
- `GITHUB_OAUTH_SCOPE` optional, defaults to `repo`
- `AUTH_SECRET`

Production saves use server-side route handlers and GitHub's REST API. The browser never receives the GitHub client secret or access token.

## Deploy To Netlify

1. Push this project to a Git provider connected to Netlify.
2. In Netlify, create a new site from that repository.
3. Set the base directory / project root to `website`.
4. Build command: `npm run build`.
5. Publish directory: `.next`.
6. Add environment variables in Netlify:
   - `GM_PASSWORD`
   - `AUTH_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `GITHUB_OWNER`
   - `GITHUB_REPO`
   - `GITHUB_BRANCH`
   - `GITHUB_ALLOWED_USERS`
7. Deploy.
8. Confirm the temporary Netlify URL works before connecting your custom domain.

Netlify supports modern Next.js apps, including App Router route handlers/API routes, through its OpenNext adapter. This project does not pin the adapter package; Netlify manages it during deployment.

## Custom Domain Deployment Checklist

1. Deploy the site on Netlify first.
2. Confirm the temporary Netlify URL works.
3. In Netlify, go to:
   Site configuration > Domain management
4. Click:
   Add a domain
5. Enter my custom domain.
6. Netlify will show the DNS records needed.
7. Go to the domain provider where I bought the domain.
8. Open DNS settings.
9. Add the records Netlify gives me.
10. Make sure both versions work:
   - mydomain.com
   - www.mydomain.com
11. Enable HTTPS/SSL in Netlify.
12. Wait for DNS propagation if needed.

## Content Model

- The public handbook uses `content/archive/Eismark_Readable_Guide_v0.1.md`.
- Markdown entries are parsed by `###` headings and grouped by their nearest `##` chapter.
- Displayed entry titles remove internal archive IDs and status labels.
- GM-only chapters are configured in `content/manifest.json` under `gmLockedSections`.
- Current GM-locked chapters: `Campaign Premise`, `Archive Notes`, `Recovery Reports`, and `Images`.
- GM-only individual entries are configured in `content/manifest.json` under `gmLockedTitlePatterns`.
- Player requests receive a server-filtered handbook from `/api/handbook`.
- GM requests receive the full handbook from `/api/handbook` only after `/api/login` creates a signed session.
- Each entry has its own hash route, such as `#/entry/nations-the-sacrament-of-kaltheim`.
- Wiki routes use hash routing, so browser refreshes stay on the same deployed page and do not require a custom catch-all rewrite.

## Site Structure

- `#/home` is the wiki-style landing page with a world summary, featured articles, and chapter portals.
- `#/search` displays search results from the top search bar.
- `#/chapter/<chapter>` displays a chapter index.
- `#/entry/<entry>` displays a single article page.
- Saved pages are stored in browser local storage. The sidebar shows saved pages as links until there are more than five, then switches to a dropdown.
- The top-left arrow buttons navigate backward and forward through pages visited during the current browser session.

## Maintenance Rule

Update this website in parallel with the ECD Archive, ECD Master Index, and readable handbook whenever lore changes affect reader-facing content, GM-only content, entry names, section structure, or reference images. After changing `../outputs`, run `.\scripts\sync-content.ps1` from this folder so the site uses the same current lore bundle.

## Sync Lore Content

After updating files in `../outputs`, run:

```powershell
.\scripts\sync-content.ps1
```

That copies the latest archive markdown into `content/archive`.
