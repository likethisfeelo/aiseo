# ============================================================
# AISEO Dev 환경 S3 배포 스크립트 (PowerShell)
#
# S3 버킷 구조:
#   /index.html              <- dev.aiseo.tips (회사 소개 랜딩)
#   /b2b.html                <- dev.aiseo.tips/b2b.html
#   /b2b/index.html          <- b2b.dev.aiseo.tips
#   /site/index.html         <- site.dev.aiseo.tips (B2C 대시보드)
#   /site/assets/            <- site.dev.aiseo.tips JS/CSS
#   /{siteId}/               <- {siteId}.dev.aiseo.tips (사용자 사이트)
#
# 사용법: .\scripts\deploy-dev.ps1
# ============================================================

$BUCKET = "aiseo-sites-dev-bucket"
$PROFILE = "aiseo"
$DISTRIBUTION_ID = "E2SBJ84WHHWIJM"

Write-Host "=== AISEO Dev Deploy ===" -ForegroundColor Cyan

# 1. 프론트엔드 빌드
Write-Host "[1/5] Building frontend..." -ForegroundColor Yellow
Push-Location frontend
npm run build
Pop-Location

# 2. 랜딩페이지 + 자산을 S3 루트에 업로드 (dev.aiseo.tips)
Write-Host "[2/5] Uploading landing page + apex assets to root..." -ForegroundColor Yellow
# apex 메인은 aiseo-main.html 로 교체 (이전: philo-main.html, _archive/ 에 보관)
aws s3 cp frontend/dist/aiseo-main.html "s3://$BUCKET/index.html" --content-type "text/html; charset=utf-8" --profile $PROFILE
# aiseo-main.html 이 참조하는 자산들 (hero.mp4, icon/, images/, principle-icons/) 을 apex 루트에 배치
aws s3 sync frontend/public/icon/             "s3://$BUCKET/icon/"            --profile $PROFILE
aws s3 sync frontend/public/images/           "s3://$BUCKET/images/"          --profile $PROFILE
aws s3 sync frontend/public/principle-icons/  "s3://$BUCKET/principle-icons/" --profile $PROFILE
aws s3 cp   frontend/public/hero.mp4          "s3://$BUCKET/hero.mp4"         --content-type "video/mp4" --profile $PROFILE
# robots.txt 를 apex + b2b prefix 에 복사 (site/* 는 4단계 sync 에 포함)
aws s3 cp frontend/public/robots.txt "s3://$BUCKET/robots.txt" --content-type "text/plain; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/public/robots.txt "s3://$BUCKET/b2b/robots.txt" --content-type "text/plain; charset=utf-8" --profile $PROFILE

# 3. B2B 페이지 업로드
Write-Host "[3/5] Uploading B2B page..." -ForegroundColor Yellow
aws s3 cp frontend/dist/b2b.html "s3://$BUCKET/b2b.html" --content-type "text/html; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/dist/b2b.html "s3://$BUCKET/b2b/index.html" --content-type "text/html; charset=utf-8" --profile $PROFILE
# b2b.dev.aiseo.tips 가 /landing/* 을 /b2b/landing/* 로 리라이트하므로 hero 이미지도 같이 복사
aws s3 sync frontend/public/landing/ "s3://$BUCKET/b2b/landing/" --exclude "*.md" --profile $PROFILE

# 4. SPA 대시보드 + 프리렌더 HTML을 /site/에 업로드 (site.dev.aiseo.tips)
#    - index.html (SPA shell) + assets/ + 프리렌더 서브디렉토리
#      (course2026/, support2026/, events2026/, blog/)
#    - `--delete` 는 쓰지 않는다. 블로그 Lambda 가 런타임에 생성하는
#      site/blog/<slug>/index.html 이 같이 삭제되기 때문.
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

# 5. CloudFront 캐시 무효화
Write-Host "[5/5] Invalidating CloudFront cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --profile $PROFILE

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host "  dev.aiseo.tips          -> 회사 소개 랜딩"
Write-Host "  b2b.dev.aiseo.tips      -> B2B 서비스"
Write-Host "  site.dev.aiseo.tips     -> B2C 대시보드"
