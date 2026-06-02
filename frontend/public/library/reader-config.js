// AI SEO Library reader 의 Cognito + API base 설정.
// %% placeholder 는 deploy 스크립트(scripts/deploy-{dev,prod}.{sh,ps1}) 가
// 환경별 값으로 치환한 뒤 S3 로 업로드한다.
//
// reader-config 를 reader.html 본체와 분리한 이유:
//   reader.html 은 한국어가 다수 포함되어 sed 가 일부 환경(Windows
//   PowerShell 의 default 코드페이지 등) 에서 UTF-8 을 손상시킴.
//   ASCII-only 인 이 파일만 sed 로 치환하고, HTML 은 바이트 그대로 업로드.
//   (login-config.js 패턴과 동일)
window.AISEO_READER_CONFIG = {
  region:   '%%COGNITO_REGION%%',
  clientId: '%%COGNITO_CLIENT_ID%%',
  apiBase:  '%%API_BASE_URL%%',
};
