# Publish GestureVerse from Windows PowerShell

Run these commands from the extracted `GestureVerse-FX-Studio` folder.

## 1. Verify tools

```powershell
git --version
gh --version
node -v
```

Install missing tools:

```powershell
winget install --id Git.Git -e
winget install --id GitHub.cli -e
```

Close and reopen PowerShell after installation.

## 2. Sign in

```powershell
gh auth login
```

Choose GitHub.com, HTTPS, and browser authentication.

## 3. Validate the project

```powershell
npm ci --include=dev --no-audit --no-fund
npm run check
```

## 4. Create the local Git history

```powershell
git init
git branch -M main
git add .
git commit -m "Initial release of GestureVerse FX Studio"
```

If Git requests your identity:

```powershell
git config --global user.name "Darshan Paapani"
git config --global user.email "YOUR_GITHUB_EMAIL"
git commit -m "Initial release of GestureVerse FX Studio"
```

## 5. Create and push the public repository

```powershell
gh repo create GestureVerse-FX-Studio --public --source=. --remote=origin --push --description "AI-powered real-time gesture-controlled cinematic VFX studio"
```

## 6. Enable GitHub Pages workflow deployment

```powershell
$repo = gh repo view --json nameWithOwner -q .nameWithOwner
gh api --method POST "repos/$repo/pages" -f build_type=workflow
```

If that command says the Pages site already exists, use:

```powershell
gh api --method PUT "repos/$repo/pages" -f build_type=workflow
```

## 7. Run and watch deployment

```powershell
gh workflow run deploy.yml
gh run watch --exit-status
```

## 8. Print and open the public URL

```powershell
$publicUrl = gh api "repos/$repo/pages" --jq .html_url
$publicUrl
Start-Process $publicUrl
```

The URL normally has this form:

```text
https://YOUR-GITHUB-USERNAME.github.io/GestureVerse-FX-Studio/
```
