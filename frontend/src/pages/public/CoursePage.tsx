import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

/* ── Path data per state ── */
interface Step { label: string; value: string; special?: boolean }
interface PathData { active: string[]; steps: Step[]; duration: string; pkg: string }

const PATHS: Record<string, PathData> = {
  Z1: {
    active: ['wrap','nz1','nt1','nt2','nt3','az1t1','at1t2','at2t3','wbadge'],
    steps: [
      { label: '콘텐츠 기획 컨설팅', value: '별도 견적', special: true },
      { label: '즉시 배포 교육', value: '10만원' },
      { label: '도메인 연결', value: '10만원' },
      { label: 'SEO 전략 정리', value: '10만원' },
      { label: '로드맵 컨설팅', value: '20만원' },
    ],
    duration: '5~7주', pkg: '기본 패키지 150만원',
  },
  Z2: {
    active: ['wrap','nz2','nt1','nt2','nt3','az2t1','az2t2','at1t2','at2t3','wbadge'],
    steps: [
      { label: 'SEO 전략 정리', value: '10만원' },
      { label: '로드맵 컨설팅', value: '20만원' },
      { label: '즉시 배포 교육', value: '10만원' },
      { label: '도메인 연결', value: '10만원' },
    ],
    duration: '4~6주', pkg: '기본/표준 패키지 150~200만원',
  },
  A: {
    active: ['wrap','nt1','nt2','nt3','at1t2','at2t3','wbadge'],
    steps: [
      { label: '즉시 배포 교육', value: '10만원' },
      { label: '도메인 연결', value: '10만원' },
      { label: '로드맵 컨설팅', value: '20만원' },
    ],
    duration: '3~5주', pkg: '기본 패키지 150만원',
  },
  B: {
    active: ['wrap','nt2','nt3','at2t3','wbadge'],
    steps: [
      { label: 'SEO 전략 정리', value: '10만원' },
      { label: '로드맵 컨설팅', value: '20만원' },
    ],
    duration: '4~6주', pkg: '표준 패키지 200만원',
  },
  C: {
    active: ['wrap','nt4','wbadge'],
    steps: [
      { label: '광고 고급 세팅 교육', value: '50만원' },
      { label: '자동화 교육 (인스타·네이버)', value: '30만원' },
    ],
    duration: '5~8주', pkg: '확장 패키지 250~300만원',
  },
};

const ALL_SVG_IDS = ['wrap','nz1','nz2','nt1','nt2','nt3','nt4','az1t1','az2t1','az2t2','at1t2','at2t3','at3t4','wbadge'];

const STATES = [
  { key: 'Z1', badge: 'Z1', badgeClass: 'crs-badge-z1', title: '홈페이지·카탈로그 내용 구성부터 해야해요', sub: '콘텐츠 없음 · 기획 전 단계', group: 0 },
  { key: 'Z2', badge: 'Z2', badgeClass: 'crs-badge-z2', title: '기존 내용은 있는데 SEO 중심 기획 점검이 필요해요', sub: '콘텐츠 있음 · SEO 관점 재구조화 필요', group: 0 },
  { key: 'A', badge: 'A', badgeClass: 'crs-badge-a', title: '홈페이지가 아직 없어요', sub: '콘텐츠 준비됨 · 사이트만 없는 상태', group: 1 },
  { key: 'B', badge: 'B', badgeClass: 'crs-badge-b', title: '홈페이지는 있는데 검색이 안 돼요', sub: '사이트 있음 · SEO·측정 미설정', group: 1 },
  { key: 'C', badge: 'C', badgeClass: 'crs-badge-c', title: '사이트+SEO 있고 광고를 시작하고 싶어요', sub: '기초 완성 · 광고·자동화 확장 단계', group: 1 },
];

