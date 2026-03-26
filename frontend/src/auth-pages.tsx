import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import {
  confirmPasswordReset,
  confirmSignUpCode,
  requestPasswordResetCode,
  signInWithEmail,
  signUpWithEmail,
} from './auth.js';

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

const inputStyle: CSSProperties = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  marginBottom: 10,
  boxSizing: 'border-box',
};

const primaryButton: CSSProperties = {
  display: 'inline-block',
  background: '#2563eb',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 16px',
  borderRadius: 8,
  marginRight: 8,
  border: 'none',
  cursor: 'pointer',
};

const secondaryLink: CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
};

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail({ email, password });
      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>로그인</h1>
      <form style={cardStyle} onSubmit={onSubmit}>
        <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
        <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" style={primaryButton} disabled={loading}>{loading ? '로그인 중...' : '로그인'}</button>
        <a href="/?auth=signup" style={secondaryLink}>회원가입</a>
        <div style={{ marginTop: 12 }}>
          <a href="/?auth=forgot-password" style={secondaryLink}>비밀번호를 잊으셨나요?</a>
        </div>
      </form>
    </div>
  );
}

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submitSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await signUpWithEmail({ email, password });
      setStep('confirm');
      setMessage('인증번호를 이메일로 보냈습니다. 코드를 입력해 주세요.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const submitConfirm = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await confirmSignUpCode({ email, code });
      setMessage('인증이 완료되었습니다. 로그인으로 이동하세요.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '인증번호 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>회원가입</h1>
      <form style={cardStyle} onSubmit={step === 'signup' ? submitSignup : submitConfirm}>
        <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} disabled={step === 'confirm'} />
        {step === 'signup' ? (
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
        ) : (
          <input placeholder="이메일 인증코드" value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} />
        )}
        {message && <p style={{ color: '#065f46' }}>{message}</p>}
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" style={primaryButton} disabled={loading}>
          {loading ? '처리 중...' : step === 'signup' ? '인증코드 받기' : '인증 완료'}
        </button>
        <a href="/?auth=login" style={secondaryLink}>로그인으로 이동</a>
      </form>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await requestPasswordResetCode({ email });
      setStep('confirm');
      setMessage('인증번호를 이메일로 보냈습니다.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '인증번호 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await confirmPasswordReset({ email, code, newPassword });
      setMessage('비밀번호가 재설정되었습니다. 로그인해 주세요.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>비밀번호 찾기</h1>
      <form style={cardStyle} onSubmit={step === 'request' ? requestCode : resetPassword}>
        <input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} disabled={step === 'confirm'} />
        {step === 'confirm' && (
          <>
            <input placeholder="인증코드" value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="새 비밀번호" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
          </>
        )}
        {message && <p style={{ color: '#065f46' }}>{message}</p>}
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        <button type="submit" style={primaryButton} disabled={loading}>
          {loading ? '처리 중...' : step === 'request' ? '인증코드 받기' : '비밀번호 재설정'}
        </button>
        <a href="/?auth=login" style={secondaryLink}>로그인으로 이동</a>
      </form>
    </div>
  );
}
