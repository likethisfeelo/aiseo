import { useMemo, useState, type ReactNode } from 'react';
import './ScheduleRequestWidget.css';
import { submitEventSignup } from '../api';
import type { EventCode, PreferredSlot } from '../api';

// ============================================================
// ScheduleRequestWidget — 희망 교육/상담 시간 등록 위젯
// ------------------------------------------------------------
// 회원가입 없이 이름 + 연락처 + 회차별 희망 일시(날짜 + 1시간 단위
// 시간대) + 개인정보 동의만 받아서 제출한다. 기본 제출 경로는 기존
// `/event-signup` Lambda (Slack 알림 포함)이고, `onSubmit` 을 넘기면
// 완전히 다른 API 로도 보낼 수 있다. 이벤트 페이지뿐 아니라 상담
// 예약, B2B 문의 등 "언제 시간 되세요?" 를 묻는 곳이면 어디든 심을
// 수 있도록 sessions / 시간 범위 / 카피를 전부 props 로 열어 뒀다.
//
// 사용 예:
//   <ScheduleRequestWidget
//     eventCode="EVENT_05_PET_PHOTO"
//     source="pet-photo-apply"
//     sessions={['1회차', '2회차', '3회차']}
//     startHour={8} endHour={23}
//   />
//
// 렌더 시 window 에 접근하지 않으므로 prerender(SSR) 에서도 그대로
// 문자열로 렌더된다.
// ============================================================

export interface ScheduleRequestSubmission {
  name: string;
  phone: string;
  note: string;
  preferredSlots: PreferredSlot[];
  privacyConsent: true;
  kakaoConsent: true;
  source: string;
}

export interface ScheduleRequestWidgetProps {
  /** 기본 제출 경로(/event-signup)에 함께 보낼 이벤트 코드. `onSubmit` 을 쓰면 무시. */
  eventCode?: EventCode;
  /** 어느 페이지/버튼에서 들어온 신청인지 추적용 (Slack 에 '출처' 로 표시). */
  source: string;
  /** 회차 라벨. 개수만큼 날짜/시간 입력 줄이 생긴다. 기본 1·2·3회차. */
  sessions?: string[];
  /** 신청 가능한 첫 시작 시각 (기본 8 → 08:00). */
  startHour?: number;
  /** 신청 가능한 마지막 종료 시각 (기본 23 → 마지막 슬롯 22:00~23:00). */
  endHour?: number;
  /** 선택 가능한 가장 이른 날짜 (YYYY-MM-DD). 기본은 KST 기준 내일. */
  minDate?: string;
  title?: ReactNode;
  description?: ReactNode;
  /** 메모 입력란 라벨. 빈 문자열이면 메모란을 숨긴다. */
  noteLabel?: string;
  notePlaceholder?: string;
  submitLabel?: string;
  /** 다크 배경 섹션 위에 올릴 때 true. */
  dark?: boolean;
  /** 개인정보 수집·이용 안내에 표시할 이용 목적. */
  privacyPurpose?: string;
  /** 완료 화면 안내 문구 (기본: 카카오톡 연락 안내). */
  doneMessage?: ReactNode;
  /** 기본 event-signup 대신 직접 처리하고 싶을 때. */
  onSubmit?: (payload: ScheduleRequestSubmission) => Promise<void>;
  /** 제출 성공 후 훅 (예: analytics). */
  onSubmitted?: (payload: ScheduleRequestSubmission) => void;
  id?: string;
  className?: string;
}

const DEFAULT_SESSIONS = ['1회차', '2회차', '3회차'];
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** KST 기준 오늘 + offsetDays 를 YYYY-MM-DD 로. */
const kstDate = (offsetDays: number) => {
  const kst = new Date(Date.now() + 9 * 3600_000 + offsetDays * 86_400_000);
  return kst.toISOString().slice(0, 10);
};

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length > 7) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length > 3) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return digits;
};

const formatDateKo = (date: string) => {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return `${date} (${WEEKDAY_KO[d.getUTCDay()]})`;
};

const formatHourRange = (hour: number) => `${pad2(hour)}:00 ~ ${pad2(hour + 1)}:00`;

interface SlotDraft {
  date: string;
  hour: string; // '' 또는 '8'..'22' (select value)
}

