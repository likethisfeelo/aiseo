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

# 2. 랜딩페이지 + 자산을 S3 루트에 업로드 (dev.aiseo.tips)
echo "[2/5] Uploading landing page + apex assets to root..."
# apex 메인은 aiseo-main.html 로 교체 (이전: philo-main.html, _archive/ 에 보관)
aws s3 cp frontend/dist/aiseo-main.html s3://$BUCKET/index.html --content-type "text/html; charset=utf-8" --profile $PROFILE
# aiseo-main.html 이 참조하는 자산들 (hero.mp4, icon/, images/, principle-icons/) 을
# apex 루트에 그대로 배치 — HTML 의 상대 경로(`src="icon/..."` 등)가 동작하려면
# S3 버킷 루트에 동일 트리로 존재해야 함.
aws s3 sync frontend/public/icon/             s3://$BUCKET/icon/             --profile $PROFILE
aws s3 sync frontend/public/images/           s3://$BUCKET/images/           --profile $PROFILE
aws s3 sync frontend/public/principle-icons/  s3://$BUCKET/principle-icons/  --profile $PROFILE
aws s3 cp   frontend/public/hero.mp4          s3://$BUCKET/hero.mp4          --content-type "video/mp4" --profile $PROFILE
# robots.txt 는 apex(dev.aiseo.tips), b2b(b2b.dev.aiseo.tips),
# site(site.dev.aiseo.tips) 셋 다 자기 도메인 루트에서 보여야 하므로
# 세 prefix 에 모두 복사. site/* 는 4단계 sync 에서 dist 와 함께 처리.
aws s3 cp frontend/public/robots.txt s3://$BUCKET/robots.txt --content-type "text/plain; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/public/robots.txt s3://$BUCKET/b2b/robots.txt --content-type "text/plain; charset=utf-8" --profile $PROFILE
# aiseo.tips (apex) 전용 sitemap. b2b./site. 는 각각 별도 sitemap 을
# 관리하므로 (광고계정·서치콘솔 분리) 여기서는 apex 한 곳에만 업로드.
aws s3 cp frontend/public/aiseo-main-sitemap.xml s3://$BUCKET/sitemap.xml --content-type "application/xml; charset=utf-8" --profile $PROFILE
# apex 의 단일 파일 stub /account.html — 로그인 후 진입할 회원 페이지 (P-7 까지 placeholder).
# noindex 라 sitemap 에는 안 들어감. (docs/membership-260602.md)
aws s3 cp frontend/public/account.html s3://$BUCKET/account.html --content-type "text/html; charset=utf-8" --profile $PROFILE

# /login.html — Cognito 값을 .env 에서 읽어 %%PLACEHOLDER%% 치환 후 업로드.
# .env 가 없으면 환경변수 직접 사용. (VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_CLIENT_ID)
_POOL_ID="${VITE_COGNITO_USER_POOL_ID:-$(grep '^VITE_COGNITO_USER_POOL_ID=' frontend/.env 2>/dev/null | cut -d= -f2-)}"
_CLIENT_ID="${VITE_COGNITO_CLIENT_ID:-$(grep '^VITE_COGNITO_CLIENT_ID=' frontend/.env 2>/dev/null | cut -d= -f2-)}"
_REGION="$(echo "$_POOL_ID" | cut -d_ -f1)"
sed -e "s|%%COGNITO_REGION%%|${_REGION}|g" \
    -e "s|%%COGNITO_CLIENT_ID%%|${_CLIENT_ID}|g" \
    frontend/public/login.html > /tmp/aiseo-login-injected.html
aws s3 cp /tmp/aiseo-login-injected.html s3://$BUCKET/login.html --content-type "text/html; charset=utf-8" --profile $PROFILE
rm /tmp/aiseo-login-injected.html

# 3. B2B 페이지 업로드
echo "[3/5] Uploading B2B page..."
aws s3 cp frontend/dist/b2b.html s3://$BUCKET/b2b.html --content-type "text/html; charset=utf-8" --profile $PROFILE
aws s3 cp frontend/dist/b2b.html s3://$BUCKET/b2b/index.html --content-type "text/html; charset=utf-8" --profile $PROFILE
# b2b.aiseo.tips 는 CF subdomain-router 가 `/landing/*` 요청을 `/b2b/landing/*`
# 로 리라이트하므로, b2b.html 안에서 참조되는 hero 이미지 등도 같은 prefix
# 아래로 함께 복사한다 (README.md 제외).
aws s3 sync frontend/public/landing/ s3://$BUCKET/b2b/landing/ \
  --exclude "*.md" \
  --profile $PROFILE

# 4. SPA 대시보드 + 프리렌더 HTML을 /site/에 업로드 (site.dev.aiseo.tips)
#    - index.html (SPA shell) + assets/ + 프리렌더 서브디렉토리
#      (course2026/, support2026/, events2026/, blog/)
#    - `--delete` 는 쓰지 않는다. 블로그 Lambda 가 런타임에 생성하는
#      `site/blog/<slug>/index.html` 이 같이 삭제되기 때문.
#    - landing 전용(b2b)·apex 전용(aiseo-main + 자산 트리)·archive 는
#      site/ 에 중복으로 들어가면 안 되므로 제외.
echo "[4/5] Uploading SPA + prerendered HTML to /site/..."
aws s3 sync frontend/dist/ s3://$BUCKET/site/ \
  --exclude "aiseo-main.html" \
  --exclude "aiseo-main-sitemap.xml" \
  --exclude "account.html" \
  --exclude "login.html" \
  --exclude "b2b.html" \
  --exclude "hero.mp4" \
  --exclude "icon/*" \
  --exclude "images/*" \
  --exclude "principle-icons/*" \
  --exclude "_archive/*" \
  --profile $PROFILE

# 5. CloudFront 캐시 무효화
echo "[5/5] Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --profile $PROFILE

echo "=== Deploy complete ==="
echo "  dev.aiseo.tips          → 회사 소개 랜딩"
echo "  b2b.dev.aiseo.tips      → B2B 서비스"
echo "  site.dev.aiseo.tips     → B2C 대시보드"
