# ============================================================
#  use-aiseo.ps1 — aiseo 프로젝트 AWS 계정 확인 & 전환
#  실행: .\use-aiseo.ps1
# ============================================================

$EXPECTED_ACCOUNT = "119778517834"
$PROFILE          = "aiseo"
$REGION           = "ap-northeast-2"

Write-Host ""

# 현재 계정 확인
$current = aws sts get-caller-identity --profile $PROFILE 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  aiseo 프로파일 없음 → 자격증명 설정 시작" -ForegroundColor Yellow
    Write-Host ""
    aws configure --profile $PROFILE
    $current = aws sts get-caller-identity --profile $PROFILE 2>&1
}

$json = $current | ConvertFrom-Json

if ($json.Account -eq $EXPECTED_ACCOUNT) {
    Write-Host "  ✅ 계정 확인됨: $($json.Account)" -ForegroundColor Green
    Write-Host "  ✅ ARN : $($json.Arn)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  aiseo 계정으로 작업 준비 완료" -ForegroundColor Cyan

    # 환경변수로도 세팅 (CDK, AWS CLI 등에서 자동 인식)
    $env:AWS_PROFILE = $PROFILE
    $env:AWS_DEFAULT_REGION = $REGION

    Write-Host "  AWS_PROFILE=$env:AWS_PROFILE" -ForegroundColor DarkGray
    Write-Host "  AWS_DEFAULT_REGION=$env:AWS_DEFAULT_REGION" -ForegroundColor DarkGray
} else {
    Write-Host "  ❌ 계정 불일치!" -ForegroundColor Red
    Write-Host "     현재: $($json.Account)" -ForegroundColor Red
    Write-Host "     기대: $EXPECTED_ACCOUNT" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  aiseo 액세스 키를 다시 입력하세요:" -ForegroundColor Yellow
    aws configure --profile $PROFILE
}

Write-Host ""
