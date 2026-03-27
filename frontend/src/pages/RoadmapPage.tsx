import { useState } from 'react';
import type { RoadmapStage } from '../types';

interface RoadmapData {
  id: string;
  title: string;
  subtitle: string;
  currentStage: number;
  stages: RoadmapStage[];
}

const ROADMAPS: RoadmapData[] = [
  {
    id: 'wedding',
    title: '웨딩스냅 작가',
    subtitle: '1인 작가에서 스튜디오 운영까지',
    currentStage: 2,
    stages: [
      {
        stage: 1, title: '1인 작가 시작', status: 'done',
        businessTrack: ['포트폴리오 완성', '인스타그램 운영 시작', '커뮤니티 플랫폼 등록'],
        marketingTrack: ['기본 홈페이지 개설', 'Naver Place 등록', 'Google Business 등록'],
      },
      {
        stage: 2, title: '검색 유입 시작', status: 'current',
        businessTrack: ['월 6-10건 문의 확보', '촬영 패키지 세분화', '리뷰 수집 시스템'],
        marketingTrack: ['Search Console 설정', 'GA4 전환 추적', '블로그 SEO 콘텐츠'],
        metrics: [{ label: '월 문의', value: '6-10건' }, { label: '월 매출', value: '300-500만' }],
      },
      {
        stage: 3, title: '팀 빌딩', status: 'next',
        businessTrack: ['보조 작가 채용', '2인 팀 운영', '장비 투자'],
        marketingTrack: ['Google Ads 시작', 'Naver 검색 광고', '리타겟팅 캠페인'],
      },
      {
        stage: 4, title: '스튜디오 확장', status: 'next',
        businessTrack: ['스튜디오 공간 확보', '3-5인 운영', '웨딩 박람회 참가'],
        marketingTrack: ['콘텐츠 자동화', 'AEO 최적화', '월간 리포트 자동화'],
      },
      {
        stage: 5, title: '브랜드 확립', status: 'next',
        businessTrack: ['다지점 또는 아카데미', '파트너 사진관 네트워크', '브랜드 라이선싱'],
        marketingTrack: ['파트너 마케팅', '이메일 자동화', 'UGC 캠페인'],
      },
    ],
  },
  {
    id: 'workshop',
    title: '가방 공방',
    subtitle: '원데이 클래스에서 브랜드 상품까지',
    currentStage: 2,
    stages: [
      {
        stage: 1, title: '단발성 클래스', status: 'done',
        businessTrack: ['원데이 클래스 운영', '숨고/Class101 등록', '기본 홈페이지'],
        marketingTrack: ['AISEO 사이트 개설', 'Instagram 운영', 'Naver Place 등록'],
      },
      {
        stage: 2, title: '정규 수업 확장', status: 'current',
        businessTrack: ['4주 커리큘럼 개설', '정기 수강생 확보', '소량 완제품 판매'],
        marketingTrack: ['Search Console 등록', '지역 SEO 최적화', 'GA4 설치'],
        metrics: [{ label: '월 매출', value: '150-300만' }, { label: '정기 수강생', value: '8-15명' }],
      },
      {
        stage: 3, title: '상품 판매 시작', status: 'next',
        businessTrack: ['스마트스토어 오픈', '소량 제품 라인업', 'B2C 직접 판매'],
        marketingTrack: ['쇼핑 광고 시작', 'Naver 검색 광고', '상품 리뷰 SEO'],
      },
      {
        stage: 4, title: '제조 확대', status: 'next',
        businessTrack: ['도매/B2B 생산', '외주 제작 파트너십', '재고 관리 시스템'],
        marketingTrack: ['콘텐츠 자동화', 'D2C 강화', '이메일 마케팅'],
      },
      {
        stage: 5, title: '브랜드 확립', status: 'next',
        businessTrack: ['자체 브랜드 패키징', '프랜차이즈 키트', '인플루언서 협업'],
        marketingTrack: ['AEO 최적화', 'UGC 자동화', '월간 리포트 자동화'],
      },
    ],
  },
];

