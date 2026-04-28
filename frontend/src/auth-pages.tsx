import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  confirmPasswordReset,
  confirmSignUpCode,
  requestPasswordResetCode,
  resendConfirmationCode,
  signInWithEmail,
  signUpWithEmail,
} from './auth.js';
import './auth-pages.css';

type AuthStepKey =
  | 'login'
  | 'signup-email'
  | 'signup-password'
  | 'signup-verify'
  | 'forgot-request'
  | 'forgot-confirm';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function AuthLayout({ stepKey, children }: { stepKey: AuthStepKey; children: ReactNode }) {
  return (
    <div className="auth-page">
      <div className="auth-form-pane">
        <a href="/" className="auth-logo" aria-label="AISEO 홈으로">
          <span className="auth-logo-dot" />
          <span className="auth-logo-dot" />
          <span className="auth-logo-dot" />
          <span className="auth-logo-dot" />
          <span className="auth-logo-dot" />
          <span className="auth-logo-dot" />
        </a>
        <div className="auth-form-center">{children}</div>
        <div className="auth-brand-foot">AISEO</div>
      </div>
      <aside className={`auth-visual-pane auth-visual--${stepKey}`} aria-hidden="true">
        <div className="auth-visual-caption">
          <strong>온라인 마케팅을 직접.</strong>
          <span>AI로 만든 홈페이지로 검색 1위까지.</span>
        </div>
      </aside>
    </div>
  );
}

