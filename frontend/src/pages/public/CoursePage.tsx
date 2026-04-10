import { useEffect, useRef, useState, type FormEvent } from 'react';
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

// ── Mobile-only types ──

interface EduCard {
  code: string;
  codeType: 'pre' | 'core' | 'mnt' | 'str' | 'ads';
  cat: string;
  name: string;
  price: string;
  desc: string;
  tags: string[];
}

interface EduSection {
  id: string;
  label: string;
  icon: string;
  highlight?: boolean;
  cards: EduCard[];
}

interface WizService {
  key: string;
  code: string;
  codeType: 'pre' | 'core' | 'mnt' | 'str' | 'ads';
  label: string;
  price: number;
  priceStr: string;
  monthly?: boolean;
}

interface WizStep {
  cat: string;
  icon: string;
  isCore?: boolean;
  optionType: 'pre' | 'core1' | 'general';
  desc: string;
  services: WizService[];
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
  // ── MNT ──
  {
    icon: '🔧',
    title: 'MNT — 도메인 연결 · 유지관리',
    sub: '독립 도메인 연결부터 월간 점검까지 운영을 지속하는 서비스입니다',
    items: [
      {
        id: 'acc-2',
        num: 'MNT 1',
        numClass: 'is-mnt',
        chip: 'MNT 1 · Domain',
        chipClass: 'mnt',
        name: '독립 도메인 직접 연결 교육',
        tags: ['#Route53', '#도메인연결', '#DNS설정'],
        price: '10만원',
        desc: '서브도메인이 아닌 내 브랜드 도메인(예: myshop.com)으로 사이트를 연결하는 과정입니다. 도메인 구매부터 DNS 설정, AWS Route 53 연동, HTTPS 인증서 적용까지 실제로 손에 익히게 됩니다.\n\n한 번 익혀두면 이후 어떤 사이트든 스스로 연결할 수 있습니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '구매해 둔 도메인이 있는데 연결 방법을 모르는 분',
          '서브도메인에서 브랜드 도메인으로 업그레이드하려는 분',
          'DNS·호스팅 개념을 한 번 제대로 이해하고 싶은 분',
        ],
        learnTitle: '배우게 되는 것',
        learn: [
          '도메인 등록 구조와 DNS 레코드 이해',
          'Route 53 호스팅 영역 생성 및 레코드 설정',
          'CloudFront 배포와 도메인 연결',
          'ACM 인증서 발급 및 HTTPS 적용',
          '서브도메인 분기 설정 (www / blog 등)',
        ],
        metaChips: ['⏱ 약 40~60분', '💻 화상 실습', '📋 설정 가이드 제공'],
      },
      {
        id: 'acc-mnt2',
        num: 'MNT 2',
        numClass: 'is-mnt',
        chip: 'MNT 2 · Support',
        chipClass: 'mnt',
        name: '독립 도메인 연결 지원',
        tags: ['#1회대행', '#직접연결'],
        price: '10만원',
        desc: '교육 없이 도메인 연결 자체를 1회 직접 지원해드리는 서비스입니다. 이미 흐름은 알고 있거나, 빠르게 연결만 완료하고 싶은 분에게 적합합니다. 유지보수 의무 없이 1회 완결로 진행됩니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '교육 없이 도메인 연결만 빠르게 해결하고 싶은 분',
          '이미 배포는 됐지만 도메인 연결에서 막힌 분',
        ],
        learnTitle: '서비스 내용',
        learn: [
          '1회 도메인 연결 직접 지원',
          'DNS 설정 및 HTTPS 적용 완료',
          '유지보수 의무 없음 (1회 완결)',
        ],
        metaChips: ['⏱ 약 30~40분', '💻 화상 지원'],
      },
      {
        id: 'acc-mnt3',
        num: 'MNT 3',
        numClass: 'is-mnt',
        chip: 'MNT 3 · Support',
        chipClass: 'mnt',
        name: '후속 기술 지원',
        tags: ['#오픈후관리', '#기술지원'],
        price: '10만원',
        desc: '사이트 오픈 이후 예상치 못한 문제가 생겼을 때 빠르게 대응하는 지원 서비스입니다. 40분 내 문제 파악·해결을 목표로 하며, 교육 수강생뿐 아니라 직접 배포한 분도 이용 가능합니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '사이트 오픈 후 예기치 않은 오류가 생긴 분',
          '스스로 해결이 어렵고 빠른 지원이 필요한 분',
        ],
        learnTitle: '서비스 내용',
        learn: [
          '문제 파악 및 원인 분석',
          '수정 범위 결정 및 직접 처리 또는 가이드',
        ],
        metaChips: ['⏱ 약 40분', '💻 화상 지원'],
      },
      {
        id: 'acc-mnt4',
        num: 'MNT 4',
        numClass: 'is-mnt',
        chip: 'MNT 4 · Monthly',
        chipClass: 'mnt',
        name: '월간 점검 관리',
        tags: ['#월정기관리', '#백업', '#보고'],
        price: '월 10만원',
        desc: '사이트가 안정적으로 운영되고 있는지 월 1회 점검하고, 백업과 함께 간단한 상태 보고서를 제공합니다. 직접 관리하기 어렵거나 꾸준히 상태를 확인하고 싶은 분께 적합합니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '사이트는 오픈했지만 관리에 시간을 쓰기 어려운 분',
          '문제가 생기기 전에 정기적으로 점검받고 싶은 분',
        ],
        learnTitle: '서비스 내용',
        learn: [
          '월 1회 사이트 전체 백업',
          '월 1회 상태 점검 및 간단 보고',
          '이상 발생 시 우선 대응',
        ],
        metaChips: ['📅 월 1회', '📄 점검 보고서 제공'],
      },
    ],
  },
  // ── 전략·컨설팅 ──
  {
    icon: '💡',
    title: '전략 · 컨설팅',
    sub: '검색 유입 구조와 마케팅 로드맵을 설계하는 단계입니다',
    items: [
      {
        id: 'acc-4',
        num: '101',
        chip: '101 · Consulting',
        chipClass: 'str',
        name: '1:1 성장 로드맵 컨설팅',
        tags: ['#맞춤전략', '#경쟁분석', '#예산설계'],
        price: '20만원 (3회)',
        desc: '"무엇을 먼저 해야 하는지"가 명확해지는 세션입니다. 현재 사이트 상태, 업종 경쟁 현황, 예산 규모를 기반으로 지금 당장 실행해야 할 우선순위와 이후 단계별 로드맵을 함께 설계합니다.\n\n1회 30분, 총 3회로 진행되며 단계마다 실행 결과를 점검하고 다음 방향을 조정합니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '어디서부터 시작해야 할지 방향을 못 잡고 있는 분',
          '예산 대비 어떤 채널에 집중해야 효율적인지 궁금한 분',
          '여러 서비스를 써봤지만 성과가 없었던 분',
        ],
        learnTitle: '컨설팅에서 다루는 것',
        learn: [
          '업종별 검색 현황 및 경쟁사 포지셔닝 분석',
          'SEO·광고·SNS 채널 우선순위 도출',
          '예산별 실행 시나리오 3가지 제안',
          '단기·중기 마케팅 로드맵 문서화',
          '2·3차 세션에서 실행 결과 점검 및 조정',
        ],
        metaChips: ['⏱ 30분 × 3회', '💬 화상 미팅', '📄 로드맵 문서 제공'],
      },
      {
        id: 'acc-3',
        num: '102',
        chip: '102 · Strategy',
        chipClass: 'str',
        name: 'SEO 전략 정리 · 온라인 마케팅 방향 수립',
        tags: ['#검색유입', '#키워드전략', '#페이지구조'],
        price: '10만원',
        desc: '검색 유입을 만드는 것은 단순히 키워드를 넣는 것이 아닙니다. 어떤 페이지에 어떤 내용을 담아야 검색 결과 상단에 노출되는지, 구조와 전략을 설계하는 방법을 배웁니다.\n\n기존 사이트가 있는 경우 현황 진단을 함께 진행합니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '사이트는 있는데 검색 유입이 거의 없는 분',
          '광고 없이도 지속적인 유입 기반을 만들고 싶은 분',
          '어떤 키워드를 어떻게 써야 할지 방향을 못 잡은 분',
        ],
        learnTitle: '배우게 되는 것',
        learn: [
          '검색 의도 유형 분석 및 타겟 키워드 선정',
          '페이지별 콘텐츠 우선순위 설계',
          '제목·메타 설명·H태그 최적화 실습',
          '내부 링크 구조와 시맨틱 HTML 개요',
          'Google Search Console 연동 및 색인 확인',
        ],
        metaChips: ['⏱ 약 60분', '💻 화상 컨설팅', '📊 분석 자료 제공'],
      },
    ],
  },
  // ── CORE 2 ──
  {
    icon: '⭐',
    title: 'CORE 2 — 핵심 교육',
    sub: '광고 구조를 직접 세팅하고 데이터를 읽는 핵심 실습입니다',
    core: true,
    items: [
      {
        id: 'acc-5',
        num: 'CORE 2',
        numClass: 'is-core',
        chip: 'CORE 2 · Paid Ads',
        chipClass: 'core',
        name: '구글 · 메타 광고 고급 세팅 교육',
        tags: ['#픽셀세팅', '#캠페인구조', '#전환최적화'],
        price: '50만원',
        desc: '광고를 "켜두는" 것이 아니라, 데이터를 보고 성과가 나는 지점을 찾아 확장하는 구조를 만듭니다. 구글 Ads와 메타 광고를 동시에 다루며, 두 플랫폼의 알고리즘 차이와 역할 분리 전략을 함께 배웁니다.\n\n픽셀 및 전환 추적 설정부터 캠페인 구조 설계, 타겟 세팅, 예산 배분, 실제 데이터 읽는 법까지 실전 중심으로 진행합니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '광고를 집행해봤지만 ROAS가 낮고 이유를 모르는 분',
          '에이전시 없이 직접 광고를 운영하고 싶은 분',
          'GA4·픽셀 세팅이 안 되어 있어 데이터가 안 쌓이는 분',
        ],
        learnTitle: '배우게 되는 것',
        learn: [
          '메타 픽셀 · GA4 · GTM 연동 및 전환 이벤트 설정',
          '구글 검색·디스플레이 캠페인 구조 설계',
          '메타 타겟 세그먼트 · 유사 타겟 설정',
          '예산 배분 공식 및 소재 A/B 테스트 방법',
          '광고 데이터 읽는 법 (CTR · CPC · ROAS 해석)',
        ],
        metaChips: ['⏱ 약 120~150분', '💻 화상 실습', '📋 세팅 체크리스트'],
      },
      {
        id: 'acc-8',
        num: '201',
        chip: '201 · Ads Package',
        chipClass: 'ads',
        name: '광고 실행 준비 패키지',
        tags: ['#소재제작', '#5회진행', '#즉시실행'],
        price: '100만원 (5회)',
        desc: '광고를 당장 집행할 수 있는 상태로 만드는 패키지입니다. 5회에 걸쳐 전략 설계부터 소재 5종 제작까지 순차적으로 진행하며, 세션이 끝날 때 바로 광고를 켤 수 있는 준비를 완성합니다.\n\n소재 제작은 단순 디자인이 아닙니다. ChatGPT · Claude · Midjourney · Canva AI · CapCut AI 등 다양한 AI 도구를 조합해 텍스트·이미지·영상 소재를 빠르게 뽑아내는 방법을 함께 익힙니다. AI를 활용하면 에이전시 비용의 일부로 고품질 소재를 직접 만들 수 있습니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '광고를 처음 시작하고 소재부터 세팅까지 한 번에 준비하고 싶은 분',
          '광고 소재 제작 역량이 부족해 집행을 미루고 있던 분',
        ],
        learnTitle: '포함 내용',
        learn: [
          '광고 전략 방향 설계 — 채널 선정·타겟·예산 (1회)',
          'AI 카피라이팅 — ChatGPT·Claude로 광고 문구 대량 생성 (1회)',
          'AI 이미지·영상 소재 제작 — Midjourney·Canva AI·CapCut AI 활용 (2회)',
          '캠페인 구조 세팅 및 소재 업로드·최종 점검 (1회)',
        ],
        metaChips: ['⏱ 총 5회', '💻 화상 + 작업', '🎨 소재 5종 포함'],
      },
    ],
  },
  // ── CORE 3 ──
  {
    icon: '⭐',
    title: 'CORE 3 — 핵심 교육',
    sub: '콘텐츠 운영을 자동화하는 핵심 실습입니다',
    core: true,
    items: [
      {
        id: 'acc-6',
        num: 'CORE 3',
        numClass: 'is-core',
        chip: 'CORE 3 · Automation',
        chipClass: 'core',
        name: '인스타 · 네이버 게시 자동화 교육',
        tags: ['#노코드', '#게시자동화', '#운영효율'],
        price: '30만원',
        desc: '콘텐츠를 한 번 만들면 여러 채널에 자동으로 올라가는 구조를 만듭니다. 노코드 기반 자동화 툴(Make, Zapier 등)을 활용해 인스타그램 예약 게시, 네이버 블로그 연동, 문의 접수 → 알림 워크플로우까지 설계합니다.\n\n반복 업무를 줄이고 운영에 쓸 시간을 확보하는 것이 핵심입니다.',
        whoTitle: '이런 분께 추천합니다',
        who: [
          '매일 SNS 게시물을 올리는 것이 부담스러운 분',
          '콘텐츠는 있는데 업로드 루틴이 없어 중단되는 분',
          '코딩 없이 업무 자동화를 처음 시도해보고 싶은 분',
        ],
        learnTitle: '배우게 되는 것',
        learn: [
          'Make(Integromat) / Zapier 기본 워크플로우 구조',
          '인스타그램 예약 게시 자동화 설정',
          '노션·구글 시트 → SNS 게시 연동 파이프라인',
          '문의 폼 → 카카오·슬랙 알림 자동화',
          '자동화 시나리오 오류 모니터링 방법',
        ],
        metaChips: ['⏱ 약 90~120분', '💻 화상 실습', '🔧 워크플로우 템플릿'],
      },
    ],
  },
];
const SERVICE_GROUPS: SvcGroup[] = [
  {
    icon: '🔍',
    title: '사전준비',
    items: [
      {
        id: 'sp1',
        code: '001',
        codeClass: 'pre',
        name: 'SEO 검색노출전략 점검',
        desc: '업종 포지셔닝·경쟁군 분석·메인/서브 키워드 선정·검색 의도 분류',
        price: 200000,
        priceLabel: '20만원',
      },
      {
        id: 'sp2',
        code: '002',
        codeClass: 'pre',
        name: '홈페이지 및 콘텐츠 기획·내용 설계',
        desc: '홈페이지 구조·서비스 설명·소개 문장/CTA·콘텐츠 방향 설계',
        price: 200000,
        priceLabel: '20만원',
      },
    ],
  },
  {
    icon: '⭐',
    title: 'CORE 1',
    items: [
      {
        id: 's1',
        code: 'CORE 1',
        codeClass: 'core',
        name: 'AI 홈페이지 즉시 배포 + 기술적 SEO 셋팅',
        desc: 'ZIP 업로드, 서브도메인 배포, 기본 SEO/측정코드 설정 실습',
        price: 100000,
        priceLabel: '10만원',
      },
    ],
  },
  {
    icon: '🔧',
    title: 'MNT — 도메인 연결 · 유지관리',
    items: [
      {
        id: 's2',
        code: 'MNT 1',
        codeClass: 'mnt',
        name: '독립 도메인 직접 연결 교육',
        desc: 'Route 53 기반 도메인 직접 연결 실습 (40~60분)',
        price: 100000,
        priceLabel: '10만원',
      },
      {
        id: 's3',
        code: 'MNT 2',
        codeClass: 'mnt',
        name: '독립 도메인 연결 지원',
        desc: '1회 직접 연결 지원, 유지보수 의무 없음',
        price: 100000,
        priceLabel: '10만원',
      },
      {
        id: 's4',
        code: 'MNT 3',
        codeClass: 'mnt',
        name: '후속 기술 지원',
        desc: '오픈 후 문제 발생 시 추가 지원/상담 (약 40분)',
        price: 100000,
        priceLabel: '10만원',
      },
      {
        id: 's5',
        code: 'MNT 4',
        codeClass: 'mnt',
        name: '월간 점검 관리',
        desc: '월 1회 백업 + 월 1회 점검/보고',
        price: 100000,
        priceLabel: '월 10만원',
      },
    ],
  },
  {
    icon: '💡',
    title: '전략 · 컨설팅',
    items: [
      {
        id: 's6',
        code: '101',
        codeClass: 'str',
        name: '1:1 성장 로드맵 컨설팅',
        desc: '검색 현황, 경쟁 분석, SEO 방향, 타겟, 예산별 전략 / 30분 × 3회',
        price: 200000,
        priceLabel: '20만원',
      },
      {
        id: 's7',
        code: '102',
        codeClass: 'str',
        name: 'SEO · 마케팅 전략 정리',
        desc: '로드맵이 있는 고객 대상, SEO 및 예산별 전략 1회 정리',
        price: 100000,
        priceLabel: '10만원',
      },
    ],
  },
  {
    icon: '⭐',
    title: 'CORE 2',
    items: [
      {
        id: 's8',
        code: 'CORE 2',
        codeClass: 'core',
        name: '구글 · 메타 광고 고급 세팅 교육',
        desc: '전환, 픽셀, 캠페인 구조, 타겟/예산 설정 등 실전 교육',
        price: 500000,
        priceLabel: '50만원',
      },
      {
        id: 's9',
        code: '201',
        codeClass: 'ads',
        name: '광고 실행 준비 패키지',
        desc: '총 5회, 광고 소재 5종 제작 포함',
        price: 1000000,
        priceLabel: '100만원',
      },
    ],
  },
  {
    icon: '⭐',
    title: 'CORE 3',
    items: [
      {
        id: 's10',
        code: 'CORE 3',
        codeClass: 'core',
        name: '인스타 · 네이버 자동화 교육',
        desc: '기존 콘텐츠가 정리된 고객 대상 자동화 실습',
        price: 300000,
        priceLabel: '30만원',
      },
    ],
  },
];

