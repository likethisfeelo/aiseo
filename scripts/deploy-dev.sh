#!/bin/bash
# ============================================================
# AISEO Dev 환경 S3 배포 스크립트
#
# S3 버킷 구조:
#   /index.html              ← dev.aiseo.tips (회사 소개 랜딩)
#   /b2b.html                ← dev.aiseo.tips/b2b.html
#   /b2b/index.html          ← b2b.dev.aiseo.tips
#   /site/index.html          ← site.dev.aiseo.tips (B2C 대시보드)
#   /site/assets/             ← site.dev.aiseo.tips JS/CSS
#   /{siteId}/                ← {siteId}.dev.aiseo.tips (사용자 사이트)
#
# 사용법:
#   PowerShell: .\scripts\deploy-dev.ps1
#   Bash:       bash scripts/deploy-dev.sh
# ============================================================

BUCKET="aiseo-sites-dev-bucket"
PROFILE="aiseo"
DISTRIBUTION_ID="E2SBJ84WHHWIJM"

echo "=== AISEO Dev Deploy ==="

# 1. 프론트엔드 빌드
echo "[1/5] Building frontend..."
cd frontend
npm run build
cd ..

# 2. 랜딩페이지를 S3 루트에 업로드 (dev.aiseo.tips)
echo "[2/5] Uploading landing page to root..."
aws s3 cp frontend/dist/philo-main.html s3://$BUCKET/index.html --content-type "text/html; charset=utf-8" --profile $PROFILE

# 3. B2B 페이지 업로드
echo "[3/5] Uploading B2B page..."
aws s3 cp frontend/dist/b2b.html s3://$BUCKET/b2b.html --content-type "text/html; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/dist/b2b.html s3://$BUCKET/b2b/index.html --content-type "text/html; charset=utf-8" --profile $PROFILE

# 4. SPA 대시보드 + 프리렌더 HTML을 /site/에 업로드 (site.dev.aiseo.tips)
#    - index.html (SPA shell) + assets/ + 프리렌더 서브디렉토리
#      (course2026/, support2026/, events2026/, blog/)
#    - `--delete` 는 쓰지 않는다. 블로그 Lambda 가 런타임에 생성하는
#      `site/blog/<slug>/index.html` 이 같이 삭제되기 때문.
#      대신 landing 전용 파일(philo-main/b2b)만 제외하고 sync.
echo "[4/5] Uploading SPA + prerendered HTML to /site/..."
aws s3 sync frontend/dist/ s3://$BUCKET/site/ \
  --exclude "philo-main.html" \
  --exclude "b2b.html" \
  --profile $PROFILE

# 5. CloudFront 캐시 무효화
echo "[5/5] Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --profile $PROFILE

echo "=== Deploy complete ==="
echo "  dev.aiseo.tips          → 회사 소개 랜딩"
echo "  b2b.dev.aiseo.tips      → B2B 서비스"
echo "  site.dev.aiseo.tips     → B2C 대시보드"