const SERVICES = [
  { cat: '홈페이지 배포 · 도메인', items: [
    { key: 's1', label: 'AI 홈페이지 즉시 배포 교육', desc: 'ZIP 업로드, 서브도메인 배포, 기본 SEO/측정코드 설정 실습', price: 100000, display: '10만원' },
    { key: 's2', label: '독립도메인 직접 연결 교육', desc: 'Route 53 기반 도메인 직접 연결 실습 지원 (40분)', price: 100000, display: '10만원' },
    { key: 's3', label: '독립도메인 연결 지원', desc: '1회 연결 지원, 유지보수 의무 없음', price: 100000, display: '10만원' },
    { key: 's4', label: '후속 기술 지원', desc: '문제 발생 시 추가 지원/상담 (40분)', price: 100000, display: '10만원' },
    { key: 's5', label: '월간 점검 관리', desc: '월 1회 백업 + 월 1회 점검/보고', price: 100000, display: '월 10만원', monthly: true },
  ]},
  { cat: '전략 · 컨설팅', items: [
    { key: 's6', label: '1:1 성장 로드맵 컨설팅', desc: '검색 현황, 경쟁 분석, SEO 방향, 타겟, 예산별 마케팅 전략 / 30분 × 3회', price: 200000, display: '20만원' },
    { key: 's7', label: 'SEO · 온라인 마케팅 전략 정리', desc: '로드맵이 있는 고객 대상, SEO 및 예산별 마케팅 전략 1회 정리', price: 100000, display: '10만원' },
  ]},
  { cat: '광고 · 자동화', items: [
    { key: 's8', label: '구글 · 메타 광고 고급 세팅 교육', desc: '전환, 픽셀, 캠페인 구조, 타겟/예산 설정 등 실전 교육', price: 500000, display: '50만원' },
    { key: 's9', label: '광고 소재 제작 포함 실행 준비 패키지', desc: '총 5회 진행, 광고 소재 5종 제작 포함', price: 1000000, display: '100만원' },
    { key: 's10', label: '인스타 · 네이버 게시 자동화 교육', desc: '기존 콘텐츠가 정리된 고객 대상 자동화 실습', price: 300000, display: '30만원' },
  ]},
];

