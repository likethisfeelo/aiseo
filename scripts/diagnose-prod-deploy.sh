#!/bin/bash
# ============================================================
# AISEO prod 배포 진단 스크립트
#
# 사용자 사이트(예: real.aiseo.tips)에 흰화면 + CSS/JS 가 text/html
# 로 응답되는 증상을 두 갈래(S3 키 vs CloudFront 함수)로 나눠 한
# 번에 점검한다.
#
# 사용법:
#   bash scripts/diagnose-prod-deploy.sh <siteId>
#   예) bash scripts/diagnose-prod-deploy.sh real
# ============================================================

set -uo pipefail

SITE_ID="${1:-}"
PROFILE="${AWS_PROFILE:-aiseo}"
BUCKET="${SITES_BUCKET:-aiseo-sites-bucket}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-EZSNEM80TUP6K}"
BASE_DOMAIN="${BASE_DOMAIN:-aiseo.tips}"

if [ -z "$SITE_ID" ]; then
  echo "Usage: $0 <siteId>"
  echo "  예) $0 real"
  exit 1
fi

ORIGIN_URL="https://${SITE_ID}.${BASE_DOMAIN}"

echo "============================================"
echo "  AISEO prod 배포 진단 — siteId='$SITE_ID'"
echo "============================================"
echo "  Bucket:         $BUCKET"
echo "  Distribution:   $DISTRIBUTION_ID"
echo "  Origin URL:     $ORIGIN_URL"
echo ""

# ── 1. S3 에 핵심 키가 존재하는지 ──
echo "[1/4] S3 키 점검 (s3://$BUCKET/$SITE_ID/)"
INDEX_KEY="$SITE_ID/index.html"
if aws s3api head-object --bucket "$BUCKET" --key "$INDEX_KEY" --profile "$PROFILE" >/dev/null 2>&1; then
  CT=$(aws s3api head-object --bucket "$BUCKET" --key "$INDEX_KEY" --profile "$PROFILE" --query 'ContentType' --output text)
  echo "  ✔ $INDEX_KEY 존재 (Content-Type: $CT)"
else
  echo "  ✘ $INDEX_KEY 없음 — 배포 자체가 prod 버킷에 닿지 않았다는 뜻."
  echo "    → deploy-site Lambda 의 SITES_BUCKET 환경변수와 env=prod 전달 여부 확인."
fi

# 첫 번째 assets 파일 한 개를 샘플링
SAMPLE_ASSET=$(aws s3api list-objects-v2 \
  --bucket "$BUCKET" \
  --prefix "$SITE_ID/assets/" \
  --max-items 1 \
  --profile "$PROFILE" \
  --query 'Contents[0].Key' --output text 2>/dev/null || echo "None")

if [ "$SAMPLE_ASSET" = "None" ] || [ -z "$SAMPLE_ASSET" ]; then
  echo "  ✘ $SITE_ID/assets/ 아래 파일이 없음 — zip 내부 구조가 잘못 풀렸을 가능성."
  echo "    → CloudWatch Logs 에서 deploy-complete 로그의 strippedPrefix / hasAssetsDir 확인."
else
  ASSET_CT=$(aws s3api head-object --bucket "$BUCKET" --key "$SAMPLE_ASSET" --profile "$PROFILE" --query 'ContentType' --output text)
  echo "  ✔ 샘플 자산: $SAMPLE_ASSET (Content-Type: $ASSET_CT)"
  case "$SAMPLE_ASSET" in
    *.css)
      [ "$ASSET_CT" = "text/css; charset=utf-8" ] || echo "    ⚠ CSS 인데 Content-Type 이 다름 — handler 의 detectContentType 확인."
      ;;
    *.js|*.mjs)
      [ "$ASSET_CT" = "application/javascript; charset=utf-8" ] || echo "    ⚠ JS 인데 Content-Type 이 다름."
      ;;
  esac
fi

# ── 2. CloudFront Function 이 viewer-request 에 attach 됐는지 ──
echo ""
echo "[2/4] CloudFront Function 연결 점검"
FUNCS=$(aws cloudfront get-distribution-config \
  --id "$DISTRIBUTION_ID" \
  --profile "$PROFILE" \
  --query 'DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Items[?EventType==`viewer-request`].FunctionARN' \
  --output text 2>/dev/null || echo "")

if [ -z "$FUNCS" ]; then
  echo "  ✘ viewer-request 에 함수 미연결 — 이게 거의 확실한 원인."
  echo "    → infra/cloudfront/README.md '함수가 attach 됐는지 확인' 절차 따라 attach."
else
  echo "  ✔ viewer-request 함수: $FUNCS"
  case "$FUNCS" in
    *subdomain-router*) echo "    이름 매칭됨." ;;
    *) echo "    ⚠ 이름이 예상과 다름 — 잘못된 함수가 붙어 있을 수 있음." ;;
  esac
fi

# ── 3. 라이브 응답 헤더 ──
echo ""
echo "[3/4] 라이브 응답 헤더 (CloudFront 통과 결과)"

probe() {
  local path="$1"
  local expected_ct="$2"
  local url="${ORIGIN_URL}${path}"
  local headers status ct
  headers=$(curl -sI -L --max-redirs 0 "$url" 2>/dev/null || true)
  status=$(printf '%s\n' "$headers" | head -n1 | awk '{print $2}')
  ct=$(printf '%s\n' "$headers" | awk -F': ' 'tolower($1)=="content-type"{print $2}' | tr -d '\r' | tail -n1)
  printf "  %s\n" "$url"
  printf "    HTTP %s  Content-Type: %s\n" "${status:-?}" "${ct:-?}"
  if [ -n "$expected_ct" ] && [ "$ct" != "$expected_ct" ]; then
    echo "    ⚠ 기대 Content-Type='$expected_ct' 와 다름."
  fi
}

probe "/" "text/html; charset=utf-8"

if [ "$SAMPLE_ASSET" != "None" ] && [ -n "$SAMPLE_ASSET" ]; then
  ASSET_PATH="/${SAMPLE_ASSET#${SITE_ID}/}"
  case "$ASSET_PATH" in
    *.css) probe "$ASSET_PATH" "text/css; charset=utf-8" ;;
    *.js|*.mjs) probe "$ASSET_PATH" "application/javascript; charset=utf-8" ;;
    *) probe "$ASSET_PATH" "" ;;
  esac
fi

# ── 4. 종합 ──
echo ""
echo "[4/4] 요약"
echo "  - S3 키가 모두 존재하고 Content-Type 이 정확하다면, 남는 원인은"
echo "    CloudFront viewer-request 함수가 URI 를 /<siteId>/... 로"
echo "    리라이트하지 못하는 것뿐. 위 [2] 결과가 빈 값이면 거기서 멈춤."
echo "  - 함수가 붙어 있는데도 [3] 의 자산 응답이 text/html 이면,"
echo "    함수의 라이브 버전이 *.aiseo.tips 라우팅 추가 이전 버전일 가능성."
echo "    infra/cloudfront/subdomain-router.js 내용을 콘솔에 다시"
echo "    Build → Save → Publish 한 뒤 invalidation 한 번 돌려야 함."
echo ""
