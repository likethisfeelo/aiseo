import { useState } from 'react';

/* ── Example roadmap data (hardcoded for reference) ── */
interface StageItem {
  text: string;
  done?: boolean;
}

interface Stage {
  stage: number;
  title: string;
  status: 'done' | 'current' | 'next';
  businessTrack: StageItem[];
  marketingTrack: StageItem[];
  metrics?: { label: string; value: string }[];
}

const EXAMPLE_ROADMAPS = [
  {
    id: 'wedding',
    title: '웨딩스냅 작가',
    subtitle: '1인 작가에서 스튜디오 운영까지',
    stages: [
      { stage: 1, title: '1인 작가 시작', status: 'done' as const,
        businessTrack: [{ text: '포트폴리오 완성', done: true }, { text: '인스타그램 운영 시작', done: true }, { text: '커뮤니티 플랫폼 등록', done: true }],
        marketingTrack: [{ text: '기본 홈페이지 개설', done: true }, { text: 'Naver Place 등록', done: true }, { text: 'Google Business 등록', done: true }],
      },
      { stage: 2, title: '검색 유입 시작', status: 'current' as const,
        businessTrack: [{ text: '월 6-10건 문의 확보' }, { text: '촬영 패키지 세분화' }, { text: '리뷰 수집 시스템' }],
        marketingTrack: [{ text: 'Search Console 설정' }, { text: 'GA4 전환 추적' }, { text: '블로그 SEO 콘텐츠' }],
        metrics: [{ label: '월 문의', value: '6-10건' }, { label: '월 매출', value: '300-500만' }],
      },
      { stage: 3, title: '팀 빌딩', status: 'next' as const,
        businessTrack: [{ text: '보조 작가 채용' }, { text: '2인 팀 운영' }],
        marketingTrack: [{ text: 'Google Ads 시작' }, { text: 'Naver 검색 광고' }],
      },
    ],
  },
  {
    id: 'workshop',
    title: '가방 공방',
    subtitle: '원데이 클래스에서 브랜드 상품까지',
    stages: [
      { stage: 1, title: '단발성 클래스', status: 'done' as const,
        businessTrack: [{ text: '원데이 클래스 운영', done: true }, { text: '숨고/Class101 등록', done: true }],
        marketingTrack: [{ text: 'AISEO 사이트 개설', done: true }, { text: 'Instagram 운영', done: true }],
      },
      { stage: 2, title: '정규 수업 확장', status: 'current' as const,
        businessTrack: [{ text: '4주 커리큘럼 개설' }, { text: '정기 수강생 확보' }],
        marketingTrack: [{ text: 'Search Console 등록' }, { text: '지역 SEO 최적화' }],
        metrics: [{ label: '월 매출', value: '150-300만' }, { label: '정기 수강생', value: '8-15명' }],
      },
      { stage: 3, title: '상품 판매 시작', status: 'next' as const,
        businessTrack: [{ text: '스마트스토어 오픈' }, { text: '소량 제품 라인업' }],
        marketingTrack: [{ text: '쇼핑 광고 시작' }, { text: 'Naver 검색 광고' }],
      },
    ],
  },
];

