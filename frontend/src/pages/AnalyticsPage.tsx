import { useState, useEffect } from 'react';
import { getSiteSettings, saveSiteSettings } from '../api';
import type { HeadSnippets } from '../types';

type Tab = 'gtm' | 'ga4' | 'meta' | 'kakao';

const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 8 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;
const cardStyle = { padding: 14, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', marginBottom: 12 } as const;
const statusDot = (active: boolean) => ({
  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
  background: active ? '#22c55e' : '#d1d5db', marginRight: 6,
} as const);

const tabBtnStyle = (active: boolean) => ({
  padding: '10px 20px', fontSize: 13, fontWeight: active ? 700 : 500,
  border: 'none', borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
  background: 'none', color: active ? '#2563eb' : '#64748b', cursor: 'pointer',
} as const);

const linkBtnStyle = (bg: string, color: string = '#fff') => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', borderRadius: 6, border: 'none',
  background: bg, color, fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none',
} as const);

function ExternalLink({ href, label, bg, color }: { href: string; label: string; bg: string; color?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={linkBtnStyle(bg, color)}>
      {label} ↗
    </a>
  );
}

function StatusBanner({ active, activeText, inactiveText }: { active: boolean; activeText: string; inactiveText: string }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8, marginBottom: 16,
      background: active ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${active ? '#bbf7d0' : '#fecaca'}`,
      display: 'flex', alignItems: 'center', fontSize: 13,
    }}>
      <span style={statusDot(active)} />
      <span style={{ color: active ? '#166534' : '#991b1b', fontWeight: 600 }}>
        {active ? activeText : inactiveText}
      </span>
    </div>
  );
}

function GuideStep({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', background: '#eff6ff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#2563eb', flexShrink: 0,
      }}>{step}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

/* ── GTM Tab ── */
function GtmTab({ snippets, onChange }: { snippets: HeadSnippets; onChange: (s: HeadSnippets) => void }) {
  return (
    <div>
      <StatusBanner
        active={!!snippets.gtmId}
        activeText={`GTM 연동됨 (${snippets.gtmId})`}
        inactiveText="GTM이 설정되지 않았습니다"
      />

      <div style={cardStyle}>
        <label style={labelStyle}>GTM 컨테이너 ID</label>
        <input
          value={snippets.gtmId || ''}
          onChange={(e) => onChange({ ...snippets, gtmId: e.target.value })}
          placeholder="GTM-XXXXXXX"
          style={inputStyle}
        />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>설치 가이드</div>
        <GuideStep step={1} title="GTM 계정 생성" desc="tagmanager.google.com에서 새 컨테이너를 생성하세요" />
        <GuideStep step={2} title="컨테이너 ID 입력" desc="GTM-XXXXXXX 형식의 ID를 위 필드에 입력하세요" />
        <GuideStep step={3} title="사이트 배포" desc="저장 후 사이트를 배포하면 GTM 코드가 자동 삽입됩니다" />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>GTM에서 관리할 수 있는 태그</div>
        {['GA4 (Google Analytics 4)', 'Meta Pixel (Facebook/Instagram)', 'Kakao Pixel', 'Google Ads 전환 추적', 'Hotjar / Microsoft Clarity'].map((tag) => (
          <div key={tag} style={{ padding: '6px 0', fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#cbd5e1' }}>&#9634;</span> {tag}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <ExternalLink href="https://tagmanager.google.com" label="GTM 바로가기" bg="#4285f4" />
      </div>
    </div>
  );
}

/* ── GA4 Tab ── */
function Ga4Tab({ snippets }: { snippets: HeadSnippets }) {
  return (
    <div>
      <StatusBanner
        active={!!snippets.ga4Id}
        activeText={`GA4 연동됨 (${snippets.ga4Id})`}
        inactiveText="GA4 측정 ID가 설정되지 않았습니다"
      />

      {!snippets.ga4Id && (
        <div style={{ ...cardStyle, background: '#fffbeb', borderColor: '#fde68a' }}>
          <div style={{ fontSize: 12, color: '#92400e' }}>
            SEO & 마케팅 설정에서 GA4 측정 ID를 먼저 입력하세요.
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>핵심 GA4 리포트</div>
        {[
          { title: '실시간 보고서', desc: '현재 사이트 방문자 수와 활동을 실시간으로 확인' },
          { title: '획득 보고서', desc: '방문자가 어떤 채널(검색, 직접, SNS)에서 유입되는지 분석' },
          { title: '참여도 보고서', desc: '페이지별 체류 시간, 이탈률, 스크롤 깊이 확인' },
          { title: '전환 보고서', desc: '목표 달성 현황 (문의, 구매, 회원가입 등)' },
        ].map((item) => (
          <div key={item.title} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{item.title}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>추천 이벤트</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['page_view', 'scroll', 'click', 'form_submit', 'purchase', 'sign_up', 'search'].map((ev) => (
            <span key={ev} style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
              background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
            }}>{ev}</span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <ExternalLink href="https://analytics.google.com" label="GA4 바로가기" bg="#E37400" />
      </div>
    </div>
  );
}

/* ── Meta Pixel Tab ── */
function MetaPixelTab({ snippets, onChange }: { snippets: HeadSnippets; onChange: (s: HeadSnippets) => void }) {
  return (
    <div>
      <StatusBanner
        active={!!snippets.metaPixelId}
        activeText={`Meta Pixel 연동됨 (${snippets.metaPixelId})`}
        inactiveText="Meta Pixel이 설정되지 않았습니다"
      />

      <div style={cardStyle}>
        <label style={labelStyle}>Meta Pixel ID</label>
        <input
          value={snippets.metaPixelId || ''}
          onChange={(e) => onChange({ ...snippets, metaPixelId: e.target.value })}
          placeholder="123456789012345"
          style={inputStyle}
        />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>설치 가이드</div>
        <GuideStep step={1} title="Meta Business Suite 접속" desc="business.facebook.com에서 Pixel을 생성하세요" />
        <GuideStep step={2} title="Pixel ID 입력" desc="생성된 숫자 ID를 위 필드에 입력하세요" />
        <GuideStep step={3} title="사이트 배포" desc="저장 후 배포하면 Meta Pixel 코드가 자동 삽입됩니다" />
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>표준 이벤트</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['PageView', 'ViewContent', 'AddToCart', 'Purchase', 'Lead', 'CompleteRegistration', 'Search', 'Contact'].map((ev) => (
            <span key={ev} style={{
              padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
              background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
            }}>{ev}</span>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Meta Pixel Helper</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>
          Chrome 확장 프로그램 "Meta Pixel Helper"를 설치하면 픽셀이 정상 작동하는지 확인할 수 있습니다.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <ExternalLink href="https://business.facebook.com" label="Meta Business 바로가기" bg="#1877F2" />
        <ExternalLink href="https://developers.facebook.com/tools/debug/" label="공유 디버거" bg="#475569" />
      </div>
    </div>
  );
}

/* ── Kakao Tab ── */
function KakaoTab({ snippets, onChange }: { snippets: HeadSnippets; onChange: (s: HeadSnippets) => void }) {
  return (
    <div>
      <StatusBanner
        active={!!snippets.kakaoPixelId}
        activeText={`카카오 Pixel 연동됨 (${snippets.kakaoPixelId})`}
        inactiveText="카카오 Pixel이 설정되지 않았습니다"
      />

      <div style={cardStyle}>
        <label style={labelStyle}>카카오 Pixel ID</label>
        <input
          value={snippets.kakaoPixelId || ''}
          onChange={(e) => onChange({ ...snippets, kakaoPixelId: e.target.value })}
          placeholder="카카오 Pixel ID"
          style={inputStyle}
        />
      </div>

      <div style={cardStyle}>
        <label style={labelStyle}>카카오톡 채널 ID</label>
        <input
          value={snippets.kakaoChannelId || ''}
          onChange={(e) => onChange({ ...snippets, kakaoChannelId: e.target.value })}
          placeholder="@채널명"
          style={inputStyle}
        />
        <div style={{ fontSize: 11, color: '#94a3b8' }}>카카오톡 채널 홈 URL에서 확인할 수 있습니다</div>
      </div>

      <div style={cardStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>공유 링크 디버거</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          카카오톡으로 공유할 때 OG 태그가 제대로 표시되는지 확인하고, 캐시를 초기화할 수 있습니다.
        </div>
        {snippets.ogTitle && (
          <div style={{ padding: 10, borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>현재 OG 태그 설정:</div>
            <div style={{ fontSize: 12, color: '#1e293b' }}><strong>제목:</strong> {snippets.ogTitle}</div>
            {snippets.ogDescription && <div style={{ fontSize: 12, color: '#1e293b' }}><strong>설명:</strong> {snippets.ogDescription}</div>}
            {snippets.ogImage && <div style={{ fontSize: 12, color: '#1e293b' }}><strong>이미지:</strong> 설정됨</div>}
          </div>
        )}
        <ExternalLink href="https://developers.kakao.com/tool/debugger/sharing" label="카카오 공유 디버거" bg="#FEE500" color="#3C1E1E" />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <ExternalLink href="https://business.kakao.com" label="카카오 비즈보드" bg="#FEE500" color="#3C1E1E" />
      </div>
    </div>
  );
}

/* ── Main Page ── */
export function AnalyticsPage({ siteId }: { siteId: string }) {
  const [tab, setTab] = useState<Tab>('gtm');
  const [snippets, setSnippets] = useState<HeadSnippets>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siteId) return;
    getSiteSettings(siteId)
      .then((data: { headSnippets: HeadSnippets }) => setSnippets(data.headSnippets || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    try {
      await saveSiteSettings({ siteId, headSnippets: snippets });
      setMsg('저장 완료. 다음 배포 시 반영됩니다.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>불러오는 중...</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        <button style={tabBtnStyle(tab === 'gtm')} onClick={() => setTab('gtm')}>GTM</button>
        <button style={tabBtnStyle(tab === 'ga4')} onClick={() => setTab('ga4')}>GA4</button>
        <button style={tabBtnStyle(tab === 'meta')} onClick={() => setTab('meta')}>메타 픽셀</button>
        <button style={tabBtnStyle(tab === 'kakao')} onClick={() => setTab('kakao')}>카카오 도구</button>
      </div>

      {tab === 'gtm' && <GtmTab snippets={snippets} onChange={setSnippets} />}
      {tab === 'ga4' && <Ga4Tab snippets={snippets} />}
      {tab === 'meta' && <MetaPixelTab snippets={snippets} onChange={setSnippets} />}
      {tab === 'kakao' && <KakaoTab snippets={snippets} onChange={setSnippets} />}

      {tab !== 'ga4' && (
        <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleSave} disabled={saving} style={{
            padding: '10px 24px', borderRadius: 6, border: 'none',
            background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            {saving ? '저장 중...' : '설정 저장'}
          </button>
          {msg && <span style={{ fontSize: 12, color: msg.includes('실패') ? '#dc2626' : '#059669' }}>{msg}</span>}
        </div>
      )}
    </div>
  );
}