function StageCard({ stage, isLast }: { stage: RoadmapStage; isLast: boolean }) {
  const statusColor = { done: '#22c55e', current: '#2563eb', next: '#94a3b8' };
  const statusIcon = { done: '✓', current: '◎', next: '○' };
  const statusBg = { done: '#f0fdf4', current: '#eff6ff', next: '#f8fafc' };

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: statusBg[stage.status], border: `2px solid ${statusColor[stage.status]}`, color: statusColor[stage.status],
          fontSize: 12, fontWeight: 700,
        }}>
          {statusIcon[stage.status]}
        </div>
        {!isLast && <div style={{ width: 2, flex: 1, background: stage.status === 'done' ? '#86efac' : '#e2e8f0', minHeight: 20 }} />}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[stage.status] }}>Stage {stage.stage}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{stage.title}</span>
        </div>

        {stage.metrics && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            {stage.metrics.map((m) => (
              <div key={m.label} style={{ padding: '6px 12px', borderRadius: 6, background: '#eff6ff', fontSize: 12 }}>
                <span style={{ color: '#64748b' }}>{m.label}: </span>
                <span style={{ fontWeight: 600, color: '#2563eb' }}>{m.value}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          {/* Business Track */}
          <div style={{ flex: 1, padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#7c3aed', marginBottom: 6 }}>비즈니스 성장</div>
            {stage.businessTrack.map((item) => (
              <div key={item} style={{ fontSize: 12, color: '#475569', marginBottom: 3, paddingLeft: 8, borderLeft: '2px solid #e9d5ff' }}>
                {item}
              </div>
            ))}
          </div>

          {/* Marketing Track */}
          <div style={{ flex: 1, padding: 12, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', marginBottom: 6 }}>디지털 마케팅</div>
            {stage.marketingTrack.map((item) => (
              <div key={item} style={{ fontSize: 12, color: '#475569', marginBottom: 3, paddingLeft: 8, borderLeft: '2px solid #bfdbfe' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RoadmapPage() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [...ROADMAPS.map((r) => r.title), '내 로드맵'];

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>🗺 내 성장 로드맵</h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>업종별 성장 단계와 추천 디지털 마케팅 전략을 확인하세요</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2e8f0', marginBottom: 24 }}>
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '10px 20px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: activeTab === i ? 700 : 400,
              color: activeTab === i ? '#2563eb' : '#64748b', cursor: 'pointer',
              borderBottom: activeTab === i ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab < ROADMAPS.length ? (
        <div>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', margin: 0 }}>{ROADMAPS[activeTab].title}</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{ROADMAPS[activeTab].subtitle}</p>
            <div style={{ fontSize: 12, color: '#2563eb', marginTop: 4, fontWeight: 600 }}>
              현재 Stage {ROADMAPS[activeTab].currentStage} / 5
            </div>
          </div>
          {ROADMAPS[activeTab].stages.map((stage, i) => (
            <StageCard key={stage.stage} stage={stage} isLast={i === ROADMAPS[activeTab].stages.length - 1} />
          ))}
        </div>
      ) : (
        /* My Roadmap Tab */
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ marginBottom: 20 }}>
            <ProgressRing value={35} size={80} strokeWidth={6} label="전체 진행률" />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>내 맞춤 로드맵</h3>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            브랜드 정보를 완성하면 업종에 맞는 맞춤 로드맵이 생성됩니다
          </p>
          <div style={{ display: 'inline-flex', gap: 12 }}>
            <div style={{ padding: '12px 20px', borderRadius: 8, background: '#eff6ff', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#2563eb' }}>Standard</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>현재 패키지</div>
            </div>
            <div style={{ padding: '12px 20px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: '#475569' }}>35%</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>완성도</div>
            </div>
          </div>
          <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: 'linear-gradient(135deg, #f3e8ff, #eff6ff)', maxWidth: 400, margin: '24px auto 0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>업종 맞춤 컨설팅</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>1:1 컨설팅으로 맞춤 로드맵을 만들어 보세요</div>
            <button style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#7c3aed', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
              컨설팅 신청
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressRing({ value, size, strokeWidth, label }: { value: number; size: number; strokeWidth: number; label: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(value / 100, 1);
  const offset = circumference * (1 - percent);

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2563eb" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{value}%</span>
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
    </div>
  );
}
