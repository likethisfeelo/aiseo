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
const MODULES: AccCategory[] = [
  // ── 사전준비 ──
  {
    icon: '🔍',
    title: '사전준비',
    sub: '홈페이지 제작 전 업종·키워드·콘텐츠 구조를 먼저 잡는 단계입니다',
    items: [
      {
        id: 'acc-p1',
        num: '001',
        chip: '001 · Pre-launch',
        chipClass: 'pre',
        name: 'SEO 검색노출전략 점검',
        tags: ['#업종분석', '#키워드전략', '#경쟁군분석'],
        price: '20만원',
        desc: '홈페이지를 만들기 전에 "어떤 키워드로, 어떤 고객에게 보여야 하는가"를 먼저 정리하는 세션입니다. 사업자 기준으로 업종 포지셔닝, 경쟁군 분석, 메인·서브 키워드 선정, 검색 의도 분류까지 한 번에 다룹니다.\n\n제작 방향이 잡힌 후 홈페이지를 만들면 구조 수정 없이 바로 검색 노출 구조로 연결됩니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '홈페이지를 만들기 전에 검색 전략부터 잡고 싶은 사업자',
          '내 업종에서 어떤 키워드가 효과적인지 모르는 분',
          '경쟁사 대비 차별화 포인트를 검색 관점에서 정리하고 싶은 분',
        ],
        learnTitle: '다루는 내용',
        learn: [
          '업종 포지셔닝 및 타겟 고객 정의',
          '경쟁군 분석 및 검색 상위 구조 파악',
          '메인/서브 키워드 선정 (지역 키워드 포함)',
          '검색 의도 유형 분류',
          '키워드 우선순위 문서화',
        ],
        metaChips: ['⏱ 1회 (약 60분)', '💬 화상 컨설팅', '📄 키워드 정리 문서 제공'],
      },
      {
        id: 'acc-p2',
        num: '002',
        chip: '002 · Pre-launch',
        chipClass: 'pre',
        name: '홈페이지 및 콘텐츠 기획 · 내용 설계',
        tags: ['#메뉴구조', '#CTA작성', '#콘텐츠기획'],
        price: '20만원',
        desc: '홈페이지에 어떤 내용을, 어떤 순서로, 어떤 문장으로 담을지 설계하는 교육입니다. 단순히 문장을 다듬는 수준이 아니라, 메뉴 구조부터 서비스 설명 정리, 소개 문장과 CTA, 전체 콘텐츠 방향까지 홈페이지 제작 전 필요한 모든 기획을 한 번에 마칩니다.\n\n이 교육을 마치면 AI 도구에 명확한 방향을 넣을 수 있는 상태가 되어, 만들어지는 결과물의 완성도가 크게 높아집니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '홈페이지에 뭘 써야 할지 막막한 분',
          '서비스 설명이 너무 길거나 핵심이 없다는 피드백을 받은 분',
          '기획 없이 만들었다가 처음부터 다시 고친 경험이 있는 분',
        ],
        learnTitle: '다루는 내용',
        learn: [
          '홈페이지 메뉴 구조 설계 (페이지 수·우선순위)',
          '서비스 설명 정리 및 핵심 문장 추출',
          '소개 문장 · CTA 문구 작성',
          '콘텐츠 방향 및 톤앤매너 설정',
          'AI 도구에 넣을 프롬프트 방향 정리',
        ],
        metaChips: ['⏱ 1회 (약 60~80분)', '💬 화상 컨설팅', '📝 기획 문서 제공'],
      },
    ],
  },
  // ── CORE 1 ──
  {
    icon: '⭐',
    title: 'CORE 1 — 핵심 교육',
    sub: '사이트를 실제로 웹에 올리는 핵심 실습입니다',
    core: true,
    items: [
      {
        id: 'acc-1',
        num: 'CORE 1',
        numClass: 'is-core',
        chip: 'CORE 1 · Deployment',
        chipClass: 'core',
        name: 'AI 홈페이지 즉시 배포 + 기술적 SEO 셋팅',
        tags: ['#즉시배포', '#서치콘솔', '#GA4연동', '#기술적SEO'],
        price: '10만원',
        desc: 'AI로 만든 홈페이지를 실제 웹 주소에 올리는 것에서 끝나지 않습니다. 배포 직후 검색엔진이 내 사이트를 제대로 인식하고 데이터를 쌓을 수 있도록, Google Search Console · GA4 · 네이버 서치어드바이저 연동까지 원클릭 셋팅으로 한 번에 완성합니다.\n\nZIP 업로드부터 서브도메인 배포, 기술적 SEO 설정, 측정 코드 삽입까지 교육 당일 실제로 공개 가능한 URL과 데이터 수집 환경이 동시에 만들어집니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          'AI 도구로 홈페이지를 만들었지만 올리는 방법을 모르는 분',
          '배포는 됐는데 Search Console·GA4가 연결이 안 된 분',
          '검색 노출 기반을 처음부터 제대로 잡고 싶은 분',
        ],
        learnTitle: '배우게 되는 것',
        learn: [
          'AWS S3 버킷 생성 및 정적 웹 호스팅 · 서브도메인 배포',
          '기술적 SEO — 메타 태그 · robots.txt · sitemap.xml 설정',
          'Google Search Console 연동 · 소유권 인증 · 색인 요청',
          'GA4 설치 · 기본 이벤트 수집 확인',
          '네이버 서치어드바이저 등록 · 사이트맵 제출',
          '배포 후 수정사항 재업로드 방법',
        ],
        metaChips: ['⏱ 약 90~120분', '💻 화상 실습', '📋 SEO 셋팅 체크리스트'],
      },
    ],
  },
];
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
