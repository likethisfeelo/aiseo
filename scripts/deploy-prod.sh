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
# aiseo.tips (apex) 전용 sitemap. b2b./site. 는 각각 별도 sitemap 을
# 관리하므로 (광고계정·서치콘솔 분리) 여기서는 apex 한 곳에만 업로드.
aws s3 cp frontend/public/aiseo-main-sitemap.xml s3://$BUCKET/sitemap.xml \
  --content-type "application/xml; charset=utf-8" --profile $PROFILE
# apex 의 단일 파일 stub /account.html — 로그인 후 진입할 회원 페이지 (P-7 까지 placeholder).
# noindex 라 sitemap 에는 안 들어감. (docs/membership-260602.md)
aws s3 cp frontend/public/account.html s3://$BUCKET/account.html \
  --content-type "text/html; charset=utf-8" --profile $PROFILE

# /library/ — apex 라이브러리 페이지. CF subdomain-router 가 /library,
# /library/ clean URL 을 /library/index.html 로 rewrite. reader-config.js 는
# 별도 sed + cp 로 처리하므로 sync 에서 exclude.
aws s3 sync frontend/public/library/ s3://$BUCKET/library/ \
  --exclude "reader-config.js" \
  --content-type "text/html; charset=utf-8" --profile $PROFILE

# /login.html + /login-config.js — HTML 은 그대로 복사하고 ASCII-only 인
# login-config.js 에만 sed 로 Cognito 값 치환. HTML 에 sed 를 직접 걸면
# 한국어 인코딩이 일부 환경에서 손상되어 mojibake 발생.
aws s3 cp frontend/public/login.html s3://$BUCKET/login.html \
  --content-type "text/html; charset=utf-8" --profile $PROFILE

_POOL_ID="${VITE_COGNITO_USER_POOL_ID:-$(grep '^VITE_COGNITO_USER_POOL_ID=' frontend/.env 2>/dev/null | cut -d= -f2-)}"
_CLIENT_ID="${VITE_COGNITO_CLIENT_ID:-$(grep '^VITE_COGNITO_CLIENT_ID=' frontend/.env 2>/dev/null | cut -d= -f2-)}"
_REGION="$(echo "$_POOL_ID" | cut -d_ -f1)"
sed -e "s|%%COGNITO_REGION%%|${_REGION}|g" \
    -e "s|%%COGNITO_CLIENT_ID%%|${_CLIENT_ID}|g" \
    frontend/public/login-config.js > /tmp/aiseo-login-config.js
aws s3 cp /tmp/aiseo-login-config.js s3://$BUCKET/login-config.js \
  --content-type "application/javascript; charset=utf-8" --profile $PROFILE
rm /tmp/aiseo-login-config.js

# /library/reader-config.js — apex /library/{cover}/{post} reader 가 fetch
# 하는 Cognito + API base 설정. login-config 와 같은 sed 패턴.
_API_BASE="${VITE_API_BASE_URL_PROD:-https://api.aiseo.tips}"
sed -e "s|%%COGNITO_REGION%%|${_REGION}|g" \
    -e "s|%%COGNITO_CLIENT_ID%%|${_CLIENT_ID}|g" \
    -e "s|%%API_BASE_URL%%|${_API_BASE}|g" \
    frontend/public/library/reader-config.js > /tmp/aiseo-reader-config.js
aws s3 cp /tmp/aiseo-reader-config.js s3://$BUCKET/library/reader-config.js \
  --content-type "application/javascript; charset=utf-8" --profile $PROFILE
rm /tmp/aiseo-reader-config.js

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
  --exclude "aiseo-main-sitemap.xml" \
  --exclude "account.html" \
  --exclude "login.html" \
  --exclude "login-config.js" \
  --exclude "b2b.html" \
  --exclude "hero.mp4" \
  --exclude "icon/*" \
  --exclude "images/*" \
  --exclude "principle-icons/*" \
  --exclude "library/*" \
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
