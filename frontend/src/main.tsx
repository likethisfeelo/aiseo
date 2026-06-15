import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/design-tokens.css';
import './styles/blog-content.css';

// 공개 클라이언트 검토 페이지(/client/*)는 로그인이 필요 없는 정적 페이지다.
// CloudFront 라우터에 clean-URL 엔트리가 publish 되지 않은 경우 site SPA 폴백으로
// 빠져 인증 가드가 비로그인 사용자를 메인으로 보낸다. React/인증이 실행되기 전에
// 확장자 있는 정적 경로(.../index.html)로 치환하면, 라우터가 publish 없이도
// 정적 파일로 통과시킨다. (.html 등 확장자가 이미 있으면 건너뜀 → 무한루프 없음)
const _crPath = window.location.pathname;
if (/^\/client\//.test(_crPath) && !/\.[a-z0-9]+$/i.test(_crPath)) {
  window.location.replace(
    _crPath.replace(/\/+$/, '') + '/index.html' + window.location.search + window.location.hash,
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
}