// Flat lookup: service key → SvcItem (used by Phase 4 wizard sync + result rendering)
const SVC_LOOKUP: Record<string, SvcItem> = (() => {
  const map: Record<string, SvcItem> = {};
  SERVICE_GROUPS.forEach(g => g.items.forEach(it => { map[it.id] = it; }));
  return map;
})();

const PACKAGES: PkgCard[] = [
  {
    id: 'basic',
    tier: 'Basic',
    name: '기본 패키지',
    price: '100만원',
    duration: '3~4주 완성',
    includes: [
      '1:1 성장 로드맵 컨설팅 (30분 × 3회)',
      'SEO 전략 정리',
      'AI 홈페이지 즉시 배포 교육',
      '독립 도메인 연결 교육',
      'SNS 자동화 기초 교육',
    ],
    tags: ['Z1 · Z2 · A · B 최적 시작점'],
  },
  {
    id: 'standard',
    featured: true,
    tier: 'Standard',
    name: '표준 패키지',
    price: '150만원',
    duration: '4~6주 완성',
    includes: [
      '기본 패키지 전체 포함',
      '구글·메타 광고 고급 세팅 교육',
      'GA4 · GTM · 픽셀 세팅',
      '캠페인 구조 · 타겟·예산 컨설팅',
    ],
    tags: ['SEO → 광고 풀 셋업 완성'],
  },
  {
    id: 'extended',
    tier: 'Extended',
    name: '확장 패키지',
    price: '200~300만원',
    duration: '5~8주 완성',
    includes: [
      '표준 패키지 전체 포함',
      '광고 소재 5종 제작 포함',
      '광고 즉시 실행 준비 완성',
    ],
    tags: ['상태 C · 광고 올인원'],
  },
];

// ============================================================================
// Mobile data (Phase 1 — 모바일 JS 전용)
// ============================================================================

const EDU_SECTIONS: EduSection[] = [
  {
    id: 'edu-pre',
    label: '사전준비',
    icon: '🔍',
    highlight: false,
    cards: [
      {
        code: '001',
        codeType: 'pre',
        cat: 'Pre-launch',
        name: 'SEO 검색노출전략 점검',
        price: '20만원',
        tags: ['#업종분석', '#키워드전략', '#경쟁군분석'],
        desc: '홈페이지 제작 전 업종·키워드·경쟁군을 분석해 검색 전략을 먼저 잡습니다.',
      },
      {
        code: '002',
        codeType: 'pre',
        cat: 'Pre-launch',
        name: '홈페이지 및 콘텐츠 기획·내용 설계',
        price: '20만원',
        tags: ['#메뉴구조', '#CTA작성', '#콘텐츠기획'],
        desc: '홈페이지에 담을 내용의 구조와 문장을 설계합니다.',
      },
    ],
  },
  {
    id: 'edu-core1',
    label: 'CORE 1',
    icon: '⭐',
    highlight: true,
    cards: [
      {
        code: 'CORE 1',
        codeType: 'core',
        cat: 'Deployment',
        name: 'AI 홈페이지 즉시 배포 + 기술적 SEO 셋팅',
        price: '10만원',
        tags: ['#즉시배포', '#서치콘솔', '#GA4연동'],
        desc: 'AI 홈페이지를 배포하고 Search Console·GA4·네이버까지 한 번에 세팅합니다.',
      },
    ],
  },
  {
    id: 'edu-core2',
    label: 'CORE 2',
    icon: '⭐',
    highlight: true,
    cards: [
      {
        code: 'CORE 2',
        codeType: 'core',
        cat: 'Paid Ads',
        name: '구글·메타 광고 고급 세팅 교육',
        price: '50만원',
        tags: ['#픽셀', '#GA4', '#캠페인'],
        desc: '픽셀·전환 추적 설정부터 캠페인 구조 설계까지 실전 교육입니다.',
      },
      {
        code: '201',
        codeType: 'ads',
        cat: 'Ads Package',
        name: '광고 실행 준비 패키지',
        price: '100만원',
        tags: ['#AI소재', '#5회'],
        desc: 'AI 도구로 소재 5종 제작, 5회 진행 후 바로 광고 집행 가능합니다.',
      },
    ],
  },
  {
    id: 'edu-core3',
    label: 'CORE 3',
    icon: '⭐',
    highlight: true,
    cards: [
      {
        code: 'CORE 3',
        codeType: 'core',
        cat: 'Automation',
        name: '인스타·네이버 자동화 교육',
        price: '30만원',
        tags: ['#노코드', '#자동화'],
        desc: '노코드 툴로 SNS 게시·알림·운영을 자동화하는 구조를 만듭니다.',
      },
    ],
  },
  {
    id: 'edu-mnt',
    label: 'MNT',
    icon: '🔧',
    highlight: false,
    cards: [
      {
        code: 'MNT 1',
        codeType: 'mnt',
        cat: 'Maintenance',
        name: '독립 도메인 직접 연결 교육',
        price: '10만원',
        tags: ['#Route53', '#DNS'],
        desc: '브랜드 도메인을 직접 연결하는 방법을 익힙니다.',
      },
      {
        code: 'MNT 2',
        codeType: 'mnt',
        cat: 'Maintenance',
        name: '독립 도메인 연결 지원',
        price: '10만원',
        tags: ['#1회대행'],
        desc: '직접 진행하기 어려울 경우 1회 대행 지원합니다.',
      },
      {
        code: 'MNT 3',
        codeType: 'mnt',
        cat: 'Maintenance',
        name: '후속 기술 지원',
        price: '10만원',
        tags: ['#오픈후관리'],
        desc: '오픈 후 문제 발생 시 빠른 기술 지원을 제공합니다.',
      },
      {
        code: 'MNT 4',
        codeType: 'mnt',
        cat: 'Maintenance',
        name: '월간 점검 관리',
        price: '월 10만원',
        tags: ['#월정기관리', '#백업'],
        desc: '월 1회 백업 및 상태 점검 보고서를 제공합니다.',
      },
    ],
  },
  {
    id: 'edu-str',
    label: '전략 · 컨설팅',
    icon: '💡',
    highlight: false,
    cards: [
      {
        code: '101',
        codeType: 'str',
        cat: 'Consulting',
        name: '1:1 성장 로드맵 컨설팅',
        price: '20만원',
        tags: ['#맞춤전략', '#로드맵'],
        desc: '현재 상태와 예산을 기반으로 단계별 실행 로드맵을 설계합니다.',
      },
      {
        code: '102',
        codeType: 'str',
        cat: 'Strategy',
        name: 'SEO 전략 정리·마케팅 방향 수립',
        price: '10만원',
        tags: ['#검색유입', '#키워드'],
        desc: '페이지 구조와 키워드 전략을 SEO 관점에서 재정비합니다.',
      },
    ],
  },
];

const WIZ_STEPS: WizStep[] = [
  {
    cat: '사전준비',
    icon: '🔍',
    isCore: false,
    optionType: 'pre',
    desc: '홈페이지 제작 전, 검색 전략과 콘텐츠 구조를 먼저 잡는 단계입니다.',
    services: [
      { key: 'sp1', code: '001', codeType: 'pre', label: 'SEO 검색노출전략 점검', price: 200000, priceStr: '20만원' },
      { key: 'sp2', code: '002', codeType: 'pre', label: '홈페이지 및 콘텐츠 기획·내용 설계', price: 200000, priceStr: '20만원' },
    ],
  },
  {
    cat: 'CORE 1',
    icon: '⭐',
    isCore: true,
    optionType: 'core1',
    desc: 'AI 홈페이지를 실제 웹에 올리고 기술적 SEO까지 한 번에 완성하는 핵심 교육입니다.',
    services: [
      { key: 's1', code: 'CORE 1', codeType: 'core', label: 'AI 홈페이지 즉시 배포 + 기술적 SEO 셋팅', price: 100000, priceStr: '10만원' },
    ],
  },
  {
    cat: 'MNT — 도메인·유지관리',
    icon: '🔧',
    isCore: false,
    optionType: 'general',
    desc: '독립 도메인 연결부터 월간 점검까지, 사이트 운영을 이어가는 서비스입니다.',
    services: [
      { key: 's2', code: 'MNT 1', codeType: 'mnt', label: '독립 도메인 직접 연결 교육', price: 100000, priceStr: '10만원' },
      { key: 's3', code: 'MNT 2', codeType: 'mnt', label: '독립 도메인 연결 지원', price: 100000, priceStr: '10만원' },
      { key: 's4', code: 'MNT 3', codeType: 'mnt', label: '후속 기술 지원', price: 100000, priceStr: '10만원' },
      { key: 's5', code: 'MNT 4', codeType: 'mnt', label: '월간 점검 관리', price: 100000, priceStr: '월 10만원', monthly: true },
    ],
  },
  {
    cat: '전략 · 컨설팅',
    icon: '💡',
    isCore: false,
    optionType: 'general',
    desc: '검색 유입 구조와 마케팅 로드맵을 설계하는 단계입니다.',
    services: [
      { key: 's6', code: '101', codeType: 'str', label: '1:1 성장 로드맵 컨설팅', price: 200000, priceStr: '20만원' },
      { key: 's7', code: '102', codeType: 'str', label: 'SEO · 마케팅 전략 정리', price: 100000, priceStr: '10만원' },
    ],
  },
  {
    cat: 'CORE 2',
    icon: '⭐',
    isCore: true,
    optionType: 'general',
    desc: '구글·메타 광고 구조를 직접 세팅하고 데이터를 읽는 핵심 실습 교육입니다.',
    services: [
      { key: 's8', code: 'CORE 2', codeType: 'core', label: '구글 · 메타 광고 고급 세팅 교육', price: 500000, priceStr: '50만원' },
    ],
  },
  {
    cat: '광고 실행 준비',
    icon: '🎯',
    isCore: false,
    optionType: 'general',
    desc: 'AI 도구로 소재를 제작하고 광고를 바로 집행할 수 있는 상태로 만드는 패키지입니다.',
    services: [
      { key: 's9', code: '201', codeType: 'ads', label: '광고 실행 준비 패키지', price: 1000000, priceStr: '100만원' },
    ],
  },
  {
    cat: 'CORE 3',
    icon: '⭐',
    isCore: true,
    optionType: 'general',
    desc: '콘텐츠를 한 번 만들면 여러 채널에 자동으로 올라가는 구조를 만드는 핵심 교육입니다.',
    services: [
      { key: 's10', code: 'CORE 3', codeType: 'core', label: '인스타 · 네이버 자동화 교육', price: 300000, priceStr: '30만원' },
    ],
  },
];

// ============================================================================
// Scoped CSS (populated in Phase 9-10)
// ============================================================================

