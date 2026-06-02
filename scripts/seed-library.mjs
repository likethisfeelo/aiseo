#!/usr/bin/env node
// ============================================================
// seed-library.mjs — AI SEO Library 초기 데이터 적재 (one-shot).
// ------------------------------------------------------------
// 14개 placeholder 포스트 + 2개 표지(Cover) 를 DynamoDB 에 작성.
// 포스트 제목은 frontend/public/library/index.html 의 BOOKS 배열
// (line 1172-1187) 과 동일. lead/bodyHtml 은 placeholder.
//
// 실행:
//   AWS_PROFILE=aiseo node scripts/seed-library.mjs
//   AWS_PROFILE=aiseo node scripts/seed-library.mjs --force   # 기존 데이터 덮어쓰기
//
// 한 번 실행 후 어드민 UI(/admin/library/posts) 에서 lead/body 보강.
// ============================================================

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

const REGION = process.env.AWS_REGION || 'ap-northeast-2';
const FORCE = process.argv.includes('--force');

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

const T_COVERS = 'aiseo-library-covers';
const T_POSTS = 'aiseo-library-posts';
const T_JOINS = 'aiseo-library-cover-posts';

const pad4 = (n) => String(n).padStart(4, '0');

// 카테고리: c="case" → success stories, c="play" → playbooks.
// col 은 표지 카드 배경색 — frontend 의 prismatic 그라데이션 키.
const BOOKS = [
  { slug: 'wedding-snap-brand-search',  title: '구글에 내 브랜드 검색되게 만들기 — 웨딩스냅 1인작가 스튜디오', c: 'case', readMinutes: 4 },
  { slug: 'ai-marketing-homepage-first',title: 'AI 마케팅의 시작은 홈페이지가 맞을까?',                       c: 'case', readMinutes: 3 },
  { slug: 'solo-studio-search-setup',   title: '1인 대표·작가님을 위한 스튜디오 검색 노출 셋업',                c: 'case', readMinutes: 4 },
  { slug: 'ai-homepage-checklist',      title: 'AI로 홈페이지 제대로 만들 때, 체크리스트',                     c: 'play', readMinutes: 6 },
  { slug: 'seo-aeo-geo-strategy',       title: 'SEO·AEO·GEO 통합 최적화 전략',                              c: 'play', readMinutes: 5 },
  { slug: 'ga4-search-console-direction',title: 'GA4·서치콘솔 데이터로 개선 방향 잡기',                       c: 'play', readMinutes: 4 },
  { slug: 'ai-site-self-deploy-seo',    title: 'AI 사이트, 나 혼자 SEO 노리고 제대로 배포하기',                c: 'play', readMinutes: 5 },
  { slug: 'b2b-manufacturing-rec',      title: '구글·Bing에서 우리 회사 추천하게 만들기 — B2B 제조 설비 업체', c: 'case', readMinutes: 5 },
  { slug: 'seo-prompt-tips',            title: '사이트가 SEO에 더 잘 걸리게 하는 프롬프트 비법',                c: 'play', readMinutes: 3 },
  { slug: 'organic-traffic-2x-3mo',     title: '3개월 만에 오가닉 트래픽 2배로',                              c: 'case', readMinutes: 4 },
  { slug: 'ai-citation-content-structure',title: 'AI 인용 점유율을 올리는 콘텐츠 구조',                       c: 'play', readMinutes: 5 },
  { slug: 'kakao-og-debug-notes',       title: '카카오 공유 OG 태그 디버깅 노트',                             c: 'play', readMinutes: 3 },
  { slug: 'keyword-to-context-discovery',title: "검색 키워드 발굴에서 '나를 찾는 맥락 찾기'로",                 c: 'case', readMinutes: 4 },
  { slug: 'brand-presence-in-ai',       title: 'AI에서 내 브랜드 검색 현황 점검하는 법',                       c: 'play', readMinutes: 4 },
];

const COVERS = [
  {
    slug: 'case-studies',
    title: '성공사례',
    description: '실제 브랜드들이 AI 검색 노출을 만든 과정 — 무엇을 바꿨고, 어디서 성과가 나왔는지.',
    tag: 'Case Studies',
    sortOrder: 1,
  },
  {
    slug: 'playbooks',
    title: 'SEO·AEO·GEO 플레이북',
    description: 'AI 검색 시대에 통하는 사이트·콘텐츠·운영 전략. 바로 따라 쓸 수 있는 단계별 가이드.',
    tag: 'Playbooks',
    sortOrder: 2,
  },
];

