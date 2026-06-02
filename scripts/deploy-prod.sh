#!/bin/bash
# ============================================================
# AISEO Prod 환경 S3 배포 스크립트
#
# S3 버킷 구조:
#   /index.html              ← aiseo.tips (회사 소개 랜딩)
#   /b2b.html                ← aiseo.tips/b2b.html
#   /b2b/index.html          ← b2b.aiseo.tips
#   /site/index.html          ← site.aiseo.tips (B2C 대시보드)
#   /site/assets/             ← site.aiseo.tips JS/CSS
#   /{siteId}/                ← {siteId}.aiseo.tips (사용자 사이트)
#
# 사용법:
#   Bash:       bash scripts/deploy-prod.sh
#   PowerShell: .\scripts\deploy-prod.ps1
# ============================================================

set -euo pipefail

BUCKET="aiseo-sites-bucket"
PROFILE="aiseo"
DISTRIBUTION_ID="EZSNEM80TUP6K"

echo ""
echo "============================================"
echo "  !! PRODUCTION DEPLOY — aiseo.tips"
echo "============================================"
echo ""
echo "  Target bucket:       $BUCKET"
echo "  CloudFront dist:     $DISTRIBUTION_ID"
echo "  Domains affected:"
echo "    - aiseo.tips"
echo "    - site.aiseo.tips"
echo "    - b2b.aiseo.tips"
echo ""

# ── 안전 확인 ──
read -p "계속하려면 'deploy-prod' 를 입력하세요: " CONFIRM
if [ "$CONFIRM" != "deploy-prod" ]; then
  echo "Aborted."
  exit 1
fi

echo ""
echo "=== AISEO Prod Deploy ==="

# 1. 프론트엔드 빌드 (prod 환경변수 주입)
echo "[1/5] Building frontend (VITE_APP_ENV=prod)..."
cd frontend
VITE_APP_ENV=prod PRERENDER_BASE_URL=https://site.aiseo.tips npm run build
cd ..

# 2. 랜딩페이지 + 자산을 S3 루트에 업로드 (aiseo.tips)
echo "[2/5] Uploading landing page + apex assets to root..."
# apex 메인은 aiseo-main.html 로 교체 (이전: philo-main.html, _archive/ 에 보관)
aws s3 cp frontend/dist/aiseo-main.html s3://$BUCKET/index.html \
  --content-type "text/html; charset=utf-8" --profile $PROFILE
# aiseo-main.html 이 참조하는 자산들 (hero.mp4, icon/, images/, principle-icons/) 을
# apex 루트에 그대로 배치 — HTML 의 상대 경로(`src="icon/..."` 등)가 동작하려면
# S3 버킷 루트에 동일 트리로 존재해야 함.
aws s3 sync frontend/public/icon/             s3://$BUCKET/icon/             --profile $PROFILE
aws s3 sync frontend/public/images/           s3://$BUCKET/images/           --profile $PROFILE
aws s3 sync frontend/public/principle-icons/  s3://$BUCKET/principle-icons/  --profile $PROFILE
aws s3 cp   frontend/public/hero.mp4          s3://$BUCKET/hero.mp4          --content-type "video/mp4" --profile $PROFILE
# robots.txt 는 apex(aiseo.tips), b2b(b2b.aiseo.tips), site(site.aiseo.tips)
# 셋 다 자기 도메인 루트에서 보여야 하므로 세 prefix 모두에 복사한다.
# site/* 는 4단계 sync 에서 dist 와 함께 처리됨.
aws s3 cp frontend/public/robots.txt s3://$BUCKET/robots.txt \
  --content-type "text/plain; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/public/robots.txt s3://$BUCKET/b2b/robots.txt \
  --content-type "text/plain; charset=utf-8" --profile $PROFILE

# 3. B2B 페이지 업로드
echo "[3/5] Uploading B2B page..."
aws s3 cp frontend/dist/b2b.html s3://$BUCKET/b2b.html \
  --content-type "text/html; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/dist/b2b.html s3://$BUCKET/b2b/index.html \
  --content-type "text/html; charset=utf-8" --profile $PROFILE
# b2b.aiseo.tips 는 CF subdomain-router 가 `/landing/*` 요청을
# `/b2b/landing/*` 로 리라이트하므로, b2b.html 안에서 참조되는 hero
# 이미지도 같은 prefix 아래로 함께 복사한다.
aws s3 sync frontend/public/landing/ s3://$BUCKET/b2b/landing/ \
  --exclude "*.md" \
  --profile $PROFILE

# 4. SPA 대시보드 + 프리렌더 HTML을 /site/에 업로드 (site.aiseo.tips)
#    - index.html (SPA shell) + assets/ + 프리렌더 서브디렉토리
#      (course2026/, support2026/, events2026/, blog/)
#    - `--delete` 는 쓰지 않는다. 블로그 Lambda 가 런타임에 생성하는
#      site/blog/<slug>/index.html 이 같이 삭제되기 때문.
echo "[4/5] Uploading SPA + prerendered HTML to /site/..."
aws s3 sync frontend/dist/ s3://$BUCKET/site/ \
  --exclude "aiseo-main.html" \
  --exclude "b2b.html" \
  --exclude "hero.mp4" \
  --exclude "icon/*" \
  --exclude "images/*" \
  --exclude "principle-icons/*" \
  --exclude "_archive/*" \
  --profile $PROFILE

# 5. CloudFront 캐시 무효화
echo "[5/5] Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --profile $PROFILE

echo ""
echo "=== Deploy complete ==="
echo "  aiseo.tips              → 회사 소개 랜딩"
echo "  b2b.aiseo.tips          → B2B 서비스"
echo "  site.aiseo.tips         → B2C 대시보드"