const COURSE_CSS = `
/* ═══════════════════════════════════════════
   v5 scoped tokens
═══════════════════════════════════════════ */
.aiv5-page {
  --accent: #C4A8F5;
  --accent-dark: #8B6FD4;
  --accent-deep: #6D28D9;
  --accent-mid: #9BB8F8;
  --accent-soft: rgba(196,168,245,.13);
  --accent-line: rgba(139,111,212,.22);
  --text: #0A0614;
  --text-2: #374151;
  --text-3: #6B7280;
  --text-4: #9CA3AF;
  --bg: #FFFFFF;
  --bg-soft: #F9FAFB;
  --line: #E5E7EB;
  --line-soft: #F3F4F6;
  --r-sm: 10px; --r-md: 16px; --r-lg: 22px; --r-xl: 28px; --r-2xl: 36px;
  --sh-sm: 0 2px 8px rgba(10,6,20,.05), 0 0 0 1px rgba(10,6,20,.03);
  --sh-md: 0 8px 24px rgba(10,6,20,.07), 0 2px 6px rgba(10,6,20,.04);
  --sh-lg: 0 24px 60px rgba(10,6,20,.10), 0 6px 16px rgba(10,6,20,.05);
  --sh-accent: 0 12px 32px rgba(139,111,212,.22);
  --aiv5-font-en: 'Plus Jakarta Sans', sans-serif;
  --aiv5-font-ko: 'Noto Sans KR', sans-serif;

  font-family: var(--aiv5-font-ko);
  color: var(--text);
  max-width: 1140px;
  margin: 0 auto;
  padding: 72px 28px 140px;
  box-sizing: border-box;
}
.aiv5-page *, .aiv5-page *::before, .aiv5-page *::after { box-sizing: border-box; }

/* ═══════════════════════════════════════════
   BUTTONS
═══════════════════════════════════════════ */
.aiv5-btn {
  font-family: var(--aiv5-font-ko); font-weight: 700; font-size: 14px;
  padding: 12px 22px; border-radius: var(--r-md); border: none; cursor: pointer;
  transition: transform .15s ease, box-shadow .15s ease;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
}
.aiv5-btn:hover { transform: translateY(-2px); }
.aiv5-btn-primary {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
  color: white; box-shadow: var(--sh-accent);
}
.aiv5-btn-primary:hover { box-shadow: 0 16px 40px rgba(109,40,217,.28); }
.aiv5-btn-ghost {
  background: white; color: var(--text-2); border: 1.5px solid var(--line);
  box-shadow: var(--sh-sm);
}
.aiv5-btn-block { width: 100%; justify-content: center; }

/* ═══════════════════════════════════════════
   HERO
═══════════════════════════════════════════ */
.aiv5-hero {
  display: grid; grid-template-columns: 1.1fr .9fr;
  gap: 20px; margin: 28px 0 80px;
}
.aiv5-hero-left {
  background: linear-gradient(145deg, rgba(196,168,245,.08) 0%, rgba(255,255,255,0) 60%),
              rgba(255,255,255,.92);
  border: 1px solid rgba(196,168,245,.2);
  border-radius: var(--r-2xl); padding: 44px 44px 40px;
  box-shadow: var(--sh-md);
  position: relative; overflow: hidden;
}
.aiv5-hero-left::before {
  content: ''; position: absolute; top: -60px; right: -60px;
  width: 200px; height: 200px; border-radius: 50%;
  background: radial-gradient(circle, rgba(196,168,245,.22), transparent 65%);
  pointer-events: none;
}
.aiv5-eyebrow {
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 700;
  letter-spacing: .1em; text-transform: uppercase; color: var(--accent-dark);
  display: block; margin-bottom: 16px;
}
.aiv5-hero-h1 {
  font-size: clamp(30px,4.5vw,48px); font-weight: 800;
  letter-spacing: -2px; line-height: 1.1; margin-bottom: 16px; color: var(--text);
}
.aiv5-hero-h1 em { font-style: normal; color: var(--accent-dark); }
.aiv5-hero-desc { font-size: 16px; color: var(--text-3); line-height: 1.8; margin-bottom: 28px; }
.aiv5-hero-btns { display: flex; gap: 12px; flex-wrap: wrap; }

.aiv5-hero-right {
  background: rgba(255,255,255,.94); border: 1px solid var(--line);
  border-radius: var(--r-2xl); padding: 28px;
  box-shadow: var(--sh-sm);
  display: flex; flex-direction: column; gap: 12px;
}
.aiv5-hero-right-title {
  font-size: 13px; font-weight: 800; color: var(--text-2);
  font-family: var(--aiv5-font-en); letter-spacing: -.2px; margin-bottom: 4px;
}
.aiv5-instructor-card {
  display: flex; gap: 14px; align-items: flex-start;
  background: var(--bg-soft); border: 1px solid var(--line-soft);
  border-radius: var(--r-lg); padding: 16px;
  transition: border-color .2s;
}
.aiv5-instructor-card:hover { border-color: var(--accent-line); }
.aiv5-instructor-avatar {
  width: 42px; height: 42px; border-radius: 14px;
  display: grid; place-items: center; flex-shrink: 0;
  font-family: var(--aiv5-font-en); font-size: 16px; font-weight: 800; color: white;
}
.aiv5-instructor-avatar.av-philo {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
  box-shadow: 0 4px 12px rgba(109,40,217,.3);
}
.aiv5-instructor-avatar.av-jin {
  background: linear-gradient(135deg, #475569, #1e293b);
  box-shadow: 0 4px 12px rgba(30,41,59,.25);
}
.aiv5-instructor-info { flex: 1; min-width: 0; }
.aiv5-instructor-name {
  font-size: 14px; font-weight: 800; color: var(--text);
  margin-bottom: 8px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.aiv5-instructor-role {
  font-family: var(--aiv5-font-en); font-size: 10px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--accent-dark); background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  padding: 2px 8px; border-radius: 999px;
}
.aiv5-instructor-list {
  list-style: none; display: flex; flex-direction: column; gap: 5px;
  padding: 0; margin: 0;
}
.aiv5-instructor-list li {
  font-size: 11px; color: var(--text-3); line-height: 1.6;
  display: flex; align-items: flex-start; gap: 6px;
}
.aiv5-instructor-list li::before {
  content: '—'; color: var(--accent); font-weight: 700;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════
   SECTION + STEP BADGE
═══════════════════════════════════════════ */
.aiv5-section { margin-bottom: 96px; }
.aiv5-section-head { margin-bottom: 32px; }
.aiv5-section-title {
  font-size: clamp(26px,4vw,36px); font-weight: 800;
  letter-spacing: -1.2px; line-height: 1.18; color: var(--text);
}
.aiv5-section-sub { font-size: 15px; color: var(--text-3); line-height: 1.8; margin-top: 10px; }
.aiv5-step-badge {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: var(--aiv5-font-en); font-size: 12px; font-weight: 800;
  color: var(--accent-dark); background: var(--accent-soft);
  border: 1px solid var(--accent-line); border-radius: 999px;
  padding: 5px 14px; margin-bottom: 14px;
}
.aiv5-step-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.aiv5-pc-notice {
  display: flex; align-items: center; gap: 10px;
  margin-top: 14px; padding: 12px 16px;
  background: var(--bg-soft); border: 1px dashed var(--line);
  border-radius: var(--r-md);
  font-size: 13px; color: var(--text-3); line-height: 1.6;
}
.aiv5-pc-notice-icon { font-size: 16px; }

/* ═══════════════════════════════════════════
   STEP 1 — PRESETS + DIAGNOSIS
═══════════════════════════════════════════ */
.aiv5-preset-row {
  display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px;
}
.aiv5-preset-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: white; border: 1.5px solid var(--line);
  border-radius: var(--r-md); padding: 9px 16px;
  font: inherit; font-size: 13px; font-weight: 600; color: var(--text-2);
  cursor: pointer; transition: all .18s ease;
}
.aiv5-preset-btn:hover { border-color: var(--accent-line); color: var(--accent-dark); }
.aiv5-preset-btn.active {
  background: var(--accent-soft); border-color: var(--accent);
  color: var(--accent-dark); box-shadow: 0 0 0 3px rgba(196,168,245,.15);
}
.aiv5-preset-icon { font-size: 16px; }

.aiv5-diagnosis-layout {
  display: grid; grid-template-columns: 340px 1fr; gap: 20px;
}
.aiv5-state-panel {
  background: white; border: 1px solid var(--line);
  border-radius: var(--r-xl); padding: 20px;
  box-shadow: var(--sh-sm);
}
.aiv5-state-card {
  width: 100%; text-align: left;
  background: white; border: 1.5px solid var(--line);
  border-radius: var(--r-lg); padding: 13px 14px;
  display: grid; grid-template-columns: 40px 1fr 20px;
  gap: 12px; align-items: center;
  cursor: pointer; transition: all .18s ease;
  margin-bottom: 8px;
  font: inherit;
}
.aiv5-state-card:last-child { margin-bottom: 0; }
.aiv5-state-card:hover {
  border-color: var(--accent-line);
  background: rgba(196,168,245,.04);
  transform: translateX(3px);
}
.aiv5-state-card.active {
  border-color: var(--accent);
  background: linear-gradient(135deg, rgba(196,168,245,.1), rgba(255,255,255,.98));
  box-shadow: 0 0 0 3px rgba(196,168,245,.14);
}
.aiv5-state-icon {
  width: 40px; height: 40px; border-radius: 13px;
  display: grid; place-items: center;
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 800;
}
.aiv5-state-icon.z1 { background: rgba(239,68,68,.1); color: #DC2626; }
.aiv5-state-icon.z2 { background: rgba(245,158,11,.1); color: #B45309; }
.aiv5-state-icon.sA { background: var(--accent-soft); color: var(--accent-dark); }
.aiv5-state-icon.sB { background: rgba(100,116,139,.1); color: #475569; }
.aiv5-state-icon.sC { background: rgba(16,185,129,.1); color: #059669; }
.aiv5-state-text strong { display: block; font-size: 13px; font-weight: 700; line-height: 1.4; color: var(--text); }
.aiv5-state-text span { font-size: 11px; color: var(--text-3); margin-top: 3px; display: block; }
.aiv5-state-arrow { color: var(--text-4); font-size: 18px; transition: color .18s; }
.aiv5-state-card.active .aiv5-state-arrow { color: var(--accent-dark); }

.aiv5-result-panel {
  background: white; border: 1px solid var(--line);
  border-radius: var(--r-xl); overflow: hidden;
  box-shadow: var(--sh-sm);
  min-height: 460px;
  display: flex; flex-direction: column;
}
.aiv5-result-empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  text-align: center; padding: 48px;
}
.aiv5-result-empty-inner {
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}
.aiv5-result-empty-icon {
  width: 56px; height: 56px; border-radius: 18px;
  background: var(--bg-soft); border: 1px solid var(--line);
  display: grid; place-items: center; font-size: 24px;
}
.aiv5-result-empty strong { font-size: 17px; color: var(--text-2); }
.aiv5-result-empty p { font-size: 13px; color: var(--text-3); line-height: 1.7; max-width: 260px; }

.aiv5-result-body {
  display: flex; flex-direction: column; height: 100%;
  animation: aiv5FadeSlideIn .3s ease;
}
@keyframes aiv5FadeSlideIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.aiv5-result-top { padding: 28px 28px 0; }
.aiv5-result-kicker { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.aiv5-kicker-pill {
  display: inline-flex; align-items: center; gap: 6px;
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 700;
  padding: 5px 11px; border-radius: 999px;
  background: var(--accent-soft); color: var(--accent-dark);
  border: 1px solid var(--accent-line);
}
.aiv5-result-h { font-size: 22px; font-weight: 800; letter-spacing: -.8px; margin-bottom: 8px; color: var(--text); }
.aiv5-result-desc { font-size: 14px; color: var(--text-3); line-height: 1.75; }

.aiv5-result-meta {
  margin: 18px 28px 0;
  display: flex; gap: 10px; flex-wrap: wrap;
}
.aiv5-meta-chip {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--text-3);
  background: var(--bg-soft); border: 1px solid var(--line);
  padding: 6px 12px; border-radius: 999px;
}

.aiv5-route-steps {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 10px; padding: 20px 28px;
}
.aiv5-route-step-card {
  background: var(--bg-soft); border: 1px solid var(--line);
  border-radius: var(--r-md); padding: 14px;
  position: relative;
}
.aiv5-route-step-card::after {
  content: '›';
  position: absolute; right: -8px; top: 50%; transform: translateY(-50%);
  width: 16px; height: 16px; display: grid; place-items: center;
  font-size: 16px; color: var(--text-4); font-weight: 700;
}
.aiv5-route-step-card:last-child::after { display: none; }
.aiv5-step-n {
  width: 26px; height: 26px; border-radius: 8px;
  background: var(--accent-soft); color: var(--accent-dark);
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 800;
  display: grid; place-items: center; margin-bottom: 10px;
}
.aiv5-route-step-card strong { display: block; font-size: 13px; font-weight: 700; margin-bottom: 5px; color: var(--text); }
.aiv5-route-step-card p { font-size: 11px; color: var(--text-3); line-height: 1.6; }

.aiv5-result-estimate {
  margin: 0 28px 28px;
  background: var(--bg-soft); border: 1px solid var(--line);
  border-radius: var(--r-lg); overflow: hidden;
}
.aiv5-estimate-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--line);
}
.aiv5-estimate-label { font-size: 11px; font-weight: 700; color: var(--text-3); font-family: var(--aiv5-font-en); letter-spacing: .06em; text-transform: uppercase; }
.aiv5-estimate-total { font-family: var(--aiv5-font-en); font-size: 18px; font-weight: 800; color: var(--accent-dark); }
.aiv5-estimate-rows { padding: 8px 0; }
.aiv5-estimate-row {
  display: flex; justify-content: space-between;
  padding: 8px 16px; font-size: 13px;
  border-bottom: 1px solid var(--line-soft);
}
.aiv5-estimate-row:last-child { border-bottom: none; }
.aiv5-estimate-row span:last-child { font-family: var(--aiv5-font-en); font-weight: 700; }

.aiv5-result-cta {
  margin: 0 28px 28px; display: flex; justify-content: space-between;
  align-items: center; gap: 16px; flex-wrap: wrap;
}
.aiv5-result-cta-note { font-size: 13px; color: var(--text-3); line-height: 1.65; max-width: 280px; flex: 1; min-width: 200px; }

/* ═══════════════════════════════════════════
   STEP 2 — MODULES / ACCORDION
═══════════════════════════════════════════ */
.aiv5-accordion { display: flex; flex-direction: column; gap: 10px; margin-top: 32px; }

.aiv5-acc-category-header {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 20px;
  background: var(--bg-soft); border: 1px solid var(--line);
  border-radius: var(--r-lg); margin-top: 10px; margin-bottom: 4px;
}
.aiv5-acc-category-header.is-core {
  background: linear-gradient(135deg, rgba(139,111,212,.1), rgba(109,40,217,.06));
  border-color: var(--accent-line);
}
.aiv5-acc-category-header:first-child { margin-top: 0; }
.aiv5-acc-category-icon { font-size: 20px; flex-shrink: 0; }
.aiv5-acc-category-header strong {
  display: block; font-size: 13px; font-weight: 800; color: var(--text-2);
  margin-bottom: 2px;
}
.aiv5-acc-category-header.is-core strong { color: var(--accent-dark); }
.aiv5-acc-category-header span { font-size: 12px; color: var(--text-3); line-height: 1.5; }

.aiv5-acc-item {
  background: white; border: 1.5px solid var(--line);
  border-radius: var(--r-xl); overflow: hidden;
  box-shadow: var(--sh-sm);
  transition: border-color .22s ease, box-shadow .22s ease;
}
.aiv5-acc-item.open {
  border-color: rgba(196,168,245,.45);
  box-shadow: 0 0 0 3px rgba(196,168,245,.1), var(--sh-md);
}

.aiv5-acc-trigger {
  width: 100%; background: none; border: none; cursor: pointer;
  display: grid; grid-template-columns: 52px 1fr auto;
  gap: 18px; align-items: center;
  padding: 22px 26px; text-align: left;
  transition: background .18s;
  font: inherit;
}
.aiv5-acc-trigger:hover { background: rgba(196,168,245,.04); }
.aiv5-acc-item.open .aiv5-acc-trigger { background: rgba(196,168,245,.05); }

.aiv5-acc-num {
  width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
  background: var(--bg-soft); border: 1px solid var(--line);
  display: grid; place-items: center;
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 800;
  color: var(--text-3);
  transition: background .22s, color .22s, border-color .22s;
}
.aiv5-acc-item.open .aiv5-acc-num {
  background: var(--accent-soft); border-color: var(--accent-line);
  color: var(--accent-dark);
}
.aiv5-acc-num.is-core {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
  color: white; border-color: transparent;
  font-size: 10px; letter-spacing: -.3px;
  box-shadow: 0 4px 12px rgba(109,40,217,.3);
}
.aiv5-acc-item.open .aiv5-acc-num.is-core {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
  color: white;
}
.aiv5-acc-num.is-mnt {
  background: rgba(100,116,139,.12);
  color: #475569; border-color: rgba(100,116,139,.2);
  font-size: 10px; letter-spacing: -.3px;
}
.aiv5-acc-item.open .aiv5-acc-num.is-mnt {
  background: rgba(100,116,139,.18);
  color: #334155; border-color: rgba(100,116,139,.3);
}

.aiv5-acc-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.aiv5-acc-code-chip {
  display: inline-flex; align-items: center;
  font-family: var(--aiv5-font-en); font-size: 10px; font-weight: 800;
  letter-spacing: .04em; padding: 2px 8px; border-radius: 999px;
  margin-bottom: 3px; width: fit-content;
}
.aiv5-acc-code-chip.core {
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
  color: white;
}
.aiv5-acc-code-chip.mnt {
  background: rgba(100,116,139,.12); color: #475569;
  border: 1px solid rgba(100,116,139,.2);
}
.aiv5-acc-code-chip.pre {
  background: rgba(16,185,129,.1); color: #059669;
  border: 1px solid rgba(16,185,129,.2);
}
.aiv5-acc-code-chip.str {
  background: rgba(245,158,11,.1); color: #B45309;
  border: 1px solid rgba(245,158,11,.2);
}
.aiv5-acc-code-chip.ads {
  background: rgba(239,68,68,.1); color: #DC2626;
  border: 1px solid rgba(239,68,68,.2);
}
.aiv5-acc-name {
  font-size: 17px; font-weight: 800; letter-spacing: -.5px;
  color: var(--text); line-height: 1.3;
}
.aiv5-acc-tagrow { display: flex; gap: 7px; flex-wrap: wrap; margin-top: 6px; }
.aiv5-acc-tag {
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 600;
  padding: 3px 9px; border-radius: 999px;
  background: var(--bg-soft); border: 1px solid var(--line);
  color: var(--text-3);
}
.aiv5-acc-item.open .aiv5-acc-tag { background: white; }

.aiv5-acc-right {
  display: flex; align-items: center; gap: 16px; flex-shrink: 0;
}
.aiv5-acc-price-chip {
  font-family: var(--aiv5-font-en); font-size: 13px; font-weight: 800;
  color: var(--text-2); white-space: nowrap;
}
.aiv5-acc-item.open .aiv5-acc-price-chip { color: var(--accent-dark); }
.aiv5-acc-chevron {
  width: 30px; height: 30px; border-radius: 999px;
  background: var(--bg-soft); border: 1px solid var(--line);
  display: grid; place-items: center;
  color: var(--text-3); font-size: 14px;
  transition: transform .3s cubic-bezier(.4,0,.2,1), background .2s, color .2s;
}
.aiv5-acc-item.open .aiv5-acc-chevron {
  transform: rotate(180deg);
  background: var(--accent-soft); border-color: var(--accent-line);
  color: var(--accent-dark);
}

.aiv5-acc-body {
  display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows .38s cubic-bezier(.4,0,.2,1);
}
.aiv5-acc-item.open .aiv5-acc-body { grid-template-rows: 1fr; }
.aiv5-acc-body-inner { overflow: hidden; }
.aiv5-acc-body-content {
  padding: 0 26px 32px;
  border-top: 1px solid var(--line-soft);
  display: grid; grid-template-columns: 1fr 1fr; gap: 32px;
}
.aiv5-acc-desc {
  font-size: 15px; color: var(--text-3); line-height: 1.9;
  margin-bottom: 22px;
}
.aiv5-acc-who-label {
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase;
  color: var(--accent-dark); margin-bottom: 10px; display: block;
}
.aiv5-acc-who-list {
  display: flex; flex-direction: column; gap: 7px;
}
.aiv5-acc-who-item {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 14px; color: var(--text-2); line-height: 1.55;
}
.aiv5-acc-who-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent); flex-shrink: 0; margin-top: 7px;
}
.aiv5-acc-outcomes {
  background: var(--bg-soft); border: 1px solid var(--line);
  border-radius: var(--r-lg); padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
}
.aiv5-acc-outcome-group h5 {
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 700;
  letter-spacing: .07em; text-transform: uppercase;
  color: var(--text-4); margin: 0 0 10px;
}
.aiv5-acc-learn-list { display: flex; flex-direction: column; gap: 8px; }
.aiv5-acc-learn-item {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 13px; color: var(--text-2); line-height: 1.55;
}
.aiv5-acc-learn-item::before {
  content: '✓'; color: var(--accent-dark); font-weight: 800;
  font-family: var(--aiv5-font-en); flex-shrink: 0; margin-top: 1px; font-size: 12px;
}
.aiv5-acc-divider-h { height: 1px; background: var(--line); }
.aiv5-acc-info-row {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.aiv5-acc-info-chip {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: var(--text-3);
  background: white; border: 1px solid var(--line);
  padding: 5px 11px; border-radius: 999px;
}

/* ═══════════════════════════════════════════
   STEP 3 — SERVICES + STICKY SIDEBAR
═══════════════════════════════════════════ */
.aiv5-services-layout {
  display: grid; grid-template-columns: 1fr 300px; gap: 20px;
  align-items: start;
}
.aiv5-service-groups { display: flex; flex-direction: column; gap: 16px; }
.aiv5-service-group {
  background: white; border: 1px solid var(--line);
  border-radius: var(--r-xl); padding: 22px;
  box-shadow: var(--sh-sm);
}
.aiv5-service-group.is-core {
  border-color: var(--accent-line);
  background: linear-gradient(135deg, rgba(196,168,245,.06), rgba(255,255,255,1));
}
.aiv5-sg-head { margin-bottom: 16px; }
.aiv5-sg-head h3 { font-size: 17px; font-weight: 800; letter-spacing: -.4px; margin: 0 0 4px; color: var(--text); }
.aiv5-sg-head p { font-size: 13px; color: var(--text-3); margin: 0; }
.aiv5-service-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
}
.aiv5-svc-item {
  background: var(--bg-soft); border: 1.5px solid var(--line);
  border-radius: var(--r-lg); padding: 14px 15px;
  cursor: pointer; transition: all .16s ease;
  display: flex; flex-direction: column; gap: 8px;
  user-select: none; text-align: left;
  font: inherit;
}
.aiv5-svc-item:hover { border-color: var(--accent-line); background: rgba(196,168,245,.04); }
.aiv5-svc-item.checked {
  border-color: var(--accent); background: var(--accent-soft);
  box-shadow: 0 0 0 3px rgba(196,168,245,.12);
}
.aiv5-svc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.aiv5-svc-cb {
  width: 20px; height: 20px; border-radius: 6px;
  border: 1.5px solid var(--line); background: white; flex-shrink: 0;
  display: grid; place-items: center;
  font-size: 11px; color: transparent; font-weight: 800;
  transition: all .14s;
}
.aiv5-svc-item.checked .aiv5-svc-cb {
  background: var(--accent-dark); border-color: var(--accent-dark); color: white;
}
.aiv5-svc-price {
  font-family: var(--aiv5-font-en); font-size: 13px; font-weight: 800;
  color: var(--text-2); white-space: nowrap; flex-shrink: 0;
}
.aiv5-svc-item.checked .aiv5-svc-price { color: var(--accent-dark); }
.aiv5-svc-code {
  display: inline-flex; align-items: center;
  font-family: var(--aiv5-font-en); font-size: 10px; font-weight: 800;
  letter-spacing: .04em; padding: 2px 8px; border-radius: 999px;
  width: fit-content;
}
.aiv5-svc-code.core { background: linear-gradient(135deg,var(--accent-dark),var(--accent-deep)); color: white; }
.aiv5-svc-code.mnt  { background: rgba(100,116,139,.12); color: #475569; border:1px solid rgba(100,116,139,.2); }
.aiv5-svc-code.pre  { background: rgba(16,185,129,.1); color: #059669; border:1px solid rgba(16,185,129,.2); }
.aiv5-svc-code.str  { background: rgba(245,158,11,.1); color: #B45309; border:1px solid rgba(245,158,11,.2); }
.aiv5-svc-code.ads  { background: rgba(239,68,68,.1); color: #DC2626; border:1px solid rgba(239,68,68,.2); }
.aiv5-svc-name { font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.35; }
.aiv5-svc-desc { font-size: 12px; color: var(--text-3); line-height: 1.6; }

.aiv5-sticky-sidebar {
  position: sticky; top: 24px;
  background: white; border: 1px solid var(--line);
  border-radius: var(--r-xl); padding: 24px;
  box-shadow: var(--sh-md);
}
.aiv5-ss-title { font-size: 16px; font-weight: 800; letter-spacing: -.3px; margin: 0 0 6px; color: var(--text); }
.aiv5-ss-desc { font-size: 13px; color: var(--text-3); line-height: 1.65; margin: 0 0 18px; }
.aiv5-ss-tags {
  display: flex; flex-wrap: wrap; gap: 7px;
  min-height: 28px; margin-bottom: 16px;
}
.aiv5-ss-tag {
  display: inline-flex; align-items: center;
  font-size: 11px; font-weight: 700;
  background: var(--accent-soft); color: var(--accent-dark);
  border: 1px solid var(--accent-line); border-radius: 999px;
  padding: 4px 10px;
}
.aiv5-ss-empty-hint { font-size: 12px; color: var(--text-4); font-style: italic; }
.aiv5-ss-total-box {
  background: var(--bg-soft); border: 1px solid var(--line);
  border-radius: var(--r-lg); padding: 16px; margin-bottom: 14px;
}
.aiv5-ss-total-label { font-size: 10px; font-weight: 700; color: var(--text-4); letter-spacing: .1em; text-transform: uppercase; font-family: var(--aiv5-font-en); }
.aiv5-ss-total-num {
  font-family: var(--aiv5-font-en); font-size: 32px; font-weight: 800;
  letter-spacing: -1.5px; color: var(--text); margin: 6px 0 4px;
}
.aiv5-ss-total-sub { font-size: 12px; color: var(--text-3); }
.aiv5-ss-actions { display: grid; gap: 10px; }
.aiv5-ss-note {
  margin-top: 14px; padding: 12px 14px;
  background: var(--bg-soft); border: 1px dashed var(--line);
  border-radius: var(--r-md);
  font-size: 12px; color: var(--text-4); line-height: 1.8;
}

/* ═══════════════════════════════════════════
   STEP 4 — PACKAGES
═══════════════════════════════════════════ */
.aiv5-pkg-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
  margin-top: 32px;
}
.aiv5-pkg-card {
  background: white; border: 1.5px solid var(--line);
  border-radius: var(--r-xl); padding: 28px;
  display: flex; flex-direction: column;
  transition: transform .2s ease, box-shadow .2s ease, border-color .2s;
  position: relative;
}
.aiv5-pkg-card:hover { transform: translateY(-4px); box-shadow: var(--sh-md); }
.aiv5-pkg-card.featured {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px rgba(196,168,245,.12), var(--sh-sm);
}
.aiv5-pkg-rec-badge {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700;
  background: var(--accent); color: white;
  padding: 4px 10px; border-radius: 999px;
  margin-bottom: 16px;
  width: fit-content;
}
.aiv5-pkg-tier {
  font-family: var(--aiv5-font-en); font-size: 11px; font-weight: 800;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-4); margin-bottom: 16px;
}
.aiv5-pkg-card.featured .aiv5-pkg-tier { color: var(--accent-dark); }
.aiv5-pkg-name { font-size: 20px; font-weight: 800; letter-spacing: -.5px; margin-bottom: 6px; color: var(--text); }
.aiv5-pkg-price {
  font-family: var(--aiv5-font-en); font-size: 34px; font-weight: 800;
  letter-spacing: -1.5px; color: var(--text); margin-bottom: 4px;
}
.aiv5-pkg-duration { font-size: 13px; color: var(--text-3); margin-bottom: 20px; }
.aiv5-pkg-rule { height: 1px; background: var(--line-soft); margin-bottom: 18px; }
.aiv5-pkg-list { list-style: none; display: flex; flex-direction: column; gap: 9px; flex: 1; padding: 0; margin: 0; }
.aiv5-pkg-list li {
  font-size: 13px; color: var(--text-3);
  display: flex; align-items: flex-start; gap: 9px; line-height: 1.55;
}
.aiv5-pkg-list li::before {
  content: '✓'; color: var(--accent-dark); font-weight: 800;
  font-family: var(--aiv5-font-en); flex-shrink: 0; margin-top: 1px;
}
.aiv5-pkg-tag {
  margin-top: 18px; font-size: 11px; font-weight: 700;
  color: var(--accent-dark); background: var(--accent-soft);
  padding: 7px 14px; border-radius: var(--r-sm); text-align: center;
  font-family: var(--aiv5-font-en); letter-spacing: .03em;
}

.aiv5-pkg-note-row {
  margin-top: 18px; padding: 14px 18px;
  background: var(--bg-soft); border: 1px solid var(--line-soft);
  border-radius: var(--r-md);
}
.aiv5-pkg-note-row p { font-size: 12px; color: var(--text-4); line-height: 1.9; margin: 0; }

/* ═══════════════════════════════════════════
   FINAL CTA
═══════════════════════════════════════════ */
.aiv5-cta-section {
  margin-top: 20px;
}
.aiv5-cta-inner {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  align-items: center;
  background: linear-gradient(135deg, #0A0614 0%, #1a0a3a 60%, #0f0520 100%);
  border-radius: var(--r-2xl);
  padding: 60px 64px;
  position: relative;
  overflow: hidden;
}
.aiv5-cta-inner::before {
  content: ''; position: absolute; top: -80px; right: -80px;
  width: 360px; height: 360px; border-radius: 50%;
  background: radial-gradient(circle, rgba(196,168,245,.18), transparent 65%);
  pointer-events: none;
}
.aiv5-cta-inner::after {
  content: ''; position: absolute; bottom: -60px; left: 200px;
  width: 240px; height: 240px; border-radius: 50%;
  background: radial-gradient(circle, rgba(139,111,212,.12), transparent 65%);
  pointer-events: none;
}
.aiv5-cta-left { position: relative; z-index: 1; }
.aiv5-cta-eyebrow {
  font-family: var(--aiv5-font-en);
  font-size: 11px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
  color: var(--accent);
  display: block; margin-bottom: 16px;
}
.aiv5-cta-title {
  font-size: clamp(26px, 3.5vw, 38px);
  font-weight: 800; letter-spacing: -1.5px;
  line-height: 1.15; color: #fff;
  margin-bottom: 16px;
}
.aiv5-cta-desc {
  font-size: 15px; color: rgba(255,255,255,.55);
  line-height: 1.9; margin-bottom: 36px;
}
.aiv5-cta-btns { display: flex; gap: 12px; flex-wrap: wrap; }
.aiv5-cta-btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
  color: white; font-family: var(--aiv5-font-ko);
  font-size: 15px; font-weight: 700;
  padding: 15px 28px; border-radius: var(--r-md);
  border: none; cursor: pointer;
  box-shadow: 0 12px 32px rgba(139,111,212,.4);
  transition: transform .15s ease, box-shadow .15s ease;
}
.aiv5-cta-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 48px rgba(109,40,217,.45);
}
.aiv5-cta-btn-icon { font-size: 16px; }
.aiv5-cta-btn-ghost {
  display: inline-flex; align-items: center;
  color: rgba(255,255,255,.5);
  font-family: var(--aiv5-font-ko); font-size: 14px; font-weight: 600;
  padding: 15px 20px; border-radius: var(--r-md);
  border: 1.5px solid rgba(255,255,255,.12);
  background: transparent; cursor: pointer;
  transition: color .15s, border-color .15s;
}
.aiv5-cta-btn-ghost:hover { color: rgba(255,255,255,.85); border-color: rgba(255,255,255,.3); }
.aiv5-cta-right { position: relative; z-index: 1; }
.aiv5-cta-card {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: var(--r-xl);
  padding: 28px 32px;
  backdrop-filter: blur(12px);
  display: flex; flex-direction: column; gap: 0;
}
.aiv5-cta-card-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 0;
}
.aiv5-cta-card-row span {
  font-size: 13px; color: rgba(255,255,255,.45);
  flex: 1;
}
.aiv5-cta-card-row strong {
  font-size: 13px; font-weight: 700; color: rgba(255,255,255,.9);
  text-align: right;
}
.aiv5-cta-card-rule { height: 1px; background: rgba(255,255,255,.08); }
.aiv5-cta-card-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.aiv5-cta-card-dot.dot-green  { background: #34D399; box-shadow: 0 0 6px rgba(52,211,153,.6); }
.aiv5-cta-card-dot.dot-purple { background: var(--accent); box-shadow: 0 0 6px rgba(196,168,245,.6); }
.aiv5-cta-card-dot.dot-blue   { background: #60A5FA; box-shadow: 0 0 6px rgba(96,165,250,.6); }

/* ═══════════════════════════════════════════
   STICKY INQUIRY BAR
═══════════════════════════════════════════ */
.aiv5-inq-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: rgba(255,255,255,.96); backdrop-filter: blur(20px);
  border-top: 1px solid var(--line);
  padding: 14px 28px;
  box-shadow: 0 -8px 40px rgba(10,6,20,.08);
  z-index: 200;
  animation: aiv5InqSlideUp .28s cubic-bezier(.4,0,.2,1);
  font-family: var(--aiv5-font-ko);
}
@keyframes aiv5InqSlideUp {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.aiv5-inq-bar-inner {
  max-width: 1140px; margin: 0 auto;
  display: flex; align-items: center; gap: 20px;
}
.aiv5-inq-info { flex: 1; min-width: 0; }
.aiv5-inq-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 5px; min-height: 22px; }
.aiv5-inq-tag {
  font-size: 11px; font-weight: 600;
  background: var(--accent-soft); color: var(--accent-dark);
  border: 1px solid var(--accent-line); border-radius: 999px; padding: 3px 10px;
}
.aiv5-inq-total-row { display: flex; align-items: baseline; gap: 10px; }
.aiv5-inq-label { font-size: 12px; color: var(--text-4); }
.aiv5-inq-amount { font-family: var(--aiv5-font-en); font-size: 22px; font-weight: 800; color: var(--text); }
.aiv5-inq-note { font-size: 11px; color: var(--text-4); }
.aiv5-inq-btn {
  font-family: var(--aiv5-font-ko); font-size: 14px; font-weight: 700;
  background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
  color: white; border: none; border-radius: var(--r-md);
  padding: 13px 26px; cursor: pointer; white-space: nowrap;
  transition: transform .15s, box-shadow .15s;
  box-shadow: var(--sh-accent);
}
.aiv5-inq-btn:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(109,40,217,.28); }

/* ═══════════════════════════════════════════
   MODAL
═══════════════════════════════════════════ */
.aiv5-modal-ov {
  position: fixed; inset: 0;
  background: rgba(10,6,20,.55); backdrop-filter: blur(6px);
  z-index: 300;
  display: none;
  align-items: center; justify-content: center; padding: 24px;
  font-family: var(--aiv5-font-ko);
  color: #0A0614;
}
.aiv5-modal-ov.open { display: flex; }
.aiv5-modal {
  background: white; border-radius: 36px; padding: 36px;
  width: 100%; max-width: 460px; max-height: 92vh; overflow-y: auto;
  position: relative;
  box-shadow: 0 24px 60px rgba(10,6,20,.10), 0 6px 16px rgba(10,6,20,.05);
  border: 1px solid #E5E7EB;
  animation: aiv5ModalIn .25s cubic-bezier(.34,1.56,.64,1);
  box-sizing: border-box;
}
.aiv5-modal *, .aiv5-modal *::before, .aiv5-modal *::after { box-sizing: border-box; }
@keyframes aiv5ModalIn {
  from { opacity: 0; transform: scale(.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.aiv5-modal-x {
  position: absolute; top: 18px; right: 18px;
  background: #F9FAFB; border: 1px solid #E5E7EB; color: #6B7280;
  width: 32px; height: 32px; border-radius: 999px;
  font-size: 18px; line-height: 1; cursor: pointer;
  display: grid; place-items: center; transition: all .15s;
}
.aiv5-modal-x:hover { background: #E5E7EB; color: #0A0614; }
.aiv5-modal-logo {
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 14px;
  color: #8B6FD4; display: block; margin-bottom: 18px;
}
.aiv5-modal-title { font-size: 22px; font-weight: 800; letter-spacing: -.6px; margin-bottom: 6px; color: #0A0614; }
.aiv5-modal-sub { font-size: 13px; color: #6B7280; margin-bottom: 22px; line-height: 1.7; }
.aiv5-modal-summary {
  background: #F9FAFB; border: 1px solid #F3F4F6;
  border-radius: 22px; padding: 14px 16px; margin-bottom: 22px;
}
.aiv5-modal-sum-label { font-size: 10px; font-weight: 700; color: #9CA3AF; letter-spacing: .1em; text-transform: uppercase; font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 10px; display: block; }
.aiv5-modal-sum-item {
  display: flex; justify-content: space-between; gap: 12px;
  font-size: 13px; color: #6B7280; padding: 5px 0;
  border-bottom: 1px solid #F3F4F6;
}
.aiv5-modal-sum-item:last-of-type { border-bottom: none; }
.aiv5-modal-sum-total {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-top: 12px; padding-top: 12px; border-top: 1.5px solid #E5E7EB;
}
.aiv5-modal-sum-total span:first-child { font-size: 13px; font-weight: 600; color: #0A0614; }
.aiv5-modal-sum-total span:last-child {
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 800; color: #8B6FD4;
}
.aiv5-form-row { margin-bottom: 15px; }
.aiv5-form-label { font-size: 12px; font-weight: 600; color: #374151; display: block; margin-bottom: 6px; }
.aiv5-form-label em { color: #8B6FD4; margin-left: 2px; font-style: normal; }
.aiv5-form-ctrl {
  width: 100%; padding: 11px 14px;
  border: 1.5px solid #E5E7EB; border-radius: 16px;
  font: inherit; font-size: 13px; font-family: 'Noto Sans KR', sans-serif;
  color: #0A0614; background: white; outline: none;
  transition: border-color .18s, box-shadow .18s;
}
.aiv5-form-ctrl:focus { border-color: #C4A8F5; box-shadow: 0 0 0 3px rgba(196,168,245,.15); }
textarea.aiv5-form-ctrl { min-height: 82px; resize: vertical; }
.aiv5-form-submit {
  width: 100%; background: linear-gradient(135deg, #8B6FD4, #6D28D9);
  color: white; border: none; border-radius: 16px;
  padding: 14px; font: inherit; font-size: 14px; font-weight: 700; font-family: 'Noto Sans KR', sans-serif;
  cursor: pointer; margin-top: 8px;
  transition: transform .15s, box-shadow .15s;
  box-shadow: 0 12px 32px rgba(139,111,212,.22);
}
.aiv5-form-submit:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(109,40,217,.28); }

/* ═══════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════ */
@media (max-width: 900px) {
  .aiv5-page { padding: 64px 20px 160px; }
  .aiv5-hero {
    grid-template-columns: 1fr;
    margin: 20px 0 56px;
  }
  .aiv5-hero-left { padding: 32px 28px; }
  .aiv5-diagnosis-layout { grid-template-columns: 1fr; }
  .aiv5-services-layout { grid-template-columns: 1fr; }
  .aiv5-sticky-sidebar { position: relative; top: 0; }
  .aiv5-route-steps { grid-template-columns: 1fr 1fr; }
  .aiv5-route-step-card:nth-child(2)::after { display: none; }
  .aiv5-pkg-grid { grid-template-columns: 1fr; }
  .aiv5-cta-inner {
    grid-template-columns: 1fr;
    padding: 44px 36px;
  }
  .aiv5-cta-right { display: none; }
  .aiv5-acc-body-content { grid-template-columns: 1fr; gap: 20px; }
  .aiv5-acc-trigger { grid-template-columns: 44px 1fr; padding: 18px 20px; gap: 14px; }
  .aiv5-acc-right { display: none; }
  .aiv5-acc-name { font-size: 15px; }
  .aiv5-acc-num { width: 44px; height: 44px; border-radius: 13px; font-size: 13px; }
  .aiv5-service-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .aiv5-page { padding: 56px 16px 180px; }
  .aiv5-hero-h1 { font-size: 28px; letter-spacing: -1.2px; }
  .aiv5-hero-left { padding: 28px 22px; }
  .aiv5-route-steps { grid-template-columns: 1fr; }
  .aiv5-route-step-card::after { display: none; }
  .aiv5-cta-inner { padding: 36px 24px; }
  .aiv5-cta-title { font-size: 26px; }
  .aiv5-state-panel { padding: 14px; }
  .aiv5-result-top { padding: 22px 22px 0; }
  .aiv5-result-meta { margin: 14px 22px 0; }
  .aiv5-route-steps { padding: 16px 22px; }
  .aiv5-result-estimate { margin: 0 22px 22px; }
  .aiv5-result-cta { margin: 0 22px 22px; }
  .aiv5-preset-row { gap: 6px; }
  .aiv5-preset-btn { font-size: 12px; padding: 7px 12px; }
  .aiv5-inq-bar { padding: 12px 16px; }
  .aiv5-inq-bar-inner { gap: 10px; }
  .aiv5-inq-btn { padding: 11px 16px; font-size: 13px; }
  .aiv5-inq-amount { font-size: 18px; }
  .aiv5-modal { padding: 28px 22px; border-radius: 24px; }
  .aiv5-section { margin-bottom: 72px; }
}

/* ═══════════════════════════════════════════
   MOBILE JS — Phase 2: Step 1 diag accordion
═══════════════════════════════════════════ */
@media (max-width: 768px) {
  .aiv5-mob-diag-placeholder {
    text-align: center;
    padding: 32px 20px;
    background: var(--bg-soft);
    border: 1px dashed var(--line);
    border-radius: var(--r-lg);
  }
  .aiv5-mob-diag-ph-icon {
    font-size: 28px;
    margin-bottom: 10px;
  }
  .aiv5-mob-diag-ph-text {
    font-size: 13px;
    color: var(--text-3);
    line-height: 1.7;
    margin: 0;
  }

  .aiv5-mob-diag-accordion {
    max-height: 0;
    overflow: hidden;
    transition: max-height .42s cubic-bezier(.4,0,.2,1);
    margin-bottom: 12px;
  }
  .aiv5-mob-diag-accordion.open {
    max-height: 1600px;
  }
  .aiv5-mob-diag-acc-inner {
    background: white;
    border: 1px solid var(--accent-line);
    border-radius: var(--r-xl);
    overflow: hidden;
    box-shadow: var(--sh-sm);
  }

  .aiv5-mob-result-inline .aiv5-result-body {
    opacity: 1;
    transform: none;
    animation: none;
    padding: 0;
  }
  .aiv5-mob-result-inline .aiv5-result-top { padding: 16px 16px 0; }
  .aiv5-mob-result-inline .aiv5-result-meta { margin: 10px 16px 0; }
  .aiv5-mob-result-inline .aiv5-route-steps {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px 16px;
  }
  .aiv5-mob-result-inline .aiv5-result-estimate { margin: 0 16px 14px; }
  .aiv5-mob-result-inline .aiv5-result-cta {
    margin: 0 16px 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .aiv5-mob-result-inline .aiv5-result-cta .aiv5-btn {
    width: 100%;
    justify-content: center;
    font-size: 13px;
    padding: 11px;
  }
  .aiv5-mob-result-inline .aiv5-result-h { font-size: 16px; }
  .aiv5-mob-result-inline .aiv5-result-desc { font-size: 13px; }
  .aiv5-mob-result-inline .aiv5-route-step-card::after { display: none; }
  .aiv5-mob-result-inline .aiv5-route-step-card strong { font-size: 12px; }
  .aiv5-mob-result-inline .aiv5-route-step-card p { font-size: 11px; }

  /* Mobile result choice soft buttons */
  .aiv5-mob-result-choices {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 10px;
  }
  .aiv5-wiz-soft-btn {
    padding: 12px 14px;
    border-radius: var(--r-md);
    font-family: var(--font-ko);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-align: center;
    transition: all .15s;
    border: 1.5px solid var(--line);
    background: white;
    color: var(--text-2);
  }
  .aiv5-wiz-soft-btn:active { transform: scale(.98); }
  .aiv5-wiz-soft-consult {
    background: linear-gradient(135deg, rgba(139,111,212,.1), rgba(109,40,217,.05));
    border-color: var(--accent-line);
    color: var(--accent-deep);
  }
  .aiv5-wiz-soft-skip {
    background: var(--bg-soft);
    color: var(--text-3);
  }

  /* Hide placeholder styling's result-panel on mobile since it's not rendered */
  .aiv5-state-panel { padding: 12px; }
}

/* ═══════════════════════════════════════════
   MOBILE JS — Phase 3: Step 2 edu swipe + cat collapse
═══════════════════════════════════════════ */
@media (max-width: 768px) {
  /* Horizontal swipe edu cards container */
  .aiv5-mob-edu-swipe {
    display: flex;
    flex-direction: column;
    gap: 22px;
    margin-bottom: 28px;
  }
  .aiv5-mob-edu-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .aiv5-mob-edu-section.is-highlight .aiv5-mob-edu-section-head {
    color: var(--accent-dark);
  }
  .aiv5-mob-edu-section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 2px;
  }
  .aiv5-mob-edu-section-icon { font-size: 18px; }
  .aiv5-mob-edu-section-label {
    font-size: 13px;
    font-weight: 800;
    color: var(--text-2);
    letter-spacing: -.2px;
  }
  .aiv5-mob-edu-section.is-highlight .aiv5-mob-edu-section-label {
    color: var(--accent-dark);
  }

  .aiv5-mob-edu-swipe-inner {
    display: flex;
    gap: 12px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding: 4px 0 4px;
    margin: 0 -16px;
    padding-left: 16px;
    padding-right: 16px;
  }
  .aiv5-mob-edu-swipe-inner::-webkit-scrollbar { display: none; }
  .aiv5-mob-edu-swipe-inner {
    scrollbar-width: none;
  }
  .aiv5-mob-edu-swipe-inner .aiv5-mob-edu-card {
    flex: 0 0 82vw;
    max-width: 320px;
    scroll-snap-align: center;
  }
  .aiv5-mob-edu-swipe-inner:has(.aiv5-mob-edu-card:only-child) .aiv5-mob-edu-card {
    flex: 1 1 auto;
    max-width: none;
    width: 100%;
  }

  .aiv5-mob-edu-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: white;
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    box-shadow: var(--sh-sm);
  }
  .aiv5-mob-edu-card.is-core {
    border-color: var(--accent-line);
    background: linear-gradient(135deg, rgba(196,168,245,.06), white);
  }
  .aiv5-mob-edu-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .aiv5-mob-edu-code {
    font-family: var(--font-en);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .05em;
    padding: 3px 8px;
    border-radius: 999px;
  }
  .aiv5-mob-edu-code.core {
    background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
    color: white;
  }
  .aiv5-mob-edu-code.mnt {
    background: rgba(100,116,139,.12);
    color: #475569;
    border: 1px solid rgba(100,116,139,.2);
  }
  .aiv5-mob-edu-code.pre {
    background: rgba(16,185,129,.1);
    color: #059669;
    border: 1px solid rgba(16,185,129,.2);
  }
  .aiv5-mob-edu-code.str {
    background: rgba(245,158,11,.1);
    color: #B45309;
    border: 1px solid rgba(245,158,11,.2);
  }
  .aiv5-mob-edu-code.ads {
    background: rgba(239,68,68,.1);
    color: #DC2626;
    border: 1px solid rgba(239,68,68,.2);
  }
  .aiv5-mob-edu-price {
    font-family: var(--font-en);
    font-size: 13px;
    font-weight: 800;
    color: var(--text-3);
  }
  .aiv5-mob-edu-cat {
    font-family: var(--font-en);
    font-size: 10px;
    font-weight: 700;
    color: var(--text-4);
    letter-spacing: .06em;
    text-transform: uppercase;
  }
  .aiv5-mob-edu-name {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: -.3px;
    line-height: 1.3;
    color: var(--text);
  }
  .aiv5-mob-edu-desc {
    font-size: 12px;
    color: var(--text-3);
    line-height: 1.65;
    flex: 1;
  }
  .aiv5-mob-edu-tags {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    margin-top: 4px;
  }
  .aiv5-mob-edu-tag {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    background: var(--bg-soft);
    border-radius: 999px;
    color: var(--text-3);
  }

  .aiv5-mob-edu-swipe-dots {
    display: flex;
    justify-content: center;
    gap: 5px;
    margin-top: 6px;
  }
  .aiv5-mob-edu-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--line);
    cursor: pointer;
    transition: all .2s;
  }
  .aiv5-mob-edu-dot.active {
    background: var(--accent-dark);
    width: 16px;
    border-radius: 999px;
  }

  /* Category header — clickable on mobile */
  .aiv5-acc-category-header {
    position: relative;
    user-select: none;
  }
  .aiv5-acc-category-header::after {
    content: '›';
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%) rotate(90deg);
    font-size: 18px;
    color: var(--text-4);
    transition: transform .25s;
  }
  .aiv5-acc-category-header.mob-cat-collapsed::after {
    transform: translateY(-50%) rotate(0deg);
  }

  /* Category group collapse container */
  .aiv5-mob-cat-group {
    overflow: hidden;
    max-height: 20000px;
    transition: max-height .4s cubic-bezier(.4,0,.2,1);
  }
  .aiv5-mob-cat-group.collapsed {
    max-height: 0 !important;
  }
}

/* ═══════════════════════════════════════════
   MOBILE JS — Phase 4: Step 3 wizard
═══════════════════════════════════════════ */
@media (max-width: 768px) {
  .aiv5-mob-wizard {
    display: block;
    margin-top: 8px;
    background: white;
    border: 1px solid var(--line);
    border-radius: var(--r-xl);
    padding: 24px 20px;
    box-shadow: var(--sh-sm);
  }

  .aiv5-wiz-progress {
    width: 100%;
    height: 3px;
    background: var(--line);
    border-radius: 999px;
    margin-bottom: 10px;
    overflow: hidden;
  }
  .aiv5-wiz-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-dark), var(--accent-deep));
    border-radius: 999px;
    transition: width .35s cubic-bezier(.4,0,.2,1);
  }
  .aiv5-wiz-step-counter {
    font-family: var(--font-en);
    font-size: 11px;
    font-weight: 700;
    color: var(--text-4);
    letter-spacing: .06em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .aiv5-wiz-steps {
    position: relative;
    overflow: hidden;
    min-height: 300px;
  }
  .aiv5-wiz-step {
    animation: aiv5WizFadeIn .28s ease;
  }
  @keyframes aiv5WizFadeIn {
    from { opacity: 0; transform: translateX(18px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .aiv5-wiz-cat-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    border-radius: var(--r-lg);
    background: var(--bg-soft);
    border: 1px solid var(--line);
    margin-bottom: 14px;
  }
  .aiv5-wiz-cat-icon { font-size: 24px; flex-shrink: 0; }
  .aiv5-wiz-cat-title {
    font-size: 16px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 2px;
  }
  .aiv5-wiz-cat-desc {
    font-size: 12px;
    color: var(--text-3);
    line-height: 1.5;
  }
  .aiv5-wiz-cat-head.is-core {
    background: linear-gradient(135deg, rgba(139,111,212,.1), rgba(109,40,217,.05));
    border-color: var(--accent-line);
  }

  .aiv5-wiz-svc-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    margin-bottom: 8px;
    background: white;
    border: 1.5px solid var(--line);
    border-radius: var(--r-lg);
    cursor: pointer;
    transition: all .16s ease;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .aiv5-wiz-svc-card.selected {
    border-color: var(--accent);
    background: var(--accent-soft);
    box-shadow: 0 0 0 3px rgba(196,168,245,.12);
  }
  .aiv5-wiz-svc-check {
    width: 22px;
    height: 22px;
    border-radius: 8px;
    flex-shrink: 0;
    border: 1.5px solid var(--line);
    background: white;
    display: grid;
    place-items: center;
    font-size: 12px;
    color: transparent;
    font-weight: 800;
    transition: all .14s;
  }
  .aiv5-wiz-svc-card.selected .aiv5-wiz-svc-check {
    background: var(--accent-dark);
    border-color: var(--accent-dark);
    color: white;
  }
  .aiv5-wiz-svc-info { flex: 1; min-width: 0; }
  .aiv5-wiz-svc-code {
    font-family: var(--font-en);
    font-size: 9px;
    font-weight: 800;
    letter-spacing: .05em;
    padding: 2px 7px;
    border-radius: 999px;
    margin-bottom: 4px;
    display: inline-block;
  }
  .aiv5-wiz-svc-code.core {
    background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
    color: white;
  }
  .aiv5-wiz-svc-code.mnt {
    background: rgba(100,116,139,.12);
    color: #475569;
    border: 1px solid rgba(100,116,139,.2);
  }
  .aiv5-wiz-svc-code.pre {
    background: rgba(16,185,129,.1);
    color: #059669;
    border: 1px solid rgba(16,185,129,.2);
  }
  .aiv5-wiz-svc-code.str {
    background: rgba(245,158,11,.1);
    color: #B45309;
    border: 1px solid rgba(245,158,11,.2);
  }
  .aiv5-wiz-svc-code.ads {
    background: rgba(239,68,68,.1);
    color: #DC2626;
    border: 1px solid rgba(239,68,68,.2);
  }
  .aiv5-wiz-svc-name {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
    line-height: 1.3;
    margin-bottom: 2px;
  }
  .aiv5-wiz-svc-price {
    font-family: var(--font-en);
    font-size: 13px;
    font-weight: 800;
    color: var(--text-3);
    flex-shrink: 0;
    white-space: nowrap;
  }
  .aiv5-wiz-svc-card.selected .aiv5-wiz-svc-price { color: var(--accent-dark); }

  .aiv5-wiz-soft-opts {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
  }
  .aiv5-wiz-soft-btn.selected {
    background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
    border-color: var(--accent-deep);
    color: white;
    box-shadow: 0 6px 18px rgba(109,40,217,.25);
  }
  .aiv5-wiz-multi-hint {
    font-size: 11px;
    color: var(--text-4);
    text-align: center;
    line-height: 1.5;
    padding: 2px 8px 0;
  }

  /* Skip-as-card: same shape as svc cards but no code chip/price */
  .aiv5-wiz-svc-card.aiv5-wiz-svc-skip .aiv5-wiz-svc-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-3);
    margin-bottom: 0;
  }
  .aiv5-wiz-svc-card.aiv5-wiz-svc-skip.selected .aiv5-wiz-svc-name {
    color: var(--accent-deep);
  }

  .aiv5-wiz-result-head {
    text-align: center;
    padding: 20px 0 16px;
  }
  .aiv5-wiz-result-icon { font-size: 40px; margin-bottom: 10px; }
  .aiv5-wiz-result-title {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -.5px;
    margin-bottom: 6px;
  }
  .aiv5-wiz-result-sub {
    font-size: 13px;
    color: var(--text-3);
    line-height: 1.7;
    margin: 0;
  }
  .aiv5-wiz-result-empty {
    text-align: center;
    padding: 20px;
    font-size: 14px;
    color: var(--text-3);
    background: var(--bg-soft);
    border: 1px dashed var(--line);
    border-radius: var(--r-lg);
    margin: 16px 0;
    line-height: 1.7;
  }
  .aiv5-wiz-result-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 16px 0;
  }
  .aiv5-wiz-result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 14px;
    background: var(--bg-soft);
    border: 1px solid var(--line-soft);
    border-radius: var(--r-md);
  }
  .aiv5-wiz-result-item-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-2);
  }
  .aiv5-wiz-result-item-price {
    font-family: var(--font-en);
    font-size: 13px;
    font-weight: 800;
    color: var(--accent-dark);
  }
  .aiv5-wiz-result-total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 14px 16px;
    margin-top: 4px;
    background: linear-gradient(135deg, rgba(139,111,212,.08), rgba(109,40,217,.04));
    border: 1.5px solid var(--accent-line);
    border-radius: var(--r-lg);
  }
  .aiv5-wiz-result-total-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-2);
  }
  .aiv5-wiz-result-total-price {
    font-family: var(--font-en);
    font-size: 22px;
    font-weight: 800;
    color: var(--accent-dark);
  }
  .aiv5-wiz-result-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }
  .aiv5-wiz-result-restart {
    background: none;
    border: 1.5px solid var(--line);
    border-radius: var(--r-md);
    padding: 12px;
    font-family: var(--font-ko);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-3);
    cursor: pointer;
    text-align: center;
  }

  .aiv5-wiz-nav {
    display: flex;
    gap: 10px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--line-soft);
  }
  .aiv5-wiz-btn-skip {
    flex: 1;
    padding: 13px 12px;
    background: var(--bg-soft);
    border: 1.5px solid var(--line);
    border-radius: var(--r-md);
    font-family: var(--font-ko);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-3);
    cursor: pointer;
    text-align: center;
    transition: all .15s;
  }
  .aiv5-wiz-btn-skip:active { background: var(--line-soft); }
  .aiv5-wiz-btn-next {
    flex: 2;
    padding: 13px 16px;
    background: linear-gradient(135deg, var(--accent-dark), var(--accent-deep));
    border: none;
    border-radius: var(--r-md);
    font-family: var(--font-ko);
    font-size: 14px;
    font-weight: 700;
    color: white;
    cursor: pointer;
    text-align: center;
    box-shadow: 0 6px 20px rgba(109,40,217,.28);
    transition: all .15s;
  }
  .aiv5-wiz-btn-next:active { transform: scale(.98); }
  .aiv5-wiz-btn-next.is-last {
    background: linear-gradient(135deg, #059669, #047857);
    box-shadow: 0 6px 20px rgba(5,150,105,.28);
  }

  /* Hide PC notice on mobile */
  .aiv5-pc-notice { display: none; }
}

/* ═══════════════════════════════════════════
   MOBILE JS — Phase 5: Step 4 pkg swipe carousel
═══════════════════════════════════════════ */
.aiv5-pkg-swipe-dots {
  display: none;
  justify-content: center;
  gap: 6px;
  margin-top: 14px;
}
.aiv5-pkg-dot {
  width: 6px;
  height: 6px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--line);
  transition: all .2s;
  cursor: pointer;
}
.aiv5-pkg-dot.active {
  background: var(--accent-dark);
  width: 18px;
  border-radius: 999px;
}
@media (max-width: 768px) {
  .aiv5-pkg-grid {
    display: flex;
    grid-template-columns: none;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    gap: 12px;
    padding: 4px 0 12px;
    margin-top: 20px;
    scroll-padding-left: 0;
  }
  .aiv5-pkg-grid::-webkit-scrollbar { display: none; }
  .aiv5-pkg-card {
    flex: 0 0 85vw;
    scroll-snap-align: center;
    border-radius: var(--r-xl);
    padding: 22px 20px;
  }
  .aiv5-pkg-swipe-dots { display: flex; }
  .aiv5-pkg-price { font-size: 28px; }
  .aiv5-pkg-name { font-size: 17px; }
  .aiv5-pkg-list li { font-size: 12px; }
  .aiv5-pkg-note-row p { font-size: 11px; }
}
`;

