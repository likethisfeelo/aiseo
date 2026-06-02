# ============================================================
# AISEO Prod S3 deploy script (PowerShell)
#
# S3 bucket structure:
#   /index.html              <- aiseo.tips (landing)
#   /b2b.html                <- aiseo.tips/b2b.html
#   /b2b/index.html          <- b2b.aiseo.tips
#   /site/index.html         <- site.aiseo.tips (B2C dashboard)
#   /site/assets/            <- site.aiseo.tips JS/CSS
#   /{siteId}/               <- {siteId}.aiseo.tips (user sites)
#
# Usage: .\scripts\deploy-prod.ps1
# ============================================================

$ErrorActionPreference = "Stop"

$BUCKET = "aiseo-sites-bucket"
$PROFILE = "aiseo"
$DISTRIBUTION_ID = "EZSNEM80TUP6K"

Write-Host ""
Write-Host "============================================" -ForegroundColor Red
Write-Host "  !! PRODUCTION DEPLOY - aiseo.tips" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""
Write-Host "  Target bucket:       $BUCKET"
Write-Host "  CloudFront dist:     $DISTRIBUTION_ID"
Write-Host "  Domains affected:"
Write-Host "    - aiseo.tips"
Write-Host "    - site.aiseo.tips"
Write-Host "    - b2b.aiseo.tips"
Write-Host ""

# Safety confirmation
$confirm = Read-Host "Type 'deploy-prod' to proceed"
if ($confirm -ne "deploy-prod") {
    Write-Host "Aborted." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== AISEO Prod Deploy ===" -ForegroundColor Cyan

# 1. Build frontend (prod env vars)
Write-Host "[1/5] Building frontend (VITE_APP_ENV=prod)..." -ForegroundColor Yellow
Push-Location frontend
$env:VITE_APP_ENV = "prod"
$env:PRERENDER_BASE_URL = "https://site.aiseo.tips"
npm run build
Remove-Item Env:\VITE_APP_ENV -ErrorAction SilentlyContinue
Remove-Item Env:\PRERENDER_BASE_URL -ErrorAction SilentlyContinue
Pop-Location

# 2. Upload landing page + apex assets to S3 root (aiseo.tips)
Write-Host "[2/5] Uploading landing page + apex assets to root..." -ForegroundColor Yellow
# apex 메인은 aiseo-main.html 로 교체 (이전: philo-main.html, _archive/ 에 보관)
aws s3 cp frontend/dist/aiseo-main.html "s3://$BUCKET/index.html" --content-type "text/html; charset=utf-8" --profile $PROFILE
# aiseo-main.html 이 참조하는 자산 (hero.mp4, icon/, images/, principle-icons/) 을 apex 루트에 배치
aws s3 sync frontend/public/icon/             "s3://$BUCKET/icon/"            --profile $PROFILE
aws s3 sync frontend/public/images/           "s3://$BUCKET/images/"          --profile $PROFILE
aws s3 sync frontend/public/principle-icons/  "s3://$BUCKET/principle-icons/" --profile $PROFILE
aws s3 cp   frontend/public/hero.mp4          "s3://$BUCKET/hero.mp4"         --content-type "video/mp4" --profile $PROFILE
# robots.txt 를 apex + b2b prefix 에 복사 (site/* 는 4단계 sync 에 포함)
aws s3 cp frontend/public/robots.txt "s3://$BUCKET/robots.txt" --content-type "text/plain; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/public/robots.txt "s3://$BUCKET/b2b/robots.txt" --content-type "text/plain; charset=utf-8" --profile $PROFILE

# 3. Upload B2B page
Write-Host "[3/5] Uploading B2B page..." -ForegroundColor Yellow
aws s3 cp frontend/dist/b2b.html "s3://$BUCKET/b2b.html" --content-type "text/html; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/dist/b2b.html "s3://$BUCKET/b2b/index.html" --content-type "text/html; charset=utf-8" --profile $PROFILE
# b2b.aiseo.tips 가 /landing/* 을 /b2b/landing/* 로 리라이트하므로 hero 이미지도 같이 복사
aws s3 sync frontend/public/landing/ "s3://$BUCKET/b2b/landing/" --exclude "*.md" --profile $PROFILE

# 4. Upload SPA dashboard + prerendered HTML to /site/ (site.aiseo.tips)
#    - index.html (SPA shell) + assets/ + prerendered subdirectories
#      (course2026/, support2026/, events2026/, blog/)
#    - Do NOT use --delete (blog Lambda creates site/blog/<slug>/index.html at runtime)
Write-Host "[4/5] Uploading SPA + prerendered HTML to /site/..." -ForegroundColor Yellow
aws s3 sync frontend/dist/ "s3://$BUCKET/site/" `
  --exclude "aiseo-main.html" `
  --exclude "b2b.html" `
  --exclude "hero.mp4" `
  --exclude "icon/*" `
  --exclude "images/*" `
  --exclude "principle-icons/*" `
  --exclude "_archive/*" `
  --profile $PROFILE

# 5. CloudFront cache invalidation
Write-Host "[5/5] Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --profile $PROFILE

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host "  aiseo.tips              -> Landing"
Write-Host "  b2b.aiseo.tips          -> B2B"
Write-Host "  site.aiseo.tips         -> B2C Dashboard"
