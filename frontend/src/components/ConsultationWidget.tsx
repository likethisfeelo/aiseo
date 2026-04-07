import { useState } from 'react';
import ReactDOM from 'react-dom';
import { submitConsultation } from '../api';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TOTAL_STEPS = 7;

const SERVICE_OPTIONS = [
  { id: 'free', label: '바로 배포 + SEO 강의 1시간', price: '무료' },
  { id: 'content_check', label: '바로 배포 + SEO 강의 + 콘텐츠 점검', price: '10만원' },
  { id: 'ai_consulting', label: '바로 배포 + SEO 강의 + AI 홈페이지 제작 컨설팅', price: '20만원' },
];

const BUSINESS_OPTIONS = [
  { id: 'registered', label: '사업자등록 있음' },
  { id: 'not_registered', label: '사업자등록 없음' },
  { id: 'preparing', label: '준비 중' },
];

const INDUSTRY_OPTIONS = [
  { id: 'oneday_class', label: '원데이클래스 운영' },
  { id: 'pet', label: '반려동물 관련' },
  { id: 'handmade', label: '수제작 제품' },
  { id: 'custom', label: '맞춤 제작' },
  { id: 'kids', label: '키즈 관련' },
  { id: 'none', label: '해당없음' },
];

const COURSE_SUMMARY = [
  'AI 기반 웹사이트를 직접 제작하고 즉시 배포합니다.',
  'SEO 최적화 전략을 1시간 집중 강의로 배웁니다.',
  '실습 중심으로 당일 배포까지 완료합니다.',
  '도메인 연결, 검색 등록 등 실전 운영 가이드를 포함합니다.',
];

