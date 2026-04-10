import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

// ============================================================================
// Types
// ============================================================================

interface Preset {
  id: string;
  icon: string;
  label: string;
}

interface StateCard {
  id: string;
  iconClass: string; // z1 | z2 | sA | sB | sC
  icon: string;
  title: string;
  sub: string;
}

interface RouteStep {
  n: string;
  title: string;
  desc: string;
}

interface RouteEstimateRow {
  label: string;
  value: string;
  sub?: string;
  isTotal?: boolean;
}

interface RouteData {
  pills: string[];
  kicker?: string;
  title: string;
  desc: string;
  meta: string[];
  steps: RouteStep[];
  totalEst: string;
  estimate: RouteEstimateRow[];
  note?: string;
}

interface AccItem {
  id: string;
  num: string;
  numClass?: string; // '' | 'is-core' | 'is-mnt'
  chip: string;
  chipClass: string; // 'pre' | 'core' | 'mnt' | 'str' | 'ads'
  name: string;
  tags: string[];
  price: string;
  desc: string;
  whoTitle: string;
  who: string[];
  learnTitle: string;
  learn: string[];
  metaChips: string[];
}

interface AccCategory {
  icon: string;
  title: string;
  sub: string;
  core?: boolean;
  items: AccItem[];
}

interface SvcItem {
  id: string;
  code: string;
  codeClass: string; // 'pre' | 'core' | 'mnt' | 'str' | 'ads'
  name: string;
  desc: string;
  price: number;
  priceLabel: string;
}

interface SvcGroup {
  icon: string;
  title: string;
  items: SvcItem[];
}

interface PkgCard {
  id: string;
  featured?: boolean;
  tier: string;
  name: string;
  price: string;
  duration: string;
  includes: string[];
  tags?: string[];
}

interface AddOn {
  code: string;
  codeClass: string;
  name: string;
  desc: string;
  price: string;
}

// ============================================================================
// Data (populated in later phases)
// ============================================================================

const PRESETS: Preset[] = [
  { id: 'Z1', icon: '📝', label: '기획부터 시작' },
  { id: 'Z2', icon: '🔍', label: 'SEO 재정비' },
  { id: 'A',  icon: '🌐', label: '빠른 배포' },
  { id: 'B',  icon: '📊', label: '검색 유입 개선' },
  { id: 'C',  icon: '🚀', label: '광고·확장' },
];

const STATES: StateCard[] = [
  {
    id: 'Z1',
    iconClass: 'z1',
    icon: 'Z1',
    title: '홈페이지 내용 구성부터 필요해요',
    sub: '기획 전 단계 · 사이트 없음',
  },
  {
    id: 'Z2',
    iconClass: 'z2',
    icon: 'Z2',
    title: '기존 내용은 있는데 SEO 점검이 필요해요',
    sub: '사이트 있음 · SEO 재구조화 필요',
  },
  {
    id: 'A',
    iconClass: 'sA',
    icon: 'A',
    title: '콘텐츠는 준비됐는데 사이트가 없어요',
    sub: '콘텐츠 준비됨 · 사이트 없음',
  },
  {
    id: 'B',
    iconClass: 'sB',
    icon: 'B',
    title: '홈페이지는 있는데 검색이 약해요',
    sub: '사이트 있음 · SEO·측정 미정리',
  },
  {
    id: 'C',
    iconClass: 'sC',
    icon: 'C',
    title: 'AI로 마케팅을 자동화하고, 광고를 확장하고 싶어요',
    sub: '사이트 있음 · 광고·자동화 단계',
  },
];

