import type { CSSProperties } from 'react';
import { buildForgotPasswordUrl, buildLoginUrl, buildSignupUrl } from './auth.js';

const containerStyle: CSSProperties = {
  maxWidth: 520,
  margin: '60px auto',
  fontFamily: 'system-ui, sans-serif',
  padding: '0 20px',
};

const cardStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 20,
  background: '#fff',
};

const primaryButton: CSSProperties = {
  display: 'inline-block',
  background: '#2563eb',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 16px',
  borderRadius: 8,
  marginRight: 8,
};

const secondaryButton: CSSProperties = {
  display: 'inline-block',
  background: '#111827',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 16px',
  borderRadius: 8,
};

function MissingConfig() {
  return (
    <p style={{ color: '#dc2626', marginTop: 12 }}>
      Cognito Hosted UI 설정(VITE_COGNITO_HOSTED_UI_DOMAIN / VITE_COGNITO_CLIENT_ID)이 비어있습니다.
    </p>
  );
}

export function LoginPage() {
  const loginUrl = buildLoginUrl();

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>로그인</h1>
      <div style={cardStyle}>
        <p style={{ marginTop: 0, color: '#4b5563' }}>AISEO 서비스 이용을 위해 로그인하세요.</p>
        {loginUrl ? (
          <a href={loginUrl} style={primaryButton}>Cognito 로그인</a>
        ) : (
          <MissingConfig />
        )}
        <a href="/signup" style={secondaryButton}>회원가입으로 이동</a>
        <div style={{ marginTop: 12 }}>
          <a href="/forgot-password" style={{ color: '#2563eb' }}>비밀번호를 잊으셨나요?</a>
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const signupUrl = buildSignupUrl();

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>회원가입</h1>
      <div style={cardStyle}>
        <p style={{ marginTop: 0, color: '#4b5563' }}>AISEO 계정을 생성한 뒤 로그인으로 돌아옵니다.</p>
        {signupUrl ? (
          <a href={signupUrl} style={primaryButton}>Cognito 회원가입</a>
        ) : (
          <MissingConfig />
        )}
        <a href="/login" style={secondaryButton}>로그인으로 이동</a>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const forgotPasswordUrl = buildForgotPasswordUrl();

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>비밀번호 찾기</h1>
      <div style={cardStyle}>
        <p style={{ marginTop: 0, color: '#4b5563' }}>
          비밀번호 재설정은 Cognito 페이지에서 진행됩니다.
        </p>
        {forgotPasswordUrl ? (
          <a href={forgotPasswordUrl} style={primaryButton}>Cognito 비밀번호 재설정</a>
        ) : (
          <MissingConfig />
        )}
        <a href="/login" style={secondaryButton}>로그인으로 이동</a>
      </div>
    </div>
  );
}