// ============================================================================
// Mobile swipe carousel helper (Phase 3)
// ============================================================================

function EduSwipe({ section }: { section: EduSection }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const hasDots = section.cards.length > 1;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !hasDots) return;
    const onScroll = () => {
      const cardEl = el.querySelector<HTMLDivElement>('.aiv5-mob-edu-card');
      const w = cardEl?.offsetWidth || 1;
      const idx = Math.round(el.scrollLeft / (w + 12));
      setActiveIdx(idx);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [hasDots]);

  const goTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardEl = el.querySelector<HTMLDivElement>('.aiv5-mob-edu-card');
    const w = cardEl?.offsetWidth || 0;
    el.scrollTo({ left: idx * (w + 12), behavior: 'smooth' });
  };

  return (
    <div className={`aiv5-mob-edu-section${section.highlight ? ' is-highlight' : ''}`}>
      <div className="aiv5-mob-edu-section-head">
        <span className="aiv5-mob-edu-section-icon">{section.icon}</span>
        <span className="aiv5-mob-edu-section-label">{section.label}</span>
      </div>
      <div className="aiv5-mob-edu-swipe-inner" ref={scrollRef}>
        {section.cards.map((card, i) => (
          <div
            key={i}
            className={`aiv5-mob-edu-card${card.codeType === 'core' ? ' is-core' : ''}`}
          >
            <div className="aiv5-mob-edu-card-top">
              <span className={`aiv5-mob-edu-code ${card.codeType}`}>{card.code}</span>
              <span className="aiv5-mob-edu-price">{card.price}</span>
            </div>
            <div className="aiv5-mob-edu-cat">{card.cat}</div>
            <div className="aiv5-mob-edu-name">{card.name}</div>
            <div className="aiv5-mob-edu-desc">{card.desc}</div>
            <div className="aiv5-mob-edu-tags">
              {card.tags.map((t, j) => (
                <span key={j} className="aiv5-mob-edu-tag">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {hasDots && (
        <div className="aiv5-mob-edu-swipe-dots">
          {section.cards.map((_, i) => (
            <span
              key={i}
              className={`aiv5-mob-edu-dot${i === activeIdx ? ' active' : ''}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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

  // ── Mobile state (Phase 1) ──
  const [isMobile, setIsMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth <= 768,
  );
  const [diagCurrentKey, setDiagCurrentKey] = useState<string | null>(null);
  const [diagMobOpen, setDiagMobOpen] = useState<boolean>(false);
  const [catCollapsedMap, setCatCollapsedMap] = useState<Record<string, boolean>>({});
  const [wizCurrent, setWizCurrent] = useState<number>(0);
  const [wizSelectedSet, setWizSelectedSet] = useState<Set<string>>(new Set());
  const [pkgActiveIdx, setPkgActiveIdx] = useState<number>(0);
  const pkgGridRef = useRef<HTMLDivElement>(null);
  const pkgUserInteractedRef = useRef<boolean>(false);

  useEffect(() => {
    const styleId = 'aiv5-course-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = COURSE_CSS;
    document.head.appendChild(style);
  }, []);

  // ── Resize listener: breakpoint detection ──
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Reset mobile-only state when crossing breakpoint back to desktop ──
  useEffect(() => {
    if (!isMobile) {
      setDiagMobOpen(false);
      setDiagCurrentKey(null);
      setWizCurrent(0);
      setWizSelectedSet(new Set());
      setCatCollapsedMap({});
      setPkgActiveIdx(0);
      pkgUserInteractedRef.current = false;
    }
  }, [isMobile]);

  // ── Step 4 pkg auto-slide carousel (mobile only) ──
  useEffect(() => {
    if (!isMobile) return;
    const grid = pkgGridRef.current;
    if (!grid) return;

    pkgUserInteractedRef.current = false;
    const total = PACKAGES.length;
    let idx = 0;

    const timer = window.setInterval(() => {
      if (pkgUserInteractedRef.current) return;
      idx = (idx + 1) % total;
      const card = grid.querySelector<HTMLElement>('.aiv5-pkg-card');
      const cardW = card?.offsetWidth ?? 0;
      grid.scrollTo({ left: idx * (cardW + 12), behavior: 'smooth' });
    }, 3200);

    const onTouchStart = () => {
      pkgUserInteractedRef.current = true;
    };
    grid.addEventListener('touchstart', onTouchStart, { passive: true });

    const onScroll = () => {
      const card = grid.querySelector<HTMLElement>('.aiv5-pkg-card');
      const cardW = card?.offsetWidth ?? 1;
      const activeIdx = Math.round(grid.scrollLeft / (cardW + 12));
      idx = activeIdx;
      setPkgActiveIdx(activeIdx);
    };
    grid.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.clearInterval(timer);
      grid.removeEventListener('touchstart', onTouchStart);
      grid.removeEventListener('scroll', onScroll);
    };
  }, [isMobile]);

  const onPkgDotClick = (idx: number) => {
    pkgUserInteractedRef.current = true;
    const grid = pkgGridRef.current;
    if (!grid) return;
    const card = grid.querySelector<HTMLElement>('.aiv5-pkg-card');
    const cardW = card?.offsetWidth ?? 0;
    grid.scrollTo({ left: idx * (cardW + 12), behavior: 'smooth' });
  };

  // ── Handlers ──
  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const toggleSvc = (svc: SvcItem) => {
    setSelectedSvcs(prev => {
      const next = new Map(prev);
      if (next.has(svc.id)) next.delete(svc.id);
      else next.set(svc.id, svc);
      return next;
    });
  };

  const clearServices = () => setSelectedSvcs(new Map());

  const handlePhoneChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 3 && digits.length <= 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else if (digits.length > 7) {
      formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    setFormPhone(formatted);
  };

  const openModal = () => {
    if (selectedSvcs.size === 0) {
      alert('서비스를 하나 이상 선택해주세요.');
      return;
    }
    setModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = '';
  };

  const submitForm = (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      alert('이름과 연락처를 입력해주세요.');
      return;
    }
    const name = formName;
    closeModal();
    clearServices();
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormMemo('');
    alert(`${name}님, 상담 신청이 완료되었습니다.\n1영업일 내 연락드리겠습니다.`);
  };

  const totalSelected = [...selectedSvcs.values()].reduce((sum, s) => sum + s.price, 0);
  const totalLabel = totalSelected.toLocaleString('ko-KR') + '원';
  const hasMonthly = [...selectedSvcs.values()].some(s => s.priceLabel.includes('월'));

  // ── Phase 3: Step 2 mobile category collapse handler ──
  const toggleCatCollapsed = (catKey: string) => {
    setCatCollapsedMap(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  // ── Phase 4: Step 3 mobile wizard handlers ──
  const wizToggle = (key: string) => {
    setWizSelectedSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        // Mutex: selecting a real service clears the "skip" sentinel for this step
        next.delete('__skip__' + wizCurrent);
      }
      return next;
    });
  };

  const wizToggleSkip = () => {
    const skipKey = '__skip__' + wizCurrent;
    setWizSelectedSet(prev => {
      const next = new Set(prev);
      if (next.has(skipKey)) {
        next.delete(skipKey);
      } else {
        next.add(skipKey);
        // Mutex: selecting skip clears all real services for this step
        WIZ_STEPS[wizCurrent]?.services.forEach(s => next.delete(s.key));
      }
      return next;
    });
  };

  const wizToggleConsult = () => {
    const consultKey = '__consult__' + wizCurrent;
    setWizSelectedSet(prev => {
      const next = new Set(prev);
      if (next.has(consultKey)) next.delete(consultKey);
      else next.add(consultKey);
      // Non-mutex: consult can coexist with real services and skip
      return next;
    });
  };

  const wizSyncToMain = (setOverride?: Set<string>) => {
    const src = setOverride ?? wizSelectedSet;
    setSelectedSvcs(prev => {
      const next = new Map(prev);
      WIZ_STEPS.forEach(step =>
        step.services.forEach(s => {
          if (src.has(s.key)) {
            const item = SVC_LOOKUP[s.key];
            if (item) next.set(s.key, item);
          } else {
            next.delete(s.key);
          }
        }),
      );
      return next;
    });
  };

  const wizNext = () => {
    wizSyncToMain();
    setWizCurrent(c => c + 1);
  };

  const wizBack = () => {
    setWizCurrent(c => Math.max(0, c - 1));
  };

  const wizRestart = () => {
    setWizCurrent(0);
    setWizSelectedSet(new Set());
    clearServices();
  };

  const wizInquire = () => {
    wizSyncToMain();
    // Defer modal open so the state update flushes first
    setTimeout(() => {
      if (
        [...wizSelectedSet].some(
          k => !k.startsWith('__consult__') && !k.startsWith('__skip__'),
        )
      ) {
        setModalOpen(true);
        document.body.style.overflow = 'hidden';
      } else {
        alert('서비스를 하나 이상 선택해주세요.');
      }
    }, 0);
  };

  // ── Phase 2: Step 1 mobile handlers ──
  const applyPreset = (key: string) => {
    setSelectedState(key);
    if (isMobile) {
      if (diagCurrentKey && diagCurrentKey !== key) {
        setDiagMobOpen(false);
      }
      setDiagCurrentKey(key);
    }
  };

  const onStateCardClick = (key: string) => {
    if (isMobile) {
      setSelectedState(key);
      if (diagCurrentKey === key && diagMobOpen) {
        setDiagMobOpen(false);
      } else {
        setDiagCurrentKey(key);
        setDiagMobOpen(true);
      }
    } else {
      setSelectedState(key);
    }
  };

  const route = selectedState ? ROUTES[selectedState] : null;

  // Phase 2: Reusable result body JSX (used by desktop right panel + mobile inline accordion)
  const resultBody = route && (
    <div className="aiv5-result-body">
      <div className="aiv5-result-top">
        <div className="aiv5-result-kicker">
          {route.pills.map((p, i) => (
            <span key={i} className="aiv5-kicker-pill">{p}</span>
          ))}
        </div>
        <h3 className="aiv5-result-h">{route.title}</h3>
        <p className="aiv5-result-desc">{route.desc}</p>
      </div>

      <div className="aiv5-result-meta">
        {route.meta.map((m, i) => (
          <span key={i} className="aiv5-meta-chip">{m}</span>
        ))}
      </div>

      <div className="aiv5-route-steps">
        {route.steps.map((s, i) => (
          <div key={i} className="aiv5-route-step-card">
            <div className="aiv5-step-n">{s.n}</div>
            <strong>{s.title}</strong>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="aiv5-result-estimate">
        <div className="aiv5-estimate-header">
          <span className="aiv5-estimate-label">Estimate</span>
          <span className="aiv5-estimate-total">{route.totalEst}</span>
        </div>
        <div className="aiv5-estimate-rows">
          {route.estimate.map((r, i) => (
            <div key={i} className="aiv5-estimate-row">
              <span>{r.label}</span>
              <span>{r.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="aiv5-result-cta">
        {route.note && <p className="aiv5-result-cta-note">{route.note}</p>}
        <button
          type="button"
          className="aiv5-btn aiv5-btn-primary"
          onClick={() => scrollToId('services')}
        >
          이 경로로 상담 문의하기
        </button>
        {isMobile && (
          <div className="aiv5-mob-result-choices">
            <button
              type="button"
              className="aiv5-wiz-soft-btn aiv5-wiz-soft-consult"
              onClick={() => scrollToId('services')}
            >
              💬 상담이 필요해요
            </button>
            <button
              type="button"
              className="aiv5-wiz-soft-btn aiv5-wiz-soft-skip"
              onClick={() => scrollToId('modules')}
            >
              ✓ 준비됐어요 · 교육 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="aiv5-page">
      {/* ══ HERO ══ */}
      <div className="aiv5-hero">
        <div className="aiv5-hero-left">
          <span className="aiv5-eyebrow">AI로 쉽게 만들고, 제대로 된 SEO로 — 구독료 없이</span>
          <h1 className="aiv5-hero-h1">
            지금 당장 필요한 것만<br />
            맞춤형으로 <em>배우고, 바로 실행하세요.</em>
          </h1>
          <p className="aiv5-hero-desc">
            비싼 에이전시도, 매달 나가는 구독료도 필요 없습니다.
            AI로 직접 만들고, 검색으로 고객이 먼저 찾아오는 구조를 만드는 법을 배웁니다.
            어디서 막혔는지 고르면 거기서 바로 시작할 수 있습니다.
          </p>
          <div className="aiv5-hero-btns">
            <button className="aiv5-btn aiv5-btn-primary" onClick={() => scrollToId('diagnosis')}>
              내 상태 진단하기 →
            </button>
            <button className="aiv5-btn aiv5-btn-ghost" onClick={() => scrollToId('services')}>
              개별 서비스 보기
            </button>
          </div>
        </div>

        <div className="aiv5-hero-right">
          <p className="aiv5-hero-right-title">Instructor · 강사 소개</p>

          <div className="aiv5-instructor-card">
            <div className="aiv5-instructor-avatar av-philo">P</div>
            <div className="aiv5-instructor-info">
              <div className="aiv5-instructor-name">
                Philo <span className="aiv5-instructor-role">마케팅 · SEO</span>
              </div>
              <ul className="aiv5-instructor-list">
                <li>온라인 마케팅 전문 경력 10년+, 2016 대한민국마케팅앱대상 수상</li>
                <li>한국지능정보사회교육원 데잇걸즈4 마케팅 운영 · 서울시청년청 데이터 드리븐 마케팅 컨설턴트</li>
                <li>대구연구특구 마케팅 멘토 · SEO 기반 인바운드 마케팅 전문</li>
              </ul>
            </div>
          </div>

          <div className="aiv5-instructor-card">
            <div className="aiv5-instructor-avatar av-jin">J</div>
            <div className="aiv5-instructor-info">
              <div className="aiv5-instructor-name">
                Jin <span className="aiv5-instructor-role">PM · 기획</span>
              </div>
              <ul className="aiv5-instructor-list">
                <li>IT 프로덕트 기획 및 PM · 글로벌 IT 서비스 PM</li>
                <li>AI 아트데이터 공공서비스 (이미지 키워드 분석) QA</li>
                <li>사용자 중심 서비스 QA 및 운영 전문</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ══ STEP 1: DIAGNOSIS ══ */}
      <section className="aiv5-section" id="diagnosis">
        <div className="aiv5-section-head">
          <div className="aiv5-step-badge"><span className="aiv5-step-dot"></span> Step 1</div>
          <h2 className="aiv5-section-title">맞춤형 진단</h2>
          <p className="aiv5-section-sub">현재 상황을 고르면 무엇부터 해야 하는지, 얼마나 걸리는지 바로 확인됩니다.</p>
        </div>

        {/* Quick Presets */}
        <div className="aiv5-preset-row">
          {PRESETS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`aiv5-preset-btn${selectedState === p.id ? ' active' : ''}`}
              onClick={() => applyPreset(p.id)}
            >
              <span className="aiv5-preset-icon">{p.icon}</span> {p.label}
            </button>
          ))}
        </div>

        <div className="aiv5-diagnosis-layout">
          {/* Left: State Cards */}
          <div className="aiv5-state-panel">
            {/* Mobile: placeholder shown before any preset selected */}
            {isMobile && !diagCurrentKey && (
              <div className="aiv5-mob-diag-placeholder">
                <div className="aiv5-mob-diag-ph-icon">🔍</div>
                <p className="aiv5-mob-diag-ph-text">
                  위 버튼으로 현재 상황을 선택하면<br />
                  딱 맞는 추천 경로가 나타납니다
                </p>
              </div>
            )}

            {/* Mobile: inline accordion with route result (opens below state card) */}
            {isMobile && diagCurrentKey && (
              <div className={`aiv5-mob-diag-accordion${diagMobOpen ? ' open' : ''}`}>
                <div className="aiv5-mob-diag-acc-inner">
                  {diagMobOpen && resultBody && (
                    <div className="aiv5-mob-result-inline">{resultBody}</div>
                  )}
                </div>
              </div>
            )}

            {STATES
              .filter(s => !isMobile || s.id === diagCurrentKey)
              .map(s => (
                <button
                  key={s.id}
                  type="button"
                  className={`aiv5-state-card${selectedState === s.id ? ' active' : ''}`}
                  onClick={() => onStateCardClick(s.id)}
                >
                  <div className={`aiv5-state-icon ${s.iconClass}`}>{s.icon}</div>
                  <div className="aiv5-state-text">
                    <strong>{s.title}</strong>
                    <span>{s.sub}</span>
                  </div>
                  <div className="aiv5-state-arrow">›</div>
                </button>
              ))}
          </div>

          {/* Right: Result Panel (desktop only) */}
          {!isMobile && (
            <div className="aiv5-result-panel">
              {!route ? (
                <div className="aiv5-result-empty">
                  <div className="aiv5-result-empty-inner">
                    <div className="aiv5-result-empty-icon">🗂️</div>
                    <strong>현재 상태를 선택해 주세요</strong>
                    <p>선택 즉시 추천 경로, 단계별 교육 내용, 예상 비용이 표시됩니다.</p>
                  </div>
                </div>
              ) : (
                resultBody
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══ STEP 2: EDUCATION MODULES ══ */}
      <section className="aiv5-section" id="modules">
        <div className="aiv5-section-head">
          <div className="aiv5-step-badge"><span className="aiv5-step-dot"></span> Step 2</div>
          <h2 className="aiv5-section-title">교육 내용 상세 안내</h2>
          <p className="aiv5-section-sub">
            한 번 배우면 매달 나가는 돈이 줄어듭니다. 배운 것은 비용이 아니라 계속 쓸 수 있는 자산이 됩니다.
          </p>
        </div>

        {/* Mobile: horizontal swipe edu cards by section */}
        {isMobile && (
          <div className="aiv5-mob-edu-swipe">
            {EDU_SECTIONS.map(sec => (
              <EduSwipe key={sec.id} section={sec} />
            ))}
          </div>
        )}

        {!isMobile && (
          <div className="aiv5-accordion">
            {MODULES.map((cat, ci) => {
              const catKey = `cat-${ci}`;
              const collapsed = isMobile && !!catCollapsedMap[catKey];
              return (
              <div key={ci}>
                <div
                  className={`aiv5-acc-category-header${cat.core ? ' is-core' : ''}${collapsed ? ' mob-cat-collapsed' : ''}`}
                  onClick={() => isMobile && toggleCatCollapsed(catKey)}
                  style={isMobile ? { cursor: 'pointer' } : undefined}
                >
                  <span className="aiv5-acc-category-icon">{cat.icon}</span>
                  <div>
                    <strong>{cat.title}</strong>
                    <span>{cat.sub}</span>
                  </div>
                </div>

                <div className={`aiv5-mob-cat-group${collapsed ? ' collapsed' : ''}`}>
                {cat.items.map(item => {
                  const isOpen = openAccId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`aiv5-acc-item${isOpen ? ' open' : ''}`}
                      id={item.id}
                    >
                      <button
                        type="button"
                        className="aiv5-acc-trigger"
                        aria-expanded={isOpen}
                        onClick={() => setOpenAccId(isOpen ? null : item.id)}
                      >
                        <div className={`aiv5-acc-num${item.numClass ? ' ' + item.numClass : ''}`}>
                          {item.num}
                        </div>
                        <div className="aiv5-acc-meta">
                          <span className={`aiv5-acc-code-chip ${item.chipClass}`}>{item.chip}</span>
                          <span className="aiv5-acc-name">{item.name}</span>
                          <div className="aiv5-acc-tagrow">
                            {item.tags.map((t, i) => (
                              <span key={i} className="aiv5-acc-tag">{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className="aiv5-acc-right">
                          <span className="aiv5-acc-price-chip">{item.price}</span>
                          <div className="aiv5-acc-chevron">▾</div>
                        </div>
                      </button>

                      <div className="aiv5-acc-body" role="region">
                        <div className="aiv5-acc-body-inner">
                          <div className="aiv5-acc-body-content">
                            <div>
                              <p className="aiv5-acc-desc">
                                {item.desc.split('\n').map((line, i, arr) => (
                                  <span key={i}>
                                    {line}
                                    {i < arr.length - 1 && <><br /><br /></>}
                                  </span>
                                ))}
                              </p>
                              <span className="aiv5-acc-who-label">{item.whoTitle}</span>
                              <div className="aiv5-acc-who-list">
                                {item.who.map((w, i) => (
                                  <div key={i} className="aiv5-acc-who-item">
                                    <div className="aiv5-acc-who-dot"></div>
                                    {w}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="aiv5-acc-outcomes">
                              <div className="aiv5-acc-outcome-group">
                                <h5>{item.learnTitle}</h5>
                                <div className="aiv5-acc-learn-list">
                                  {item.learn.map((l, i) => (
                                    <div key={i} className="aiv5-acc-learn-item">{l}</div>
                                  ))}
                                </div>
                              </div>
                              <div className="aiv5-acc-divider-h"></div>
                              <div className="aiv5-acc-outcome-group">
                                <h5>진행 방식</h5>
                                <div className="aiv5-acc-info-row">
                                  {item.metaChips.map((m, i) => (
                                    <span key={i} className="aiv5-acc-info-chip">{m}</span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══ STEP 3: INDIVIDUAL SERVICES ══ */}
      <section className="aiv5-section" id="services">
        <div className="aiv5-section-head">
          <div className="aiv5-step-badge"><span className="aiv5-step-dot"></span> Step 3</div>
          <h2 className="aiv5-section-title">
            지금 궁금하고 필요한 것들이<br />어느 정도인지 확인해보세요
          </h2>
          <p className="aiv5-section-sub">
            전부 들을 필요 없습니다. 지금 당장 필요한 부분만 선택해서 예산을 먼저 확인하고, 전문 컨설턴트와 상의하세요. 꼭 필요한 과정만 안내해드립니다.
          </p>
          <div className="aiv5-pc-notice">
            <span className="aiv5-pc-notice-icon">🖥</span>
            <span>항목을 직접 선택하면 우측에서 실시간으로 예산이 계산됩니다. 조합을 만든 뒤 바로 문의할 수 있습니다.</span>
          </div>
        </div>

        {/* ── Mobile: Wizard ── */}
        {isMobile && (() => {
          const total = WIZ_STEPS.length;
          const isResult = wizCurrent >= total;
          const pct = isResult ? 100 : Math.round((wizCurrent / total) * 100);
          const step = WIZ_STEPS[wizCurrent];

          // Result screen computations
          const resultItems = [...wizSelectedSet]
            .filter(k => !k.startsWith('__consult__') && !k.startsWith('__skip__'))
            .map(k => SVC_LOOKUP[k])
            .filter((x): x is SvcItem => !!x);
          const resultTotal = resultItems.reduce((sum, it) => sum + it.price, 0);
          const resultHasMonthly = resultItems.some(it => it.priceLabel.includes('월'));
          const consultCount = [...wizSelectedSet].filter(k => k.startsWith('__consult__')).length;

          return (
            <div className="aiv5-mob-wizard">
              <div className="aiv5-wiz-progress">
                <div className="aiv5-wiz-progress-bar" style={{ width: pct + '%' }} />
              </div>
              <div className="aiv5-wiz-step-counter">
                {isResult ? '✓ 선택 완료' : `${wizCurrent + 1} / ${total}`}
              </div>

              <div className="aiv5-wiz-steps">
                {isResult ? (
                  <div className="aiv5-wiz-step">
                    <div className="aiv5-wiz-result-head">
                      <div className="aiv5-wiz-result-icon">✨</div>
                      <div className="aiv5-wiz-result-title">선택하신 구성</div>
                      <p className="aiv5-wiz-result-sub">
                        아래 내용으로 문의를 보내시면 전문 컨설턴트가 1영업일 내 연락드립니다.
                      </p>
                    </div>

                    {resultItems.length === 0 ? (
                      <div className="aiv5-wiz-result-empty">
                        선택한 서비스가 없습니다.
                        {consultCount > 0 && <><br />상담 요청 {consultCount}건이 기록됐습니다.</>}
                      </div>
                    ) : (
                      <>
                        <div className="aiv5-wiz-result-list">
                          {resultItems.map(it => (
                            <div key={it.id} className="aiv5-wiz-result-item">
                              <span className="aiv5-wiz-result-item-name">{it.code} {it.name}</span>
                              <span className="aiv5-wiz-result-item-price">{it.priceLabel}</span>
                            </div>
                          ))}
                        </div>
                        <div className="aiv5-wiz-result-total">
                          <span className="aiv5-wiz-result-total-label">
                            예상 총액 {resultHasMonthly && '(월정액 포함)'}
                          </span>
                          <span className="aiv5-wiz-result-total-price">
                            {resultTotal.toLocaleString('ko-KR')}원
                          </span>
                        </div>
                      </>
                    )}

                    <div className="aiv5-wiz-result-actions">
                      <button
                        type="button"
                        className="aiv5-wiz-btn-next"
                        onClick={wizInquire}
                      >
                        이 구성으로 문의하기 →
                      </button>
                      <button
                        type="button"
                        className="aiv5-wiz-result-restart"
                        onClick={wizRestart}
                      >
                        처음부터 다시하기
                      </button>
                    </div>
                  </div>
                ) : step ? (
                  <div className="aiv5-wiz-step">
                    <div className={`aiv5-wiz-cat-head${step.isCore ? ' is-core' : ''}`}>
                      <span className="aiv5-wiz-cat-icon">{step.icon}</span>
                      <div>
                        <div className="aiv5-wiz-cat-title">{step.cat}</div>
                        <div className="aiv5-wiz-cat-desc">{step.desc}</div>
                      </div>
                    </div>

                    {step.services.map(s => {
                      const sel = wizSelectedSet.has(s.key);
                      return (
                        <div
                          key={s.key}
                          className={`aiv5-wiz-svc-card${sel ? ' selected' : ''}`}
                          onClick={() => wizToggle(s.key)}
                        >
                          <div className="aiv5-wiz-svc-check">✓</div>
                          <div className="aiv5-wiz-svc-info">
                            <span className={`aiv5-wiz-svc-code ${s.codeType}`}>{s.code}</span>
                            <div className="aiv5-wiz-svc-name">{s.label}</div>
                          </div>
                          <div className="aiv5-wiz-svc-price">{s.priceStr}</div>
                        </div>
                      );
                    })}

                    {(() => {
                      const consultKey = '__consult__' + wizCurrent;
                      const consultSel = wizSelectedSet.has(consultKey);
                      const skipKey = '__skip__' + wizCurrent;
                      const skipSel = wizSelectedSet.has(skipKey);
                      const consultLabel =
                        step.optionType === 'pre'
                          ? '잘 모르겠어요, 상담이 필요해요'
                          : '상담이 필요해요';
                      const skipLabel =
                        step.optionType === 'pre'
                          ? '이미 준비됐어요 · 해당없음'
                          : step.optionType === 'core1'
                          ? '이 단계 준비완료 · 해당없음'
                          : '필요없음';
                      return (
                        <>
                          <div
                            className={`aiv5-wiz-svc-card aiv5-wiz-svc-skip${skipSel ? ' selected' : ''}`}
                            onClick={wizToggleSkip}
                            role="button"
                            aria-pressed={skipSel}
                          >
                            <div className="aiv5-wiz-svc-check">✓</div>
                            <div className="aiv5-wiz-svc-info">
                              <div className="aiv5-wiz-svc-name">{skipLabel}</div>
                            </div>
                          </div>
                          {step.optionType !== 'core1' && (
                            <div className="aiv5-wiz-soft-opts">
                              <button
                                type="button"
                                className={`aiv5-wiz-soft-btn aiv5-wiz-soft-consult${consultSel ? ' selected' : ''}`}
                                onClick={wizToggleConsult}
                                aria-pressed={consultSel}
                              >
                                {consultSel ? '✓ ' : '💬 '}{consultLabel}
                              </button>
                              <div className="aiv5-wiz-multi-hint">
                                💡 다른 항목과 함께 선택할 수 있어요
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </div>

              {!isResult && (
                <div className="aiv5-wiz-nav">
                  {wizCurrent > 0 && (
                    <button type="button" className="aiv5-wiz-btn-skip" onClick={wizBack}>
                      ← 이전 단계로
                    </button>
                  )}
                  <button
                    type="button"
                    className={`aiv5-wiz-btn-next${wizCurrent === total - 1 ? ' is-last' : ''}`}
                    onClick={wizNext}
                  >
                    {wizCurrent === total - 1 ? '결과 보기 ✓' : '다음 →'}
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {!isMobile && <div className="aiv5-services-layout">
          <div className="aiv5-service-groups">
            {SERVICE_GROUPS.map((group, gi) => (
              <div
                key={gi}
                className={`aiv5-service-group${group.title.startsWith('CORE') || group.title.startsWith('⭐') ? ' is-core' : ''}`}
              >
                <div className="aiv5-sg-head">
                  <h3>{group.icon} {group.title}</h3>
                </div>
                <div className="aiv5-service-grid">
                  {group.items.map(item => {
                    const checked = selectedSvcs.has(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`aiv5-svc-item${checked ? ' checked' : ''}`}
                        onClick={() => toggleSvc(item)}
                      >
                        <div className="aiv5-svc-top">
                          <div className="aiv5-svc-cb">✓</div>
                          <span className="aiv5-svc-price">{item.priceLabel}</span>
                        </div>
                        <div className={`aiv5-svc-code ${item.codeClass}`}>{item.code}</div>
                        <div className="aiv5-svc-name">{item.name}</div>
                        <div className="aiv5-svc-desc">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Sidebar */}
          <aside className="aiv5-sticky-sidebar">
            <h3 className="aiv5-ss-title">선택한 서비스</h3>
            <p className="aiv5-ss-desc">
              체크한 항목이 여기서 정리됩니다. 문의 전에 구성과 예산을 한 번 더 확인할 수 있습니다.
            </p>

            <div className="aiv5-ss-tags">
              {selectedSvcs.size === 0 ? (
                <span className="aiv5-ss-empty-hint">선택된 항목이 없습니다</span>
              ) : (
                [...selectedSvcs.values()].map(s => (
                  <span key={s.id} className="aiv5-ss-tag">{s.code} {s.name}</span>
                ))
              )}
            </div>

            <div className="aiv5-ss-total-box">
              <div className="aiv5-ss-total-label">Total Estimate</div>
              <div className="aiv5-ss-total-num">
                {selectedSvcs.size > 0 ? totalLabel : '0원'}
              </div>
              <div className="aiv5-ss-total-sub">
                {selectedSvcs.size > 0
                  ? `총 ${selectedSvcs.size}개 항목 선택됨 ${hasMonthly ? '(월정액 포함)' : ''}`
                  : '선택한 서비스가 없습니다.'}
              </div>
            </div>

            <div className="aiv5-ss-actions">
              <button type="button" className="aiv5-btn aiv5-btn-primary aiv5-btn-block" onClick={openModal}>
                이 조합으로 문의하기
              </button>
              <button type="button" className="aiv5-btn aiv5-btn-ghost aiv5-btn-block" onClick={clearServices}>
                선택 초기화
              </button>
            </div>

            <div className="aiv5-ss-note">
              실제 제안 시에는 업종, 현재 사이트 상태, 예산 규모에 따라 묶음 구성과 순서를 다시 조정할 수 있습니다.
            </div>
          </aside>
        </div>}
      </section>

      {/* ══ STEP 4: PACKAGES ══ */}
      <section className="aiv5-section" id="packages">
        <div className="aiv5-section-head">
          <div className="aiv5-step-badge"><span className="aiv5-step-dot"></span> Step 4</div>
          <h2 className="aiv5-section-title">
            누구보다 빠르게, 남들과는 다르게<br />실행하고 싶다면 — 1:1 PKG
          </h2>
          <p className="aiv5-section-sub">
            AISEO.TIPS는 많은 강의를 듣게 하는 것이 목표가 아닙니다. 이 PKG는 빠르게, 집중적으로 진행하고 싶은 분들을 위해 1:1로 진행되는 서비스입니다. 여러 개를 들었다고 할인해드리는 PKG가 아닙니다. 상담을 통한 맞춤형 계약 후 진행됩니다.
          </p>
        </div>

        <div className="aiv5-pkg-grid" ref={pkgGridRef}>
          {PACKAGES.map(pkg => (
            <div key={pkg.id} className={`aiv5-pkg-card${pkg.featured ? ' featured' : ''}`}>
              {pkg.featured && <div className="aiv5-pkg-rec-badge">⭐ 가장 많이 선택</div>}
              <div className="aiv5-pkg-tier">{pkg.tier}</div>
              <div className="aiv5-pkg-name">{pkg.name}</div>
              <div className="aiv5-pkg-price">{pkg.price}</div>
              <div className="aiv5-pkg-duration">{pkg.duration}</div>
              <div className="aiv5-pkg-rule"></div>
              <ul className="aiv5-pkg-list">
                {pkg.includes.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
              {pkg.tags && pkg.tags.map((t, i) => (
                <div key={i} className="aiv5-pkg-tag">{t}</div>
              ))}
            </div>
          ))}
        </div>

        {isMobile && (
          <div className="aiv5-pkg-swipe-dots" role="tablist" aria-label="패키지 선택">
            {PACKAGES.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`aiv5-pkg-dot${pkgActiveIdx === i ? ' active' : ''}`}
                aria-label={`패키지 ${i + 1}`}
                aria-selected={pkgActiveIdx === i}
                role="tab"
                onClick={() => onPkgDotClick(i)}
              />
            ))}
          </div>
        )}

        <div className="aiv5-pkg-note-row">
          <p>모든 서비스는 현재 상태와 콘텐츠 준비도에 따라 범위가 조정될 수 있습니다 · 콘텐츠 기획부터 필요한 경우 별도 견적이 추가됩니다 · 실제 광고비, 외부 툴 사용료, 도메인 구입비는 별도입니다.</p>
        </div>
      </section>

      {/* ══ FINAL CTA ══ */}
      <section className="aiv5-cta-section">
        <div className="aiv5-cta-inner">
          <div className="aiv5-cta-left">
            <span className="aiv5-cta-eyebrow">AI로 쉽게 만들고, 제대로 된 SEO로 — 구독료 없이</span>
            <h2 className="aiv5-cta-title">
              고객이 먼저 찾아오는 구조,<br />지금 시작할 수 있습니다
            </h2>
            <p className="aiv5-cta-desc">
              월구독 없이. 에이전시 없이.<br />
              한 번 제대로 만들면 계속 일하는<br />
              AI 시대에 맞는 온라인 마케팅을 직접 할 수 있게 도와드립니다.
            </p>
            <div className="aiv5-cta-btns">
              <button
                type="button"
                className="aiv5-cta-btn-primary"
                onClick={() => {
                  if (selectedSvcs.size === 0) {
                    scrollToId('services');
                  } else {
                    openModal();
                  }
                }}
              >
                <span className="aiv5-cta-btn-icon">✉</span>
                지금 문의하기
              </button>
              <button
                type="button"
                className="aiv5-cta-btn-ghost"
                onClick={() => scrollToId('diagnosis')}
              >
                처음부터 다시 보기
              </button>
            </div>
          </div>
          <div className="aiv5-cta-right">
            <div className="aiv5-cta-card">
              <div className="aiv5-cta-card-row">
                <div className="aiv5-cta-card-dot dot-green"></div>
                <span>평균 응답</span>
                <strong>1영업일 이내</strong>
              </div>
              <div className="aiv5-cta-card-rule"></div>
              <div className="aiv5-cta-card-row">
                <div className="aiv5-cta-card-dot dot-purple"></div>
                <span>진행 방식</span>
                <strong>화상 미팅 기준</strong>
              </div>
              <div className="aiv5-cta-card-rule"></div>
              <div className="aiv5-cta-card-row">
                <div className="aiv5-cta-card-dot dot-blue"></div>
                <span>첫 상담</span>
                <strong>무료 · 부담 없음</strong>
              </div>
              <div className="aiv5-cta-card-rule"></div>
              <div className="aiv5-cta-card-row">
                <div className="aiv5-cta-card-dot dot-green"></div>
                <span>개별 구성</span>
                <strong>필요한 것만 선택 가능</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ STICKY INQUIRY BAR ══ */}
      {selectedSvcs.size > 0 && (
        <div className="aiv5-inq-bar">
          <div className="aiv5-inq-bar-inner">
            <div className="aiv5-inq-info">
              <div className="aiv5-inq-tags">
                {[...selectedSvcs.values()].map(s => (
                  <span key={s.id} className="aiv5-inq-tag">{s.code} {s.name}</span>
                ))}
              </div>
              <div className="aiv5-inq-total-row">
                <span className="aiv5-inq-label">선택 합계</span>
                <span className="aiv5-inq-amount">{totalLabel}</span>
                {hasMonthly && <span className="aiv5-inq-note">(월정액 포함)</span>}
              </div>
            </div>
            <button type="button" className="aiv5-inq-btn" onClick={openModal}>
              상담 문의하기 →
            </button>
          </div>
        </div>
      )}

      {/* ══ MODAL (portal) ══ */}
      {modalOpen && ReactDOM.createPortal(
        <div className="aiv5-modal-ov open" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="aiv5-modal">
            <button type="button" className="aiv5-modal-x" onClick={closeModal}>×</button>
            <span className="aiv5-modal-logo">AISEO</span>
            <div className="aiv5-modal-title">상담 문의</div>
            <div className="aiv5-modal-sub">
              선택하신 서비스를 확인하고, 연락처를 남겨주시면 1영업일 내 연락드립니다.
            </div>

            <div className="aiv5-modal-summary">
              <div className="aiv5-modal-sum-label">선택 서비스</div>
              <div>
                {[...selectedSvcs.values()].map(s => (
                  <div key={s.id} className="aiv5-modal-sum-item">
                    <span>{s.code} {s.name}</span>
                    <span>{s.priceLabel}</span>
                  </div>
                ))}
              </div>
              <div className="aiv5-modal-sum-total">
                <span>합계</span>
                <span>{totalLabel}{hasMonthly ? ' +월정액' : ''}</span>
              </div>
            </div>

            <form onSubmit={submitForm}>
              <div className="aiv5-form-row">
                <label className="aiv5-form-label">이름 <em>*</em></label>
                <input
                  className="aiv5-form-ctrl"
                  type="text"
                  placeholder="홍길동"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                />
              </div>
              <div className="aiv5-form-row">
                <label className="aiv5-form-label">연락처 <em>*</em></label>
                <input
                  className="aiv5-form-ctrl"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={formPhone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  required
                />
              </div>
              <div className="aiv5-form-row">
                <label className="aiv5-form-label">카카오톡 ID (선택)</label>
                <input
                  className="aiv5-form-ctrl"
                  type="text"
                  placeholder="kakao_id"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                />
              </div>
              <div className="aiv5-form-row">
                <label className="aiv5-form-label">현재 상태 / 문의 내용</label>
                <textarea
                  className="aiv5-form-ctrl"
                  placeholder="현재 운영 중인 사이트 주소나 상황을 간략히 적어주세요"
                  value={formMemo}
                  onChange={e => setFormMemo(e.target.value)}
                />
              </div>
              <button type="submit" className="aiv5-form-submit">상담 신청하기</button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