// 카테고리 → 표지 매핑.
const CATEGORY_TO_COVER = { case: 'case-studies', play: 'playbooks' };

const placeholderBodyHtml = (title) => `
<p>이 글은 곧 정식 발행될 챕터의 placeholder 입니다. 어드민(/admin/library/posts) 에서 본문을 채워 주세요.</p>
<h2>이 글에서 다룰 것</h2>
<ul>
  <li>${title} 의 핵심 맥락과 시작점</li>
  <li>실행 단계와 우선순위</li>
  <li>성과 측정 포인트</li>
</ul>
<p>본문 작성 가이드는 <code>docs/blog-feature-overview.md</code> 와 동일한 톤·구조를 따르며,
   <strong>읽기 시간 4~6분</strong> 분량으로 작성합니다.</p>
<h3>다음에 읽으면 좋은 글</h3>
<p>같은 표지의 다른 챕터를 사이드바에서 확인할 수 있습니다.</p>
`.trim();

const placeholderLead = (title) =>
  `${title} — 이 챕터는 placeholder 입니다. 어드민에서 도입부(미리보기로 항상 노출되는 lead) 를 채워 주세요. 약 2-3문장 정도면 적당하며, 독자가 더 읽고 싶게 만드는 훅을 담는 게 좋습니다.`;

const nowIso = new Date().toISOString();

const upsertIfMissing = async (TableName, Key, Item, label) => {
  if (!FORCE) {
    const existing = await ddb.send(new GetCommand({ TableName, Key }));
    if (existing.Item) {
      console.log(`  • SKIP ${label} (exists)`);
      return false;
    }
  }
  await ddb.send(new PutCommand({ TableName, Item }));
  console.log(`  ✓ PUT  ${label}`);
  return true;
};

const seed = async () => {
  console.log(`\n=== AI SEO Library seed (region=${REGION}, force=${FORCE}) ===\n`);

  console.log('[1/3] 표지(Cover) 작성');
  for (const c of COVERS) {
    const item = {
      slug: c.slug,
      title: c.title,
      description: c.description,
      thumbnail: '',
      tag: c.tag,
      sortOrder: c.sortOrder,
      isPublished: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await upsertIfMissing(T_COVERS, { slug: c.slug }, item, `cover/${c.slug}`);
  }

  console.log('\n[2/3] 포스트(Post) 작성');
  for (const b of BOOKS) {
    const canonicalCoverSlug = CATEGORY_TO_COVER[b.c] || 'playbooks';
    const item = {
      slug: b.slug,
      title: b.title,
      tag: b.c === 'case' ? '성공사례' : 'SEO전략',
      author: 'AISEO',
      publishedAt: nowIso,
      readMinutes: b.readMinutes,
      lead: placeholderLead(b.title),
      bodyHtml: placeholderBodyHtml(b.title),
      canonicalCoverSlug,
      seoMeta: {
        description: placeholderLead(b.title).slice(0, 160),
        keywords: 'AI SEO,AEO,GEO',
        ogTitle: b.title,
        ogDescription: placeholderLead(b.title).slice(0, 200),
        ogImage: '',
      },
      isPublished: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await upsertIfMissing(T_POSTS, { slug: b.slug }, item, `post/${b.slug}`);
  }

  console.log('\n[3/3] 표지↔포스트 매핑');
  // BOOKS 의 배열 순서를 그대로 cover 별 sortOrder 로 사용. case-studies 와
  // playbooks 각각 1부터 다시 시작.
  const counters = { 'case-studies': 0, playbooks: 0 };
  for (const b of BOOKS) {
    const coverSlug = CATEGORY_TO_COVER[b.c];
    if (!coverSlug) continue;
    counters[coverSlug] += 1;
    const sortOrder = counters[coverSlug];
    const sortKey = `${pad4(sortOrder)}#${b.slug}`;
    const item = { coverSlug, sortKey, postSlug: b.slug, sortOrder };
    await upsertIfMissing(
      T_JOINS,
      { coverSlug, sortKey },
      item,
      `${coverSlug} #${sortOrder} → ${b.slug}`,
    );
  }

  console.log('\n=== seed complete ===');
  console.log(`  Covers: ${COVERS.length}`);
  console.log(`  Posts : ${BOOKS.length}`);
  console.log(`  Joins : ${BOOKS.length} (1 cover per post)\n`);
};

seed().catch((e) => {
  console.error('seed failed:', e);
  process.exit(1);
});