export function CoursePage() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedSvcs, setSelectedSvcs] = useState<Map<string, { label: string; price: number; monthly?: boolean }>>(new Map());
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formKakao, setFormKakao] = useState('');
  const [formMessage, setFormMessage] = useState('');

  // inject scoped styles
  useEffect(() => {
    const id = 'course-page-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = COURSE_CSS;
    document.head.appendChild(style);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const pathData = selectedState ? PATHS[selectedState] : null;

  const toggleSvc = (key: string, label: string, price: number, monthly?: boolean) => {
    setSelectedSvcs(prev => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, { label, price, monthly });
      return next;
    });
  };

  const svcTotal = [...selectedSvcs.values()].reduce((s, v) => s + v.price, 0);
  const hasMonthly = [...selectedSvcs.values()].some(v => v.monthly);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    } else if (digits.length > 3) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    setFormPhone(formatted);
  };

  const submitForm = () => {
    if (!formName.trim() || !formPhone.trim()) { alert('이름과 연락처를 입력해주세요.'); return; }
    setModalOpen(false);
    setSelectedSvcs(new Map());
    setFormName(''); setFormPhone(''); setFormKakao(''); setFormMessage('');
    alert(`${formName}님, 상담 신청이 완료되었습니다.\n1영업일 내 연락드리겠습니다.`);
  };

  return (
    <div className="crs-page">

      {/* ═══ SECTION 1: 상태 진단 ═══ */}
      <section className="crs-diagnosis">
        <div className="crs-section-hd">
          <h2>내 상태에 맞는 수강 경로</h2>
          <p>현재 상태를 선택하면 추천 경로와 예상 비용을 바로 확인할 수 있습니다</p>
        </div>
        <div className="crs-diag-layout">
          {/* Left: State Cards */}
          <div className="crs-left">
            <div className="crs-group-div">
              <div className="crs-group-line" /><div className="crs-group-text" style={{color:'#854f0b'}}>콘텐츠 준비부터 필요해요</div><div className="crs-group-line" />
            </div>
            {STATES.filter(s => s.group === 0).map(s => (
              <button key={s.key} className={`crs-state-card${selectedState === s.key ? ' selected' : ''}`} onClick={() => setSelectedState(s.key)}>
                <div className={`crs-state-badge ${s.badgeClass}`}>{s.badge}</div>
                <div className="crs-state-info"><div className="crs-state-title">{s.title}</div><div className="crs-state-sub">{s.sub}</div></div>
                <div className="crs-state-chev">›</div>
              </button>
            ))}
            <div className="crs-group-div">
              <div className="crs-group-line" /><div className="crs-group-text" style={{color:'#185fa5'}}>콘텐츠는 있어요, 바로 시작하면 돼요</div><div className="crs-group-line" />
            </div>
            {STATES.filter(s => s.group === 1).map(s => (
              <button key={s.key} className={`crs-state-card${selectedState === s.key ? ' selected' : ''}`} onClick={() => setSelectedState(s.key)}>
                <div className={`crs-state-badge ${s.badgeClass}`}>{s.badge}</div>
                <div className="crs-state-info"><div className="crs-state-title">{s.title}</div><div className="crs-state-sub">{s.sub}</div></div>
                <div className="crs-state-chev">›</div>
              </button>
            ))}
          </div>

          {/* Right: Flow + Price */}
          <div className="crs-right">
            <div className="crs-flow-area">
              <svg width="100%" viewBox="0 0 460 340" xmlns="http://www.w3.org/2000/svg" style={{display:'block'}}>
                <defs>
                  <marker id="crs-arr" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
                    <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                  </marker>
                </defs>
                {/* wrapper */}
                <g style={{opacity: !pathData || pathData.active.includes('wrap') ? 1 : 0.1, transition:'opacity .28s'}}>
                  <rect x={3} y={12} width={388} height={280} rx={13} fill="#faece7" stroke="#f0997b" strokeWidth={1.2}/>
                </g>
                {/* Z1 */}
                <g style={{opacity: !pathData || pathData.active.includes('nz1') ? 1 : 0.1, transition:'opacity .28s'}}>
                  <rect x={6} y={22} width={108} height={44} rx={7} fill="#fcebeb" stroke="#f09595" strokeWidth={0.5}/>
                  <text x={60} y={38} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#a32d2d" fontWeight={600}>Z1</text>
                  <text x={60} y={54} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#791f1f" fontWeight={500}>콘텐츠 기획</text>
                </g>
                {/* Z2 */}
                <g style={{opacity: !pathData || pathData.active.includes('nz2') ? 1 : 0.1, transition:'opacity .28s'}}>
                  <rect x={6} y={96} width={108} height={44} rx={7} fill="#faeeda" stroke="#ef9f27" strokeWidth={0.5}/>
                  <text x={60} y={112} textAnchor="middle" dominantBaseline="central" fontSize={10} fill="#854f0b" fontWeight={600}>Z2</text>
                  <text x={60} y={128} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#412402" fontWeight={500}>SEO 기획 점검</text>
                </g>
                {/* Arrows Z→T */}
                <line x1={114} y1={44} x2={121} y2={44} stroke="#e24b4a" strokeWidth={1.5} strokeDasharray="3 2" markerEnd="url(#crs-arr)" style={{opacity: !pathData || pathData.active.includes('az1t1') ? 1 : 0.1, transition:'opacity .28s'}}/>
                <path d="M 114,108 L 122,108 L 122,54 L 123,54" fill="none" stroke="#ba7517" strokeWidth={1.5} strokeDasharray="3 2" markerEnd="url(#crs-arr)" style={{opacity: !pathData || pathData.active.includes('az2t1') ? 1 : 0.1, transition:'opacity .28s'}}/>
                <line x1={114} y1={130} x2={121} y2={130} stroke="#ba7517" strokeWidth={1.5} strokeDasharray="3 2" markerEnd="url(#crs-arr)" style={{opacity: !pathData || pathData.active.includes('az2t2') ? 1 : 0.1, transition:'opacity .28s'}}/>
                {/* T1 */}
                <g style={{opacity: !pathData || pathData.active.includes('nt1') ? 1 : 0.1, transition:'opacity .28s'}}>
                  <rect x={124} y={22} width={262} height={44} rx={7} fill="#e6f1fb" stroke="#85b7eb" strokeWidth={0.5}/>
                  <text x={255} y={38} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#0c447c" fontWeight={500}>즉시 배포 교육</text>
                  <text x={255} y={56} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#185fa5">ZIP 업로드 → 서브도메인 배포 · 당일 완성</text>
                </g>
                {/* T1→T2 */}
                <line x1={255} y1={66} x2={255} y2={93} stroke="#b4b2a9" strokeWidth={1.5} markerEnd="url(#crs-arr)" style={{opacity: !pathData || pathData.active.includes('at1t2') ? 1 : 0.1, transition:'opacity .28s'}}/>
                {/* T2 */}
                <g style={{opacity: !pathData || pathData.active.includes('nt2') ? 1 : 0.1, transition:'opacity .28s'}}>
                  <rect x={124} y={96} width={262} height={44} rx={7} fill="#e1f5ee" stroke="#5dcaa5" strokeWidth={0.5}/>
                  <text x={255} y={112} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#085041" fontWeight={500}>기초 세팅</text>
                  <text x={255} y={130} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#0f6e56">도메인 연결 · SEO 전략 정리</text>
                </g>
                {/* T2→T3 */}
                <line x1={255} y1={140} x2={255} y2={167} stroke="#b4b2a9" strokeWidth={1.5} markerEnd="url(#crs-arr)" style={{opacity: !pathData || pathData.active.includes('at2t3') ? 1 : 0.1, transition:'opacity .28s'}}/>
                {/* T3 */}
                <g style={{opacity: !pathData || pathData.active.includes('nt3') ? 1 : 0.1, transition:'opacity .28s'}}>
                  <rect x={124} y={170} width={262} height={44} rx={7} fill="#eeedfe" stroke="#afa9ec" strokeWidth={0.5}/>
                  <text x={255} y={186} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#26215c" fontWeight={500}>전략 수립</text>
                  <text x={255} y={204} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#534ab7">로드맵 컨설팅 · 자동화 교육</text>
                </g>
                {/* T3→T4 */}
                <line x1={255} y1={214} x2={255} y2={241} stroke="#b4b2a9" strokeWidth={1.5} markerEnd="url(#crs-arr)" style={{opacity: !pathData || pathData.active.includes('at3t4') ? 1 : 0.1, transition:'opacity .28s'}}/>
                {/* T4 */}
                <g style={{opacity: !pathData || pathData.active.includes('nt4') ? 1 : 0.1, transition:'opacity .28s'}}>
                  <rect x={124} y={244} width={262} height={44} rx={7} fill="#faeeda" stroke="#ef9f27" strokeWidth={0.5}/>
                  <text x={255} y={260} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#412402" fontWeight={500}>광고 확장</text>
                  <text x={255} y={278} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#854f0b">구글·메타 광고 교육 + 소재 제작</text>
                </g>
                {/* badge */}
                <g style={{opacity: !pathData || pathData.active.includes('wbadge') ? 1 : 0.1, transition:'opacity .28s'}}>
                  <line x1={70} y1={292} x2={70} y2={299} stroke="#f0997b" strokeWidth={1}/>
                  <line x1={320} y1={292} x2={320} y2={299} stroke="#f0997b" strokeWidth={1}/>
                  <line x1={70} y1={299} x2={320} y2={299} stroke="#f0997b" strokeWidth={1}/>
                  <line x1={197} y1={299} x2={197} y2={306} stroke="#f0997b" strokeWidth={1.2} markerEnd="url(#crs-arr)"/>
                  <rect x={91} y={308} width={212} height={24} rx={12} fill="#faece7" stroke="#f0997b" strokeWidth={1}/>
                  <text x={197} y={320} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#4a1b0c" fontWeight={600}>통합 패키지 · 150~300만원</text>
                </g>
              </svg>
            </div>

            {/* Price summary */}
            <div className="crs-price-area">
              {!pathData ? (
                <div className="crs-default-prompt">← 좌측에서 현재 상태를 선택하세요</div>
              ) : (
                <div>
                  <div className="crs-price-steps">
                    {pathData.steps.map((s, i) => (
                      <div key={i} className={`crs-price-step${s.special ? ' special' : ''}`}>
                        <span className="crs-price-step-label">{s.label}</span>
                        <span className="crs-price-step-value">{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="crs-price-footer">
                    <div className="crs-price-meta">
                      <span className="crs-price-dur">예상 {pathData.duration}</span>
                      <span className="crs-price-pkg">{pathData.pkg}</span>
                    </div>
                    <button className="crs-price-cta" onClick={() => alert('수강 신청 페이지로 연결합니다.')}>수강 신청하기 →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Divider ═══ */}
      <div className="crs-divider" />

      {/* ═══ SECTION 2: 패키지 구조 ═══ */}
      <section className="crs-packages">
        <div className="crs-section-hd">
          <h2>패키지 구조</h2>
          <p>개별 수강을 묶어 한 번에 진행합니다. 단계가 연결되어 개별 수강보다 빠르게 성과를 만들 수 있습니다.</p>
        </div>
        <div className="crs-pkg-grid">
          <div className="crs-pkg-card">
            <div className="crs-pkg-name">기본 패키지</div>
            <div className="crs-pkg-price">150만원</div>
            <div className="crs-pkg-dur">3~4주 완성</div>
            <div className="crs-pkg-divider" />
            <ul className="crs-pkg-list">
              <li>로드맵 컨설팅 (30분 × 3회)</li><li>SEO 전략 정리</li><li>홈페이지 즉시 배포 교육</li><li>독립 도메인 연결 교육</li><li>자동화 기초 교육</li>
            </ul>
            <div className="crs-pkg-tag">Z1 · Z2 · A · B 최적 시작점</div>
          </div>
          <div className="crs-pkg-card featured">
            <div className="crs-pkg-badge">추천</div>
            <div className="crs-pkg-name">표준 패키지</div>
            <div className="crs-pkg-price">200만원</div>
            <div className="crs-pkg-dur">4~6주 완성</div>
            <div className="crs-pkg-divider" />
            <ul className="crs-pkg-list">
              <li>기본 패키지 전체 포함</li><li>구글·메타 광고 고급 세팅 교육</li><li>GA4 · GTM · 픽셀 세팅</li><li>캠페인 구조 · 타겟·예산 설정</li>
            </ul>
            <div className="crs-pkg-tag">SEO → 광고 풀 셋업 완성</div>
          </div>
          <div className="crs-pkg-card">
            <div className="crs-pkg-name">확장 패키지</div>
            <div className="crs-pkg-price">250~300만원</div>
            <div className="crs-pkg-dur">5~8주 완성</div>
            <div className="crs-pkg-divider" />
            <ul className="crs-pkg-list">
              <li>표준 패키지 전체 포함</li><li>광고 소재 5종 제작 포함</li><li>인스타·네이버 자동화 교육</li><li>광고 즉시 실행 준비 완성</li>
            </ul>
            <div className="crs-pkg-tag">상태 C · 광고 올인원</div>
          </div>
        </div>
        <div className="crs-pkg-note">
          <p>모든 서비스는 고객의 현재 상태와 콘텐츠 준비도에 따라 범위가 조정될 수 있습니다. · 콘텐츠 기획부터 필요한 경우 별도 견적이 추가될 수 있습니다. · 실제 광고비, 외부 툴 사용료, 도메인 구입비는 별도입니다.</p>
        </div>
      </section>

      {/* ═══ SECTION 3: 개별 서비스 선택 ═══ */}
      <section className="crs-svc-section">
        <div className="crs-section-hd" style={{marginTop:56}}>
          <h2>개별 서비스 선택</h2>
          <p>필요한 항목을 선택하면 예상 금액을 확인하고 바로 상담 문의할 수 있습니다</p>
        </div>
        {SERVICES.map(cat => (
          <div key={cat.cat} className="crs-svc-cat">
            <div className="crs-svc-cat-label">{cat.cat}</div>
            <div className="crs-svc-grid">
              {cat.items.map(item => (
                <button key={item.key} className={`crs-svc-item${selectedSvcs.has(item.key) ? ' checked' : ''}`} onClick={() => toggleSvc(item.key, item.label, item.price, item.monthly)}>
                  <div className={`crs-svc-checkbox${selectedSvcs.has(item.key) ? ' on' : ''}`}>
                    {selectedSvcs.has(item.key) && <svg width={10} height={10} viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 4,7.5 8.5,2.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <div className="crs-svc-body">
                    <div className="crs-svc-name">{item.label}</div>
                    <div className="crs-svc-desc">{item.desc}</div>
                  </div>
                  <div className={`crs-svc-price${selectedSvcs.has(item.key) ? ' on' : ''}`}>{item.display}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ═══ Sticky Inquiry Bar ═══ */}
      {selectedSvcs.size > 0 && (
        <div className="crs-inquiry-bar">
          <div className="crs-inquiry-wrap">
            <div className="crs-inquiry-tags">
              {[...selectedSvcs.values()].map((s, i) => <span key={i} className="crs-inquiry-tag">{s.label}</span>)}
            </div>
            <div className="crs-inquiry-total-row">
              <span className="crs-inquiry-total-label">선택 합계</span>
              <span className="crs-inquiry-total-amt">{svcTotal.toLocaleString('ko-KR')}원</span>
              {hasMonthly && <span className="crs-inquiry-total-note">(월정액 포함)</span>}
            </div>
          </div>
          <button className="crs-inquiry-btn" onClick={() => setModalOpen(true)}>상담 문의하기 →</button>
        </div>
      )}

      {/* ═══ Inquiry Modal (Portal to body to escape transform ancestor) ═══ */}
      {modalOpen && ReactDOM.createPortal(
        <div className="crs-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="crs-modal">
            <button className="crs-modal-close" onClick={() => setModalOpen(false)}>×</button>
            <div className="crs-modal-title">상담 문의</div>
            <div className="crs-modal-sub">선택하신 서비스를 확인하고, 연락처를 남겨주시면 1영업일 내 연락드립니다.</div>
            <div className="crs-modal-summary">
              <div className="crs-modal-summary-title">선택 서비스</div>
              {[...selectedSvcs.values()].map((s, i) => (
                <div key={i} className="crs-modal-summary-item">
                  <span>{s.label}</span><span>{s.monthly ? '월 ' : ''}{s.price.toLocaleString('ko-KR')}원</span>
                </div>
              ))}
              <div className="crs-modal-summary-total">
                <span>합계</span><span>{svcTotal.toLocaleString('ko-KR')}원{hasMonthly ? ' +월정액' : ''}</span>
              </div>
            </div>
            <div className="crs-form-row"><label className="crs-form-label">이름 <span style={{color:'#993c1d'}}>*</span></label><input className="crs-form-input" value={formName} onChange={e => setFormName(e.target.value)} placeholder="홍길동" /></div>
            <div className="crs-form-row"><label className="crs-form-label">연락처 <span style={{color:'#993c1d'}}>*</span></label><input className="crs-form-input" value={formPhone} onChange={handlePhoneChange} type="tel" placeholder="010-0000-0000" /></div>
            <div className="crs-form-row"><label className="crs-form-label">카카오톡 ID (선택)</label><input className="crs-form-input" value={formKakao} onChange={e => setFormKakao(e.target.value)} placeholder="kakao_id" /></div>
            <div className="crs-form-row"><label className="crs-form-label">현재 상태 / 문의 내용</label><textarea className="crs-form-textarea" value={formMessage} onChange={e => setFormMessage(e.target.value)} placeholder="현재 운영 중인 사이트 주소나 상황을 간략히 적어주세요" /></div>
            <button className="crs-form-submit" onClick={submitForm}>상담 신청하기</button>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

/* ── Scoped CSS ── */
const COURSE_CSS = `
.crs-page {
  max-width: 1100px; margin: 0 auto; padding: 60px 24px 80px;
  font-family: -apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif;
  color: #1a1a18; background: #f8f7f4;
}
.crs-section-hd { margin-bottom: 36px; }
.crs-section-hd h2 { font-size: 28px; font-weight: 500; color: #1a1a18; line-height: 1.3; margin-bottom: 8px; }
.crs-section-hd p { font-size: 15px; color: #5f5e5a; }
.crs-divider { height: 1px; background: #e0dfd8; margin: 60px 0; }

/* ── Diagnosis ── */
.crs-diagnosis { margin-bottom: 80px; }
.crs-diag-layout { display: grid; grid-template-columns: 300px 1fr; gap: 28px; align-items: start; }
.crs-left { display: flex; flex-direction: column; gap: 0; }
.crs-group-div { display: flex; align-items: center; gap: 8px; margin: 16px 0 8px; }
.crs-group-div:first-child { margin-top: 0; }
.crs-group-line { flex: 1; height: 1px; background: #e0dfd8; }
.crs-group-text { font-size: 11px; font-weight: 600; white-space: nowrap; letter-spacing: .04em; }

.crs-state-card {
  background: #fff; border: 1px solid #e0dfd8; border-radius: 10px;
  padding: 12px 14px; cursor: pointer; margin-bottom: 6px;
  display: flex; align-items: center; gap: 10px;
  transition: border-color .15s, background .15s, box-shadow .15s;
  font-family: inherit; text-align: left; width: 100%;
}
.crs-state-card:hover { border-color: #b4b2a9; background: #f0efe9; }
.crs-state-card.selected { border-color: #185fa5; background: #e6f1fb; box-shadow: 0 0 0 2px rgba(24,95,165,.12); }
.crs-state-badge {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; flex-shrink: 0;
}
.crs-badge-z1 { background: #fcebeb; color: #a32d2d; }
.crs-badge-z2 { background: #faeeda; color: #854f0b; }
.crs-badge-a { background: #e6f1fb; color: #185fa5; }
.crs-badge-b { background: #f1efe8; color: #5f5e5a; border: 1px solid #e0dfd8; }
.crs-badge-c { background: #f1efe8; color: #5f5e5a; border: 1px solid #e0dfd8; }
.crs-state-info { flex: 1; min-width: 0; }
.crs-state-title { font-size: 13px; font-weight: 500; color: #1a1a18; line-height: 1.35; }
.crs-state-sub { font-size: 11px; color: #888780; margin-top: 2px; }
.crs-state-chev { font-size: 16px; color: #888780; flex-shrink: 0; }
.crs-state-card.selected .crs-state-chev { color: #185fa5; }

/* ── Right panel ── */
.crs-right { background: #fff; border: 1px solid #e0dfd8; border-radius: 14px; overflow: hidden; }
.crs-flow-area { padding: 24px 24px 16px; border-bottom: 1px solid #e0dfd8; }
.crs-price-area { padding: 20px 24px; min-height: 120px; }
.crs-default-prompt { display: flex; align-items: center; justify-content: center; height: 100px; font-size: 13px; color: #888780; }
.crs-price-steps { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
.crs-price-step {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; background: #f8f7f4; border-radius: 8px; gap: 12px;
}
.crs-price-step.special { background: #faece7; }
.crs-price-step.special .crs-price-step-label { color: #993c1d; }
.crs-price-step-label { font-size: 12px; color: #5f5e5a; }
.crs-price-step-value { font-size: 12px; font-weight: 500; color: #1a1a18; white-space: nowrap; flex-shrink: 0; }
.crs-price-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.crs-price-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.crs-price-dur { font-size: 12px; color: #5f5e5a; background: #f8f7f4; padding: 4px 10px; border-radius: 20px; border: 1px solid #e0dfd8; }
.crs-price-pkg { font-size: 12px; font-weight: 500; color: #185fa5; background: #e6f1fb; padding: 4px 10px; border-radius: 20px; }
.crs-price-cta {
  background: #1a1a18; color: #fff; border: none; border-radius: 8px;
  padding: 9px 18px; font-size: 13px; font-weight: 500; cursor: pointer;
  font-family: inherit; white-space: nowrap; transition: opacity .15s;
}
.crs-price-cta:hover { opacity: .85; }

/* ── Packages ── */
.crs-pkg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 32px; }
.crs-pkg-card { background: #fff; border: 1px solid #e0dfd8; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; }
.crs-pkg-card.featured { border: 2px solid #185fa5; }
.crs-pkg-badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; margin-bottom: 10px; font-weight: 500; background: #e6f1fb; color: #185fa5; width: fit-content; }
.crs-pkg-name { font-size: 13px; font-weight: 500; color: #5f5e5a; margin-bottom: 6px; }
.crs-pkg-price { font-size: 26px; font-weight: 500; color: #1a1a18; line-height: 1; }
.crs-pkg-dur { font-size: 12px; color: #888780; margin-top: 4px; margin-bottom: 16px; }
.crs-pkg-divider { height: 1px; background: #e0dfd8; margin-bottom: 16px; }
.crs-pkg-list { list-style: none; display: flex; flex-direction: column; gap: 7px; flex: 1; padding: 0; margin: 0; }
.crs-pkg-list li { font-size: 13px; color: #5f5e5a; display: flex; align-items: flex-start; gap: 6px; }
.crs-pkg-list li::before { content: '✓'; color: #3b6d11; flex-shrink: 0; margin-top: 1px; }
.crs-pkg-tag { margin-top: 16px; font-size: 11px; font-weight: 500; color: #185fa5; background: #e6f1fb; padding: 5px 10px; border-radius: 8px; text-align: center; }
.crs-pkg-note { margin-top: 24px; padding: 16px 20px; background: #fff; border: 1px solid #e0dfd8; border-radius: 10px; }
.crs-pkg-note p { font-size: 12px; color: #888780; line-height: 1.8; }

/* ── Service selector ── */
.crs-svc-section { margin-top: 60px; }
.crs-svc-cat { margin-bottom: 32px; }
.crs-svc-cat-label { font-size: 11px; font-weight: 600; letter-spacing: .06em; color: #888780; text-transform: uppercase; margin-bottom: 10px; }
.crs-svc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; }
.crs-svc-item {
  background: #fff; border: 1px solid #e0dfd8; border-radius: 10px;
  padding: 14px 16px; cursor: pointer; transition: border-color .15s, background .12s;
  display: flex; align-items: flex-start; gap: 12px; user-select: none;
  font-family: inherit; text-align: left; width: 100%;
}
.crs-svc-item:hover { border-color: #b4b2a9; background: #fafaf8; }
.crs-svc-item.checked { border-color: #185fa5; background: #e6f1fb; }
.crs-svc-checkbox {
  width: 18px; height: 18px; border: 1.5px solid #b4b2a9; border-radius: 4px;
  flex-shrink: 0; margin-top: 1px; display: flex; align-items: center; justify-content: center;
  transition: background .12s, border-color .12s;
}
.crs-svc-checkbox.on { background: #185fa5; border-color: #185fa5; }
.crs-svc-body { flex: 1; min-width: 0; }
.crs-svc-name { font-size: 13px; font-weight: 500; color: #1a1a18; margin-bottom: 3px; line-height: 1.35; }
.crs-svc-desc { font-size: 12px; color: #5f5e5a; line-height: 1.55; }
.crs-svc-price { font-size: 13px; font-weight: 500; color: #1a1a18; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
.crs-svc-price.on { color: #185fa5; }

/* ── Inquiry bar ── */
.crs-inquiry-bar {
  position: sticky; bottom: 0; background: #fff; border-top: 1px solid #e0dfd8;
  padding: 16px 24px; display: flex; align-items: center; gap: 20px;
  z-index: 100; box-shadow: 0 -4px 24px rgba(0,0,0,.06);
  margin: 0 -24px;
}
.crs-inquiry-wrap { flex: 1; }
.crs-inquiry-tags { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 6px; min-height: 22px; }
.crs-inquiry-tag { font-size: 11px; background: #e6f1fb; color: #185fa5; border-radius: 20px; padding: 2px 9px; font-weight: 500; }
.crs-inquiry-total-row { display: flex; align-items: baseline; gap: 8px; }
.crs-inquiry-total-label { font-size: 12px; color: #5f5e5a; }
.crs-inquiry-total-amt { font-size: 20px; font-weight: 500; color: #1a1a18; }
.crs-inquiry-total-note { font-size: 11px; color: #888780; }
.crs-inquiry-btn {
  background: #1a1a18; color: #fff; border: none; border-radius: 8px;
  padding: 12px 28px; font-size: 14px; font-weight: 500; cursor: pointer;
  font-family: inherit; white-space: nowrap; transition: opacity .15s; flex-shrink: 0;
}
.crs-inquiry-btn:hover { opacity: .85; }

/* ── Modal ── */
.crs-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 200;
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.crs-modal {
  background: #fff; border-radius: 14px; padding: 32px; width: 100%;
  max-width: 480px; max-height: 90vh; overflow-y: auto; position: relative;
}
.crs-modal-close { position: absolute; top: 16px; right: 18px; background: none; border: none; font-size: 22px; color: #888780; cursor: pointer; line-height: 1; }
.crs-modal-close:hover { color: #1a1a18; }
.crs-modal-title { font-size: 20px; font-weight: 500; margin-bottom: 6px; }
.crs-modal-sub { font-size: 13px; color: #5f5e5a; margin-bottom: 24px; line-height: 1.6; }
.crs-modal-summary { background: #f8f7f4; border-radius: 8px; padding: 12px 14px; margin-bottom: 22px; }
.crs-modal-summary-title { font-size: 11px; font-weight: 600; color: #888780; letter-spacing: .05em; margin-bottom: 8px; }
.crs-modal-summary-item { display: flex; justify-content: space-between; font-size: 12px; color: #5f5e5a; padding: 3px 0; border-bottom: 1px solid #e0dfd8; }
.crs-modal-summary-item:last-of-type { border-bottom: none; }
.crs-modal-summary-total { display: flex; justify-content: space-between; align-items: baseline; margin-top: 10px; padding-top: 10px; border-top: 1px solid #b4b2a9; }
.crs-modal-summary-total span:first-child { font-size: 13px; font-weight: 500; }
.crs-modal-summary-total span:last-child { font-size: 18px; font-weight: 500; color: #185fa5; }

.crs-form-row { margin-bottom: 14px; }
.crs-form-label { font-size: 12px; font-weight: 500; color: #5f5e5a; margin-bottom: 5px; display: block; }
.crs-form-input, .crs-form-textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #e0dfd8; border-radius: 8px;
  font-size: 13px; font-family: inherit; color: #1a1a18; background: #fff;
  outline: none; transition: border-color .15s; box-sizing: border-box;
}
.crs-form-input:focus, .crs-form-textarea:focus { border-color: #185fa5; }
.crs-form-textarea { min-height: 80px; resize: vertical; }
.crs-form-submit {
  width: 100%; background: #1a1a18; color: #fff; border: none; border-radius: 8px;
  padding: 13px; font-size: 14px; font-weight: 500; cursor: pointer;
  font-family: inherit; margin-top: 8px; transition: opacity .15s;
}
.crs-form-submit:hover { opacity: .85; }

/* ── Responsive ── */
@media (max-width: 840px) {
  .crs-diag-layout { grid-template-columns: 1fr; }
  .crs-pkg-grid { grid-template-columns: 1fr; gap: 12px; }
  .crs-svc-grid { grid-template-columns: 1fr; }
  .crs-inquiry-bar { flex-direction: column; align-items: stretch; gap: 12px; }
  .crs-modal { padding: 24px 20px; }
}
`;