function StageCard({ stage }: { stage: Stage }) {
  const statusColor = { done: 'var(--success)', current: 'var(--primary)', next: 'var(--text-muted)' };
  const statusIcon = { done: '✓', current: '◎', next: '○' };
  const statusBg = { done: 'var(--success-soft)', current: 'var(--primary-soft)', next: 'var(--bg-soft)' };

  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 }}>
        <div style={{
          width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: statusBg[stage.status], border: `2px solid ${statusColor[stage.status]}`,
          color: statusColor[stage.status], fontSize: 11, fontWeight: 700,
        }}>{statusIcon[stage.status]}</div>
        <div style={{ width: 2, flex: 1, background: stage.status === 'done' ? 'var(--success)' : 'var(--border)', minHeight: 12 }} />
      </div>

      <div style={{ flex: 1, paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[stage.status] }}>Stage {stage.stage}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{stage.title}</span>
        </div>

        {stage.metrics && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            {stage.metrics.map((m) => (
              <div key={m.label} style={{ padding: '4px 10px', borderRadius: 6, background: 'var(--primary-soft)', fontSize: 11 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{m.label}: </span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{m.value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, padding: 10, borderRadius: 8, background: '#fff', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent-dark)', marginBottom: 4 }}>비즈니스</div>
            {stage.businessTrack.map((item) => (
              <div key={item.text} style={{ fontSize: 12, color: item.done ? 'var(--success)' : 'var(--text-secondary)', marginBottom: 2 }}>
                {item.done ? '✓ ' : '· '}{item.text}
              </div>
            ))}
          </div>
          <div style={{ flex: 1, padding: 10, borderRadius: 8, background: '#fff', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>디지털 마케팅</div>
            {stage.marketingTrack.map((item) => (
              <div key={item.text} style={{ fontSize: 12, color: item.done ? 'var(--success)' : 'var(--text-secondary)', marginBottom: 2 }}>
                {item.done ? '✓ ' : '· '}{item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoadmapPage() {
  const [tab, setTab] = useState<'my' | 'examples'>('my');
  const [exampleIdx, setExampleIdx] = useState(0);

  // TODO: Fetch user's roadmap from API. For now, assume no roadmap exists.
  const hasRoadmap = false;

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
        <button onClick={() => setTab('my')} style={{
          padding: '10px 20px', border: 'none', background: 'transparent', fontSize: 14,
          fontWeight: tab === 'my' ? 700 : 400, color: tab === 'my' ? 'var(--primary)' : 'var(--text-secondary)',
          cursor: 'pointer', borderBottom: tab === 'my' ? '2px solid var(--primary)' : '2px solid transparent',
          marginBottom: -2, fontFamily: 'inherit',
        }}>🗺 내 로드맵</button>
        <button onClick={() => setTab('examples')} style={{
          padding: '10px 20px', border: 'none', background: 'transparent', fontSize: 14,
          fontWeight: tab === 'examples' ? 700 : 400, color: tab === 'examples' ? 'var(--primary)' : 'var(--text-secondary)',
          cursor: 'pointer', borderBottom: tab === 'examples' ? '2px solid var(--primary)' : '2px solid transparent',
          marginBottom: -2, fontFamily: 'inherit',
        }}>📋 업종별 예시</button>
      </div>

      {tab === 'my' ? (
        /* ── My Roadmap ── */
        hasRoadmap ? (
          /* Roadmap exists (컨설팅 후) - will be populated by consultant */
          <div>
            <p>로드맵이 표시됩니다</p>
          </div>
        ) : (
          /* No roadmap yet (컨설팅 전) */
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🗺</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: "'Noto Serif KR', serif" }}>
              아직 로드맵이 생성되지 않았어요
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
              1:1 컨설팅을 통해 업종과 현재 상황에 맞는<br />
              맞춤 성장 로드맵을 만들어 드립니다.
            </p>

            {/* What you get */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border)', padding: 24, maxWidth: 480, margin: '0 auto 24px', textAlign: 'left' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>컨설팅에서 받으실 수 있는 것</h4>
              {[
                '현재 비즈니스 단계 진단',
                '업종 맞춤 5단계 성장 플랜',
                '단계별 비즈니스 + 디지털 마케팅 액션 아이템',
                '우선순위 추천 및 예상 지표',
                '컨설턴트의 맞춤 메모와 조언',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'var(--success)', fontSize: 14 }}>✓</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>

            <button style={{
              padding: '14px 32px', borderRadius: 10, border: 'none', background: 'var(--primary)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}>
              1:1 컨설팅 신청하기 →
            </button>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
              아래 "업종별 예시" 탭에서 참고 로드맵을 미리 확인할 수 있어요
            </p>
          </div>
        )
      ) : (
        /* ── Example Roadmaps ── */
        <div>
          {/* Example Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {EXAMPLE_ROADMAPS.map((r, i) => (
              <button key={r.id} onClick={() => setExampleIdx(i)} style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: exampleIdx === i ? 600 : 400,
                background: exampleIdx === i ? 'var(--primary)' : 'var(--border-soft)',
                color: exampleIdx === i ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>{r.title}</button>
            ))}
          </div>

          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{EXAMPLE_ROADMAPS[exampleIdx].title}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>{EXAMPLE_ROADMAPS[exampleIdx].subtitle}</p>
          </div>

          <div style={{ background: 'var(--warning-soft)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--warning-dark)', marginBottom: 20 }}>
            💡 이 로드맵은 참고용 예시입니다. 실제 로드맵은 1:1 컨설팅을 통해 맞춤 제작됩니다.
          </div>

          {EXAMPLE_ROADMAPS[exampleIdx].stages.map((stage) => (
            <StageCard key={stage.stage} stage={stage} />
          ))}
        </div>
      )}
    </div>
  );
}
