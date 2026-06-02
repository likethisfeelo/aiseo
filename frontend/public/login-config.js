// AISEO apex /login.html 의 Cognito 설정.
// %% placeholder 는 deploy 스크립트(scripts/deploy-{dev,prod}.{sh,ps1}) 가
// .env (또는 환경변수) 의 VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID
// 값으로 치환한 뒤 S3 로 업로드한다.
//
// 이 파일을 별도로 둔 이유:
//   login.html 본체에 sed 를 걸면 한국어가 들어간 HTML 인코딩이 일부
//   환경(Windows PowerShell 의 default 코드페이지 등) 에서 손상되어
//   mojibake + JS parse error 가 발생함. config 만 분리하면 HTML 은
//   바이트 단위로 그대로 복사되어 UTF-8 이 보존된다.
window.AISEO_LOGIN_CONFIG = {
  region: '%%COGNITO_REGION%%',
  clientId: '%%COGNITO_CLIENT_ID%%',
};