const ROUTES: Record<string, RouteData> = {
  Z1: {
    pills: ['사이트 없음', '입문자 추천'],
    title: '사전준비 → 배포 교육 → 기초 세팅',
    desc: '아직 홈페이지에 담을 내용이 정리되지 않은 상태입니다. 검색 전략과 콘텐츠 구조를 먼저 잡은 뒤, 배포와 기본 SEO 세팅으로 넘어가는 흐름이 가장 효율적입니다.',
    meta: ['⏱ 예상 5~7주', '💰 40~80만원', '📦 기본 패키지 추천'],
    steps: [
      { n: '01', title: 'SEO 전략 점검', desc: '업종·키워드·경쟁군을 먼저 정리합니다.' },
      { n: '02', title: '콘텐츠 구조 설계', desc: '페이지 구조와 핵심 문장을 설계합니다.' },
      { n: '03', title: '즉시 배포 교육', desc: '준비된 결과물을 웹으로 올립니다.' },
      { n: '04', title: '기초 SEO 세팅', desc: '검색 노출을 위한 메타 구조를 다듬습니다.' },
    ],
    totalEst: '40~80만원',
    estimate: [
      { label: 'SEO 검색노출전략 점검', value: '20만원' },
      { label: '콘텐츠 구조·문장 설계', value: '10만원' },
      { label: '즉시 배포 교육', value: '10만원' },
      { label: '+ 로드맵 컨설팅 (선택)', value: '20만원' },
    ],
    note: '처음부터 한 번에 만들기보다, 검색 전략과 콘텐츠 구조를 먼저 잡아두는 쪽이 시행착오를 줄입니다.',
  },
  Z2: {
    pills: ['사이트 있음', 'SEO 재정비 필요'],
    title: 'SEO 기획 점검 → 기초 세팅 → 운영 전략',
    desc: '기존 콘텐츠는 있지만 검색 유입 구조가 약한 상태입니다. 내용을 새로 만들기보다, 검색 의도에 맞게 구조를 재배치하는 접근이 우선입니다.',
    meta: ['⏱ 예상 4~6주', '💰 30~80만원', '📦 기본/표준 패키지 추천'],
    steps: [
      { n: '01', title: 'SEO 기획 점검', desc: '현재 문구와 페이지 구조를 검색 관점에서 진단합니다.' },
      { n: '02', title: '기초 세팅', desc: '도메인·메타·기본 측정 구조를 정리합니다.' },
      { n: '03', title: '운영 로드맵', desc: '콘텐츠 확장과 광고 연결 여부를 결정합니다.' },
      { n: '04', title: '선택 확장', desc: '업종 특성에 따라 자동화·광고 설계를 추가합니다.' },
    ],
    totalEst: '30~80만원',
    estimate: [
      { label: 'SEO 기획 점검', value: '10만원' },
      { label: '기초 세팅', value: '20~30만원' },
      { label: '로드맵 컨설팅', value: '20만원~' },
    ],
    note: '이미 있는 자료를 버리지 않고 재구성하는 방식이므로, 효율 대비 만족도가 높은 편입니다.',
  },
  A: {
    pills: ['사이트 없음', '빠른 배포'],
    title: '즉시 배포 교육 중심으로 빠르게 오픈',
    desc: '콘텐츠는 준비되어 있고 사이트만 없는 상태입니다. 우선 공개 가능한 형태로 배포한 뒤, 이후 필요한 세팅을 붙여 나가는 것이 가장 빠른 방법입니다.',
    meta: ['⏱ 예상 3~5주', '💰 10~40만원', '📦 기본 패키지 추천'],
    steps: [
      { n: '01', title: '즉시 배포 교육', desc: '준비된 파일을 실제 웹으로 배포합니다.' },
      { n: '02', title: '도메인 연결', desc: '필요 시 브랜드용 도메인으로 연결합니다.' },
      { n: '03', title: '기본 SEO 정리', desc: '최소한의 검색 노출 구조를 붙입니다.' },
      { n: '04', title: '후속 점검', desc: '오픈 후 필요한 수정 범위를 결정합니다.' },
    ],
    totalEst: '10~40만원',
    estimate: [
      { label: '즉시 배포 교육', value: '10만원' },
      { label: '+ 도메인 연결 (선택)', value: '10만원' },
      { label: '+ 로드맵 컨설팅 (선택)', value: '20만원' },
      { label: '+ 월간 유지관리 (선택)', value: '10만원/월' },
    ],
    note: '가장 빠르게 결과를 확인하고 싶은 경우에 적합한 경로입니다.',
  },
  B: {
    pills: ['사이트 보유', '검색 유입 개선'],
    title: 'SEO 정비 → 측정 구조 점검 → 유입 개선',
    desc: '사이트는 있지만 검색이 잘 되지 않는 경우입니다. 디자인보다 먼저 구조, 메타 정보, 측정 도구 설정을 점검하는 것이 우선입니다.',
    meta: ['⏱ 예상 4~6주', '💰 30~80만원', '📦 표준 패키지 추천'],
    steps: [
      { n: '01', title: '현황 진단', desc: '페이지 구조와 검색 노출 상태를 점검합니다.' },
      { n: '02', title: 'SEO 구조 정리', desc: '메타·카피·페이지 우선순위를 재설계합니다.' },
      { n: '03', title: '측정 세팅', desc: '유입과 전환 흐름을 추적 가능한 상태로 만듭니다.' },
      { n: '04', title: '유입 확대', desc: '필요 시 광고 구조나 월 운영으로 연결합니다.' },
    ],
    totalEst: '30~80만원',
    estimate: [
      { label: 'SEO 전략 정리', value: '10만원' },
      { label: '+ 로드맵 컨설팅 (선택)', value: '20만원' },
      { label: '+ 월간 유지관리 (선택)', value: '10만원/월' },
    ],
    note: '겉보기 리디자인보다 검색 구조 재정비가 먼저 성과로 이어질 가능성이 높습니다.',
  },
  C: {
    pills: ['기초 완성', '광고·자동화'],
    title: '광고 구조 설계 → 자동화 → 월간 운영',
    desc: '기초는 갖춰져 있고 이제 확장 효율이 중요한 상태입니다. 광고 집행 구조, 랜딩 흐름, 운영 자동화 설계가 핵심이 됩니다.',
    meta: ['⏱ 예상 5~8주', '💰 50만원+', '📦 확장 패키지 추천'],
    steps: [
      { n: '01', title: '광고 구조 설계', desc: '채널별 집행 목적과 전환 흐름을 정리합니다.' },
      { n: '02', title: '랜딩 점검', desc: '광고 유입 이후 이탈을 줄이는 구조를 확인합니다.' },
      { n: '03', title: '자동화 설계', desc: '운영·콘텐츠·보고 체계를 간소화합니다.' },
      { n: '04', title: '월간 운영', desc: '지속 개선용 관리 구조로 연결합니다.' },
    ],
    totalEst: '80~130만원',
    estimate: [
      { label: '광고 고급 세팅 교육', value: '50만원' },
      { label: '자동화 교육', value: '30만원' },
      { label: '월간 유지관리', value: '10만원/월' },
    ],
    note: '"무엇을 더 만들까"보다 "어디에 예산을 써야 효율이 나는가"가 중요한 단계입니다.',
  },
};
const MODULES: AccCategory[] = [];
const SERVICE_GROUPS: SvcGroup[] = [];
const PACKAGES: PkgCard[] = [];
const ADDONS: AddOn[] = [];

