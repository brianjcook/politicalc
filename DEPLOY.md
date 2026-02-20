# Deploy Guide: thecookblog.com/games/politicalc

## 1) Create GitHub repo and push this folder
Run from `C:\codex\politicalc`:

```powershell
git init
git add .
git commit -m "Initial political self-insight quiz app"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## 2) GitHub Actions FTP auto-deploy setup
A workflow file already exists at:
- `.github/workflows/deploy.yml`

In GitHub, set these repository secrets:
1. `FTP_SERVER` -> FTP host (example: `ftp.thecookblog.com`)
2. `FTP_USERNAME` -> FTP username
3. `FTP_PASSWORD` -> FTP password
4. `FTP_PROTOCOL` -> `ftp` or `ftps` (start with what your host documents)
5. `FTP_PORT` -> usually `21` for FTP/explicit FTPS (sometimes `990` for implicit FTPS)
6. `FTP_SERVER_DIR` -> remote path ending in slash, typically `/public_html/games/politicalc/`

Once secrets are saved, every push to `main` deploys automatically.
You can also run it manually from the `Actions` tab (`workflow_dispatch`).

## 3) One-time FTP folder check
Make sure this folder exists (or allow action to create it):
- `public_html/games/politicalc`

## 4) Verify app URL
Open:
- `https://www.thecookblog.com/games/politicalc/`

Expected files served:
- `index.html`
- `styles.css`
- `app.js`
- `political-quiz-bank.json`
- `.htaccess`

## 5) Notes
- No backend is required for v1.
- `.htaccess` is included to force JSON MIME type and disable caching for `.html/.css/.js/.json` during updates.
