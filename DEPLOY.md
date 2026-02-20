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

## 2) Publish to your web server path
Your site URL target implies this filesystem path pattern on the server:
- `<web-root>/games/politicalc`

Typical examples:
- Apache cPanel: `public_html/games/politicalc`
- Nginx server root: `/var/www/thecookblog.com/games/politicalc`

Deploy options:
1. Clone the repo directly into that folder.
2. Or pull updates into that folder from an existing clone.

Example (server shell):

```bash
cd <web-root>/games
git clone https://github.com/<your-user>/<your-repo>.git politicalc
```

For updates:

```bash
cd <web-root>/games/politicalc
git pull origin main
```

## 3) Verify app URL
Open:
- `https://www.thecookblog.com/games/politicalc/`

Expected files served:
- `index.html`
- `styles.css`
- `app.js`
- `political-quiz-bank.json`

## 4) Notes
- No backend is required for v1.
- If your host blocks `.json` files, add a MIME type rule for `application/json`.
- If your host is Apache and directory listing/indexing is customized, ensure `index.html` is allowed as default index.
