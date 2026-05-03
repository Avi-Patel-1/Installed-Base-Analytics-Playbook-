# Deployment

The app builds to static files and can be hosted on GitHub Pages.

## Local Verification

```bash
npm install
npm run test
npm run build
npm run preview
```

## GitHub Pages

The workflow at `.github/workflows/deploy.yml` runs tests, builds the Vite site, uploads `dist`, and deploys it with GitHub Pages.

The same workflow also runs the Python analytics export before the Vite build. The generated files in `public/analytics/` are copied into `dist/analytics/` as static assets.

Recommended repository settings:

1. Push the project to a GitHub repository.
2. Open repository settings.
3. Open Pages.
4. Set Source to GitHub Actions.
5. Run the `Deploy static site` workflow or push to `main`.

## Base Path

The Vite config uses a relative base path by default so repository Pages works without hardcoding a repository name.

If your deployment target requires an explicit base path, set:

```bash
VITE_BASE_PATH="/repository-name/" npm run build
```

For user or organization Pages at the domain root, keep the default or set:

```bash
VITE_BASE_PATH="/" npm run build
```