export function ScheduleRequestWidget({
  eventCode = 'EVENT_05_PET_PHOTO',
  source,
  sessions = DEFAULT_SESSIONS,
  startHour = 8,
  endHour = 23,
  minDate,
  title = '희망 교육 시간 등록',
  description = '회원가입 없이 바로 등록됩니다. 회차별로 원하는 날짜와 시간을 골라주세요.',
  noteLabel = '남기실 말씀 (선택)',
  notePlaceholder = '예: 평일은 오후 촬영이 많아 저녁이 편해요 / 궁금한 점',
  submitLabel = '희망 시간 등록하기',
  dark = false,
  privacyPurpose = '교육 일정 협의 및 안내 연락',
  doneMessage,
  onSubmit,
  onSubmitted,
  id,
  className,
}: ScheduleRequestWidgetProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [slots, setSlots] = useState<SlotDraft[]>(() => sessions.map(() => ({ date: '', hour: '' })));
  const [consent, setConsent] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<ScheduleRequestSubmission | null>(null);

  // 최소 날짜는 마운트 시점 기준 한 번만 계산 (렌더마다 바뀌면 SSR 문자열과 어긋남).
  const [effectiveMinDate] = useState(() => minDate || kstDate(1));

  const hourOptions = useMemo(() => {
    const out: number[] = [];
    for (let h = startHour; h < endHour; h += 1) out.push(h);
    return out;
  }, [startHour, endHour]);

  const updateSlot = (i: number, patch: Partial<SlotDraft>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const phoneDigits = phone.replace(/\D/g, '');
  const slotsFilled = slots.every((s) => s.date && s.hour !== '');
  const canSubmit =
    name.trim().length > 0 && phoneDigits.length >= 10 && slotsFilled && consent && !submitting;

  const validate = (): string => {
    if (!name.trim()) return '이름을 입력해주세요.';
    if (phoneDigits.length < 10) return '연락 가능한 휴대폰 번호를 입력해주세요.';
    for (let i = 0; i < slots.length; i += 1) {
      const s = slots[i];
      if (!s.date || s.hour === '') return `${sessions[i]} 희망 날짜와 시간을 선택해주세요.`;
      if (s.date < effectiveMinDate) return `${sessions[i]} 날짜는 ${formatDateKo(effectiveMinDate)} 이후로 선택해주세요.`;
    }
    const keys = slots.map((s) => `${s.date}#${s.hour}`);
    if (new Set(keys).size !== keys.length) return '회차별 희망 시간이 서로 겹치지 않게 선택해주세요.';
    if (!consent) return '개인정보 수집·이용에 동의해주세요.';
    return '';
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setSubmitting(true);

    const payload: ScheduleRequestSubmission = {
      name: name.trim(),
      phone,
      note: note.trim(),
      preferredSlots: slots.map((s, i) => ({
        session: i + 1,
        label: sessions[i],
        date: s.date,
        hour: Number(s.hour),
      })),
      privacyConsent: true,
      kakaoConsent: true,
      source,
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        await submitEventSignup({
          eventCode,
          name: payload.name,
          phone: payload.phone,
          concern: payload.note || undefined,
          preferredSlots: payload.preferredSlots,
          privacyConsent: true,
          kakaoConsent: true,
          source,
        });
      }
      setDone(payload);
      onSubmitted?.(payload);
    } catch {
      setError('등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setName(''); setPhone(''); setNote('');
    setSlots(sessions.map(() => ({ date: '', hour: '' })));
    setConsent(false); setShowDetail(false); setError(''); setDone(null);
  };

  const rootClass = ['srw', dark ? 'srw-dark' : '', className || ''].filter(Boolean).join(' ');

  if (done) {
    return (
      <div className={rootClass} id={id}>
        <div className="srw-done" role="status">
          <div className="srw-done-icon" aria-hidden="true">&#10003;</div>
          <div className="srw-done-title">희망 시간이 등록되었습니다</div>
          <div className="srw-done-sub">
            {doneMessage ?? (
              <>
                {done.name}님, 감사합니다.<br />
                입력하신 번호 <strong>{done.phone}</strong> 의 카카오톡으로<br />
                일정 확정 안내를 드리겠습니다.
              </>
            )}
          </div>
          <ul className="srw-done-list">
            {done.preferredSlots.map((s) => (
              <li key={s.session}>
                <strong>{s.label}</strong>
                {formatDateKo(s.date)} {formatHourRange(s.hour)}
              </li>
            ))}
          </ul>
          <button type="button" className="srw-done-reset" onClick={reset}>
            다른 시간으로 다시 등록
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className={rootClass}
      id={id}
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      noValidate
    >
      <div className="srw-head">
        <h3 className="srw-title">{title}</h3>
        {description && <p className="srw-desc">{description}</p>}
      </div>

      <div className="srw-grid">
        <label className="srw-field">
          <span className="srw-label">이름 <span className="req">*</span></span>
          <input
            className="srw-input"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            placeholder="이름 또는 스튜디오명"
            autoComplete="name"
          />
        </label>
        <label className="srw-field">
          <span className="srw-label">휴대폰 번호 (카카오톡) <span className="req">*</span></span>
          <input
            className="srw-input"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            type="tel"
            inputMode="numeric"
            placeholder="010-0000-0000"
            autoComplete="tel"
          />
        </label>
      </div>

      <div className="srw-sessions">
        <div className="srw-sessions-head">
          <span className="srw-label">희망 교육 일시 <span className="req">*</span></span>
          <span className="srw-sessions-hint">
            {pad2(startHour)}:00 ~ {pad2(endHour)}:00 · 1시간 단위
          </span>
        </div>
        {sessions.map((label, i) => {
          const slot = slots[i];
          const filled = Boolean(slot.date && slot.hour !== '');
          return (
            <div className={`srw-session${filled ? ' filled' : ''}`} key={label}>
              <span className="srw-session-badge">{label}</span>
              <input
                className="srw-input"
                type="date"
                aria-label={`${label} 희망 날짜`}
                min={effectiveMinDate}
                value={slot.date}
                onChange={(e) => updateSlot(i, { date: e.target.value })}
              />
              <select
                className="srw-select"
                aria-label={`${label} 희망 시간`}
                value={slot.hour}
                onChange={(e) => updateSlot(i, { hour: e.target.value })}
              >
                <option value="">시간 선택</option>
                {hourOptions.map((h) => (
                  <option key={h} value={String(h)}>{formatHourRange(h)}</option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {noteLabel && (
        <label className="srw-field" style={{ marginTop: 18 }}>
          <span className="srw-label">{noteLabel}</span>
          <textarea
            className="srw-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder={notePlaceholder}
            rows={3}
          />
        </label>
      )}

      <div className="srw-consent">
        <label className="srw-check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            <span className="tag">필수</span>
            개인정보 수집·이용에 동의하며, 입력한 전화번호의 카카오톡으로 안내 연락을 받는 데 동의합니다.
          </span>
        </label>
        <button
          type="button"
          className="srw-consent-toggle"
          aria-expanded={showDetail}
          onClick={() => setShowDetail((v) => !v)}
        >
          {showDetail ? '내용 접기' : '수집 항목 · 목적 · 보유 기간 보기'}
        </button>
        {showDetail && (
          <div className="srw-consent-detail">
            <dl>
              <dt>수집 항목</dt><dd>이름, 휴대폰 번호, 희망 일정, 남기신 말씀</dd>
              <dt>이용 목적</dt><dd>{privacyPurpose}</dd>
              <dt>보유 기간</dt><dd>목적 달성 후 지체 없이 파기 (최대 1년)</dd>
              <dt>동의 거부</dt><dd>동의를 거부할 수 있으나, 거부 시 신청이 접수되지 않습니다.</dd>
            </dl>
          </div>
        )}
        <div className="srw-kakao-note">
          <span className="ico" aria-hidden="true">💬</span>
          <span>입력하신 전화번호의 <strong>카카오톡</strong>으로 일정 확인 연락을 드립니다.</span>
        </div>
      </div>

      <div className="srw-actions">
        {error && <div className="srw-error" role="alert">{error}</div>}
        <button type="submit" className="srw-submit" disabled={!canSubmit}>
          {submitting ? '등록 중...' : submitLabel}
        </button>
        <p className="srw-foot">회원가입 없이 등록됩니다 · 희망 시간은 협의 후 확정됩니다</p>
      </div>
    </form>
  );
}
