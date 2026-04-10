import { useEffect, useState, type FormEvent } from 'react';
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

const ADDONS: AddOn[] = [
  {
    code: '001',
    codeClass: 'pre',
    name: 'SEO 검색노출전략 점검',
    desc: '업종·키워드·경쟁군 분석 포함',
    price: '+20만원',
  },
  {
    code: '002',
    codeClass: 'pre',
    name: '홈페이지 및 콘텐츠 기획·내용 설계',
    desc: '메뉴 구조·CTA·소개문장 설계',
    price: '+10만원',
  },
  {
    code: 'MNT 2',
    codeClass: 'mnt',
    name: '독립 도메인 연결 지원',
    desc: '1회 직접 연결 대행',
    price: '+10만원',
  },
  {
    code: 'MNT 4',
    codeClass: 'mnt',
    name: '월간 점검 관리',
    desc: '백업 + 월 1회 보고',
    price: '+10만원/월',
  },
];

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

  // Suppress unused warnings until Phase 8 wires them up
  void PACKAGES; void ADDONS;
  void modalOpen;
  void formEmail; void setFormEmail;
  void formMemo; void setFormMemo;
  void handlePhoneChange;
  void closeModal; void submitForm;
  void hasMonthly;
  void ReactDOM;

  const route = selectedState ? ROUTES[selectedState] : null;

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
              onClick={() => setSelectedState(p.id)}
            >
              <span className="aiv5-preset-icon">{p.icon}</span> {p.label}
            </button>
          ))}
        </div>

        <div className="aiv5-diagnosis-layout">
          {/* Left: State Cards */}
          <div className="aiv5-state-panel">
            {STATES.map(s => (
              <button
                key={s.id}
                type="button"
                className={`aiv5-state-card${selectedState === s.id ? ' active' : ''}`}
                onClick={() => setSelectedState(s.id)}
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

          {/* Right: Result Panel */}
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
                </div>
              </div>
            )}
          </div>
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

        <div className="aiv5-accordion">
          {MODULES.map((cat, ci) => (
            <div key={ci}>
              <div className={`aiv5-acc-category-header${cat.core ? ' is-core' : ''}`}>
                <span className="aiv5-acc-category-icon">{cat.icon}</span>
                <div>
                  <strong>{cat.title}</strong>
                  <span>{cat.sub}</span>
                </div>
              </div>

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
          ))}
        </div>
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

        <div className="aiv5-services-layout">
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
        </div>
      </section>

      {/* Step 4/CTA/modal rendered in Phase 8 */}
    </div>
  );
}