// ============================================================================
// Scoped CSS (populated in Phase 9-10)
// ============================================================================

const COURSE_CSS = `
.aiv5-page { font-family: var(--font-ko); }
`;

// ============================================================================
// Component
// ============================================================================

export function CoursePage() {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [openAccId, setOpenAccId] = useState<string | null>(null);
  const [selectedSvcs, setSelectedSvcs] = useState<Map<string, SvcItem>>(new Map());
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMemo, setFormMemo] = useState('');

  useEffect(() => {
    const styleId = 'aiv5-course-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = COURSE_CSS;
    document.head.appendChild(style);
  }, []);

  // Suppress unused warnings until later phases wire them up
  void PRESETS; void STATES; void ROUTES; void MODULES;
  void SERVICE_GROUPS; void PACKAGES; void ADDONS;
  void selectedState; void setSelectedState;
  void openAccId; void setOpenAccId;
  void selectedSvcs; void setSelectedSvcs;
  void modalOpen; void setModalOpen;
  void formName; void setFormName;
  void formPhone; void setFormPhone;
  void formEmail; void setFormEmail;
  void formMemo; void setFormMemo;
  void ReactDOM;

  return (
    <div className="aiv5-page">
      {/* Phase 1 skeleton — sections rendered in later phases */}
    </div>
  );
}