function AuthHeading({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <>
      <h1 className="auth-h1">{title}</h1>
      {sub && <p className="auth-sub">{sub}</p>}
    </>
  );
}

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  ariaLabel?: string;
}
function PasswordInput({
  value,
  onChange,
  placeholder = '비밀번호',
  autoComplete = 'current-password',
  disabled,
  ariaLabel,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-pw-wrap">
      <input
        type={visible ? 'text' : 'password'}
        className="auth-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
      />
      <button
        type="button"
        className="auth-pw-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
        tabIndex={-1}
      >
        {visible ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// LoginPage
// ────────────────────────────────────────────────────────────────────

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmail({ email: email.trim(), password });
      if (onLoginSuccess) onLoginSuccess();
      else window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = EMAIL_RE.test(email.trim()) && password.length > 0 && !loading;

  return (
    <AuthLayout stepKey="login">
      <AuthHeading
        title="다시 만나서 반가워요"
        sub="이메일과 비밀번호를 입력해 주세요"
      />
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <input
          type="email"
          className="auth-input"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
        />
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button type="submit" className="auth-btn" disabled={!canSubmit}>
          {loading ? '로그인 중…' : '로그인'}
        </button>
        <div className="auth-aux-row">
          <a href="/?auth=forgot-password">비밀번호 찾기</a>
          <a href="/?auth=signup">회원가입 →</a>
        </div>
      </form>
      <div className="auth-foot-link">
        AISEO가 처음이신가요?<a href="/?auth=signup">회원가입</a>
      </div>
    </AuthLayout>
  );
}

// ────────────────────────────────────────────────────────────────────
// SignupPage — 3 steps: email → password → verify
// ────────────────────────────────────────────────────────────────────

type SignupStep = 'email' | 'password' | 'verify';

export function SignupPage() {
  const [step, setStep] = useState<SignupStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  // Step 1: email — local validation, no API call yet.
  const onSubmitEmail = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError('유효한 이메일 주소를 입력해 주세요.');
      return;
    }
    setEmail(trimmed);
    setStep('password');
  };

  // Step 2: password — calls Cognito SignUp with email + password.
  const onSubmitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail({ email, password });
      setStep('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: confirm code — auto-login after success for a smoother flow.
  const onSubmitVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4,8}$/.test(code.trim())) {
      setError('이메일로 받은 인증번호를 정확히 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      await confirmSignUpCode({ email, code: code.trim() });
      try {
        await signInWithEmail({ email, password });
        window.location.href = '/';
      } catch {
        // confirm 성공했지만 자동 로그인 실패 → 로그인 페이지로 안내
        window.location.href = '/?auth=login';
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '인증번호 확인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendStatus === 'sending') return;
    setResendStatus('sending');
    setError('');
    try {
      await resendConfirmationCode({ email });
      setResendStatus('sent');
    } catch (err: unknown) {
      setResendStatus('idle');
      setError(err instanceof Error ? err.message : '인증번호 재발송에 실패했습니다.');
    }
  };

  const canSubmitEmail = EMAIL_RE.test(email.trim());
  const canSubmitPassword = password.length >= 8 && !loading;
  const canSubmitVerify = code.trim().length >= 4 && !loading;

  if (step === 'email') {
    return (
      <AuthLayout stepKey="signup-email">
        <AuthHeading
          title="이메일로 시작하기"
          sub="AISEO를 시작할 이메일 주소를 입력해 주세요"
        />
        <form className="auth-form" onSubmit={onSubmitEmail} noValidate>
          <input
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button type="submit" className="auth-btn" disabled={!canSubmitEmail}>다음</button>
        </form>
        <div className="auth-foot-link">
          이미 계정이 있으신가요?<a href="/?auth=login">로그인</a>
        </div>
      </AuthLayout>
    );
  }

  if (step === 'password') {
    return (
      <AuthLayout stepKey="signup-password">
        <AuthHeading
          title="비밀번호 설정"
          sub={<>8자 이상, 영문 + 숫자 + 특수문자 포함을 권장합니다</>}
        />
        <form className="auth-form" onSubmit={onSubmitPassword} noValidate>
          <input
            type="email"
            className="auth-input"
            value={email}
            disabled
            aria-label="이메일"
          />
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="비밀번호"
            autoComplete="new-password"
          />
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button type="submit" className="auth-btn" disabled={!canSubmitPassword}>
            {loading ? '처리 중…' : '다음'}
          </button>
        </form>
        <div className="auth-foot-link">
          이미 계정이 있으신가요?<a href="/?auth=login">로그인</a>
        </div>
      </AuthLayout>
    );
  }

  // step === 'verify'
  return (
    <AuthLayout stepKey="signup-verify">
      <AuthHeading
        title="이메일 인증"
        sub={<><strong>{email}</strong>로 보낸 인증번호를 입력해 주세요</>}
      />
      <form className="auth-form" onSubmit={onSubmitVerify} noValidate>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="auth-input"
          placeholder="인증번호"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
          maxLength={8}
          autoFocus
        />
        {error && <div className="auth-error" role="alert">{error}</div>}
        {resendStatus === 'sent' && (
          <div className="auth-success" role="status">새 인증번호를 이메일로 보냈습니다.</div>
        )}
        <button type="submit" className="auth-btn" disabled={!canSubmitVerify}>
          {loading ? '확인 중…' : '인증 완료'}
        </button>
        <div className="auth-resend">
          이메일을 받지 못하셨나요?{' '}
          <button type="button" onClick={onResend} disabled={resendStatus === 'sending'}>
            {resendStatus === 'sending' ? '전송 중…' : '인증번호 재발송'}
          </button>
        </div>
      </form>
      <div className="auth-foot-link">
        이미 계정이 있으신가요?<a href="/?auth=login">로그인</a>
      </div>
    </AuthLayout>
  );
}

// ────────────────────────────────────────────────────────────────────
// ForgotPasswordPage — 2 steps: request → confirm
// ────────────────────────────────────────────────────────────────────

type ForgotStep = 'request' | 'confirm';

export function ForgotPasswordPage() {
  const [step, setStep] = useState<ForgotStep>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const onRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError('유효한 이메일 주소를 입력해 주세요.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordResetCode({ email: trimmed });
      setEmail(trimmed);
      setStep('confirm');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '인증번호 요청에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!code.trim()) {
      setError('인증번호를 입력해 주세요.');
      return;
    }
    if (newPassword.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset({ email, code: code.trim(), newPassword });
      try {
        await signInWithEmail({ email, password: newPassword });
        window.location.href = '/';
      } catch {
        setSuccess('비밀번호가 재설정되었습니다. 다시 로그인해 주세요.');
        setTimeout(() => { window.location.href = '/?auth=login'; }, 1200);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'request') {
    return (
      <AuthLayout stepKey="forgot-request">
        <AuthHeading
          title="비밀번호 찾기"
          sub="가입한 이메일로 인증번호를 보내드립니다"
        />
        <form className="auth-form" onSubmit={onRequest} noValidate>
          <input
            type="email"
            className="auth-input"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button type="submit" className="auth-btn" disabled={loading || !EMAIL_RE.test(email.trim())}>
            {loading ? '전송 중…' : '인증번호 받기'}
          </button>
        </form>
        <div className="auth-foot-link">
          비밀번호가 기억나셨나요?<a href="/?auth=login">로그인</a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout stepKey="forgot-confirm">
      <AuthHeading
        title="새 비밀번호 설정"
        sub={<><strong>{email}</strong>로 보낸 인증번호와 새 비밀번호를 입력해 주세요</>}
      />
      <form className="auth-form" onSubmit={onReset} noValidate>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          className="auth-input"
          placeholder="인증번호"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, ''))}
          maxLength={8}
          autoFocus
        />
        <PasswordInput
          value={newPassword}
          onChange={setNewPassword}
          placeholder="새 비밀번호 (8자 이상)"
          autoComplete="new-password"
        />
        {error && <div className="auth-error" role="alert">{error}</div>}
        {success && <div className="auth-success" role="status">{success}</div>}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? '처리 중…' : '비밀번호 재설정'}
        </button>
      </form>
      <div className="auth-foot-link">
        로그인으로 돌아가기<a href="/?auth=login">→</a>
      </div>
    </AuthLayout>
  );
}
