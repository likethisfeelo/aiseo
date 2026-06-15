'use strict';

// PRISM 클라이언트 검토 스티커 API (단일 핸들러, 단일 {proxy+} 라우트).
// 클라이언트 작업은 프로젝트 비밀번호 토큰(HMAC)으로, 어드민 작업은 Cognito JWT 로 인증한다.
// 실제 라우팅/로직은 Phase 3·4 에서 구현. 현재는 스캐폴드.

const { ok, badRequest } = require('../shared/response');

exports.handler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method || 'GET';
  const path = event.path || event.requestContext?.http?.path || '';
  // TODO(Phase 3·4): method+path 분기 → auth / stickers / admin
  return ok({ ok: true, scaffold: true, method, path }, event);
};