export function ConsultationWidget({ open, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contentConfirmed, setContentConfirmed] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [businessRegistered, setBusinessRegistered] = useState('');
  const [specialIndustry, setSpecialIndustry] = useState('');
  const [kakaoConsent, setKakaoConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    setPhone(formatted);
  };

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const canNext = (): boolean => {
    switch (step) {
      case 1: return name.trim().length > 0;
      case 2: return phone.replace(/\D/g, '').length >= 10;
      case 3: return contentConfirmed;
      case 4: return selectedServices.length > 0;
      case 5: return businessRegistered !== '';
      case 6: return specialIndustry !== '';
      case 7: return kakaoConsent;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitConsultation({
        name: name.trim(),
        phone,
        contentConfirmed,
        selectedServices,
        businessRegistered,
        specialIndustry,
        kakaoConsent,
      });
      setDone(true);
    } catch (err) {
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setName('');
    setPhone('');
    setContentConfirmed(false);
    setSelectedServices([]);
    setBusinessRegistered('');
    setSpecialIndustry('');
    setKakaoConsent(false);
    setDone(false);
    onClose();
  };

  const renderStep = () => {
    if (done) {
      return (
        <div style={styles.doneWrap}>
          <div style={styles.doneIcon}>&#10003;</div>
          <div style={styles.doneTitle}>신청이 완료되었습니다!</div>
          <div style={styles.doneSub}>
            {name}님, 등록하신 번호의 카카오톡으로<br />1영업일 내 연락드리겠습니다.
          </div>
          <button style={styles.btnPrimary} onClick={handleClose}>확인</button>
        </div>
      );
    }

    switch (step) {
      case 1:
        return (
          <div>
            <div style={styles.stepTitle}>이름 또는 회사이름</div>
            <div style={styles.stepDesc}>신청자 정보를 입력해주세요.</div>
            <input
              style={styles.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="홍길동 / (주)aiseo"
              autoFocus
            />
          </div>
        );
      case 2:
        return (
          <div>
            <div style={styles.stepTitle}>연락처</div>
            <div style={styles.stepDesc}>카카오톡으로 연락 가능한 번호를 입력해주세요.</div>
            <input
              style={styles.input}
              value={phone}
              onChange={handlePhoneChange}
              type="tel"
              placeholder="010-0000-0000"
              autoFocus
            />
          </div>
        );
      case 3:
        return (
          <div>
            <div style={styles.stepTitle}>강의 내용 확인</div>
            <div style={styles.stepDesc}>아래 교육 내용을 확인해주세요.</div>
            <div style={styles.infoBox}>
              {COURSE_SUMMARY.map((item, i) => (
                <div key={i} style={styles.infoItem}>• {item}</div>
              ))}
            </div>
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={contentConfirmed}
                onChange={e => setContentConfirmed(e.target.checked)}
                style={styles.checkbox}
              />
              네, 위 내용을 확인했습니다.
            </label>
          </div>
        );
      case 4:
        return (
          <div>
            <div style={styles.stepTitle}>서비스 방식 선택</div>
            <div style={styles.stepDesc}>원하시는 서비스를 선택해주세요. (복수 선택 가능)</div>
            {SERVICE_OPTIONS.map(opt => (
              <div
                key={opt.id}
                style={{
                  ...styles.optionCard,
                  ...(selectedServices.includes(opt.id) ? styles.optionCardSelected : {}),
                }}
                onClick={() => toggleService(opt.id)}
              >
                <div style={styles.optionCheck}>
                  {selectedServices.includes(opt.id) ? '☑' : '☐'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.optionLabel}>{opt.label}</div>
                  <div style={styles.optionPrice}>{opt.price}</div>
                </div>
              </div>
            ))}
          </div>
        );
      case 5:
        return (
          <div>
            <div style={styles.stepTitle}>사업자 등록 상태</div>
            <div style={styles.stepDesc}>현재 사업자 등록 상태를 선택해주세요.</div>
            {BUSINESS_OPTIONS.map(opt => (
              <div
                key={opt.id}
                style={{
                  ...styles.radioCard,
                  ...(businessRegistered === opt.id ? styles.radioCardSelected : {}),
                }}
                onClick={() => setBusinessRegistered(opt.id)}
              >
                <div style={styles.radioCircle}>
                  {businessRegistered === opt.id ? '●' : '○'}
                </div>
                <div style={styles.optionLabel}>{opt.label}</div>
              </div>
            ))}
          </div>
        );
      case 6:
        return (
          <div>
            <div style={styles.stepTitle}>특수 이벤트 업종</div>
            <div style={styles.stepDesc}>해당되는 업종이 있으면 선택해주세요.</div>
            {INDUSTRY_OPTIONS.map(opt => (
              <div
                key={opt.id}
                style={{
                  ...styles.radioCard,
                  ...(specialIndustry === opt.id ? styles.radioCardSelected : {}),
                }}
                onClick={() => setSpecialIndustry(opt.id)}
              >
                <div style={styles.radioCircle}>
                  {specialIndustry === opt.id ? '●' : '○'}
                </div>
                <div style={styles.optionLabel}>{opt.label}</div>
              </div>
            ))}
          </div>
        );
      case 7:
        return (
          <div>
            <div style={styles.stepTitle}>카카오톡 연락 동의</div>
            <div style={styles.stepDesc}>
              입력하신 연락처({phone})의 카카오톡으로 상담 연락을 드립니다.
            </div>
            <div style={styles.infoBox}>
              <div style={styles.infoItem}>• 1영업일 내 카카오톡으로 연락드립니다.</div>
              <div style={styles.infoItem}>• 상담 목적 외 연락은 하지 않습니다.</div>
            </div>
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={kakaoConsent}
                onChange={e => setKakaoConsent(e.target.checked)}
                style={styles.checkbox}
              />
              동의합니다
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return ReactDOM.createPortal(
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div style={styles.modal}>
        <button style={styles.closeBtn} onClick={handleClose}>&times;</button>

        {!done && (
          <div style={styles.progressWrap}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                style={{
                  ...styles.progressDot,
                  ...(i + 1 === step ? styles.progressDotActive : {}),
                  ...(i + 1 < step ? styles.progressDotDone : {}),
                }}
              />
            ))}
          </div>
        )}

        {!done && (
          <div style={styles.stepIndicator}>{step} / {TOTAL_STEPS}</div>
        )}

        <div style={styles.body}>
          {renderStep()}
        </div>

        {!done && (
          <div style={styles.footer}>
            {step > 1 && (
              <button style={styles.btnSecondary} onClick={() => setStep(s => s - 1)}>
                이전
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < TOTAL_STEPS ? (
              <button
                style={{ ...styles.btnPrimary, ...(canNext() ? {} : styles.btnDisabled) }}
                disabled={!canNext()}
                onClick={() => setStep(s => s + 1)}
              >
                다음
              </button>
            ) : (
              <button
                style={{ ...styles.btnPrimary, ...(canNext() && !submitting ? {} : styles.btnDisabled) }}
                disabled={!canNext() || submitting}
                onClick={handleSubmit}
              >
                {submitting ? '신청 중...' : '신청 완료'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '28px 28px 20px', width: '100%',
    maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', position: 'relative',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif",
    color: '#1a1a18',
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 16, background: 'none', border: 'none',
    fontSize: 24, color: '#999', cursor: 'pointer', lineHeight: 1,
  },
  progressWrap: {
    display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8,
  },
  progressDot: {
    width: 28, height: 4, borderRadius: 2, background: '#e0dfd8', transition: 'background .2s',
  },
  progressDotActive: {
    background: '#1a1a18',
  },
  progressDotDone: {
    background: '#185fa5',
  },
  stepIndicator: {
    textAlign: 'center', fontSize: 12, color: '#999', marginBottom: 20,
  },
  body: {
    minHeight: 200,
  },
  stepTitle: {
    fontSize: 18, fontWeight: 600, marginBottom: 6,
  },
  stepDesc: {
    fontSize: 13, color: '#666', marginBottom: 18, lineHeight: 1.5,
  },
  input: {
    width: '100%', padding: '12px 14px', border: '1px solid #e0dfd8', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', color: '#1a1a18', transition: 'border-color .15s',
  },
  infoBox: {
    background: '#f8f7f4', borderRadius: 8, padding: '14px 16px', marginBottom: 16,
  },
  infoItem: {
    fontSize: 13, color: '#444', lineHeight: 1.8,
  },
  checkLabel: {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
    cursor: 'pointer', color: '#1a1a18', fontWeight: 500,
  },
  checkbox: {
    width: 18, height: 18, cursor: 'pointer', accentColor: '#185fa5',
  },
  optionCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
    border: '1px solid #e0dfd8', borderRadius: 10, marginBottom: 10,
    cursor: 'pointer', transition: 'border-color .15s, background .15s',
  },
  optionCardSelected: {
    borderColor: '#185fa5', background: '#f0f5fb',
  },
  optionCheck: {
    fontSize: 18, color: '#185fa5', flexShrink: 0, width: 22,
  },
  optionLabel: {
    fontSize: 14, fontWeight: 500, color: '#1a1a18',
  },
  optionPrice: {
    fontSize: 13, color: '#185fa5', fontWeight: 600, marginTop: 2,
  },
  radioCard: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    border: '1px solid #e0dfd8', borderRadius: 10, marginBottom: 8,
    cursor: 'pointer', transition: 'border-color .15s, background .15s',
  },
  radioCardSelected: {
    borderColor: '#185fa5', background: '#f0f5fb',
  },
  radioCircle: {
    fontSize: 16, color: '#185fa5', flexShrink: 0, width: 20, textAlign: 'center',
  },
  footer: {
    display: 'flex', alignItems: 'center', gap: 10, marginTop: 24, paddingTop: 16,
    borderTop: '1px solid #e0dfd8',
  },
  btnPrimary: {
    background: '#1a1a18', color: '#fff', border: 'none', borderRadius: 8,
    padding: '11px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity .15s',
  },
  btnSecondary: {
    background: '#f4f4f2', color: '#1a1a18', border: '1px solid #e0dfd8', borderRadius: 8,
    padding: '11px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'inherit', transition: 'opacity .15s',
  },
  btnDisabled: {
    opacity: 0.4, cursor: 'default',
  },
  doneWrap: {
    textAlign: 'center', padding: '20px 0',
  },
  doneIcon: {
    width: 56, height: 56, borderRadius: '50%', background: '#185fa5', color: '#fff',
    fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
  },
  doneTitle: {
    fontSize: 18, fontWeight: 600, marginBottom: 8,
  },
  doneSub: {
    fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24,
  },
};
