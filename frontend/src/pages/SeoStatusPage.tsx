import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSeoSnapshots, saveSeoSnapshot, deleteSeoSnapshot, getSiteSettings, createImageUploadUrl } from '../api';
import { ProgressRing } from '../components/common/ProgressRing';
import type { HeadSnippets, SeoSnapshot, SnapshotEntry, SnapshotChannel } from '../types';

/* ── Shared Styles ── */
const tabBtnStyle = (active: boolean) => ({
  padding: '10px 20px', fontSize: 13, fontWeight: active ? 700 : 500,
  border: 'none', borderBottom: active ? '3px solid #2563eb' : '3px solid transparent',
  background: 'none', color: active ? '#2563eb' : '#64748b', cursor: 'pointer',
} as const);
const cardStyle = { padding: 14, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', marginBottom: 12 } as const;
const inputStyle = { width: '100%', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 8 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 } as const;
const statusDot = (on: boolean) => ({ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: on ? '#22c55e' : '#d1d5db', marginRight: 6 } as const);

type Tab = 'snapshot' | 'health' | 'tools';

/* ── Channel Definitions ── */
const CHANNEL_GROUPS: { label: string; channels: { value: SnapshotChannel; label: string }[] }[] = [
  { label: '검색엔진', channels: [
    { value: 'google-search', label: '구글 검색' }, { value: 'naver-search', label: '네이버 검색' },
    { value: 'google-image', label: '구글 이미지' }, { value: 'naver-image', label: '네이버 이미지' },
  ]},
  { label: 'SNS', channels: [
    { value: 'instagram-hashtag', label: '인스타그램 해시태그' }, { value: 'naver-blog', label: '네이버 블로그' },
  ]},
  { label: '지도', channels: [
    { value: 'google-map', label: '구글 지도' }, { value: 'naver-place', label: '네이버 플레이스' },
  ]},
];

const CHANNEL_LABEL: Record<string, string> = {};
CHANNEL_GROUPS.forEach((g) => g.channels.forEach((c) => { CHANNEL_LABEL[c.value] = c.label; }));

function formatEntry(e: SnapshotEntry): string {
  const parts: string[] = [];
  if (e.isExposed === false) return '노출 없음';
  if (e.isExposed === true) parts.push('노출됨');
  if (e.pageNumber) parts.push(`${e.pageNumber}페이지`);
  if (e.rank) parts.push(`${e.rank}위`);
  if (e.imageCount) parts.push(`이미지 ${e.imageCount}개`);
  if (e.postCount) parts.push(`게시물 ${e.postCount}개`);
  if (e.reviewCount) parts.push(`리뷰 ${e.reviewCount}개`);
  if (e.starRating) parts.push(`${e.starRating}점`);
  if (e.note) parts.push(e.note);
  return parts.join(', ') || '-';
}

/* ── Add Snapshot Form ── */
function AddSnapshotForm({ siteId, onSaved }: { siteId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedChannels, setSelectedChannels] = useState<Set<SnapshotChannel>>(new Set());
  const [entries, setEntries] = useState<Record<string, Partial<SnapshotEntry>>>({});
  const [memo, setMemo] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const pasteRef = useRef<HTMLDivElement>(null);

  const toggleChannel = (ch: SnapshotChannel) => {
    const next = new Set(selectedChannels);
    if (next.has(ch)) { next.delete(ch); } else { next.add(ch); }
    setSelectedChannels(next);
  };

  const updateEntry = (ch: string, field: string, value: unknown) => {
    setEntries((prev) => ({ ...prev, [ch]: { ...prev[ch], [field]: value } }));
  };

  const uploadImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const data = await createImageUploadUrl({ siteId, fileName: file.name || 'paste.png', fileType: file.type });
      await fetch(data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      setImages((prev) => [...prev, data.imageUrl]);
    } catch { /* ignore */ }
    setUploading(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadImage(file);
        break;
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!date) return;
    setSaving(true);
    const snapshotEntries: SnapshotEntry[] = [];
    selectedChannels.forEach((ch) => {
      snapshotEntries.push({ channel: ch, ...(entries[ch] || {}) } as SnapshotEntry);
    });
    try {
      await saveSeoSnapshot({ siteId, snapshot: { date, entries: snapshotEntries, memo, images } });
      setOpen(false);
      setSelectedChannels(new Set());
      setEntries({});
      setMemo('');
      setImages([]);
      onSaved();
    } catch { /* ignore */ }
    setSaving(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        width: '100%', padding: 12, borderRadius: 8, border: '2px dashed #cbd5e1',
        background: '#f8fafc', color: '#475569', fontSize: 13, cursor: 'pointer', marginBottom: 16,
      }}>
        + 새 스냅샷 기록
      </button>
    );
  }

  return (
    <div style={{ ...cardStyle, background: '#fafbfc' }} onPaste={handlePaste} ref={pasteRef}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>새 스냅샷 기록</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>✕</button>
      </div>

      <label style={labelStyle}>날짜</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />

      {CHANNEL_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase' }}>{group.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {group.channels.map((ch) => {
              const selected = selectedChannels.has(ch.value);
              return (
                <button key={ch.value} onClick={() => toggleChannel(ch.value)} style={{
                  padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  background: selected ? '#eff6ff' : '#f8fafc', color: selected ? '#2563eb' : '#64748b',
                  border: `1px solid ${selected ? '#bfdbfe' : '#e2e8f0'}`,
                }}>{ch.label}</button>
              );
            })}
          </div>
        </div>
      ))}

      {Array.from(selectedChannels).map((ch) => {
        const isSearch = ch.includes('search');
        const isImage = ch.includes('image');
        const isSns = ch === 'instagram-hashtag' || ch === 'naver-blog';
        const isMap = ch === 'google-map' || ch === 'naver-place';
        return (
          <div key={ch} style={{ padding: 10, borderRadius: 6, background: '#fff', border: '1px solid #e2e8f0', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>{CHANNEL_LABEL[ch]}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                <input type="checkbox" checked={entries[ch]?.isExposed ?? true} onChange={(e) => updateEntry(ch, 'isExposed', e.target.checked)} /> 노출됨
              </label>
              {(isSearch || isImage) && (
                <input type="number" placeholder="페이지" min={1} value={entries[ch]?.pageNumber || ''} onChange={(e) => updateEntry(ch, 'pageNumber', Number(e.target.value) || undefined)} style={{ ...inputStyle, width: 70, marginBottom: 0 }} />
              )}
              {isSearch && (
                <input type="number" placeholder="순위" min={1} value={entries[ch]?.rank || ''} onChange={(e) => updateEntry(ch, 'rank', Number(e.target.value) || undefined)} style={{ ...inputStyle, width: 70, marginBottom: 0 }} />
              )}
              {isImage && (
                <input type="number" placeholder="이미지 수" min={0} value={entries[ch]?.imageCount || ''} onChange={(e) => updateEntry(ch, 'imageCount', Number(e.target.value) || undefined)} style={{ ...inputStyle, width: 80, marginBottom: 0 }} />
              )}
              {isSns && (
                <input type="number" placeholder="게시물 수" min={0} value={entries[ch]?.postCount || ''} onChange={(e) => updateEntry(ch, 'postCount', Number(e.target.value) || undefined)} style={{ ...inputStyle, width: 80, marginBottom: 0 }} />
              )}
              {isMap && (
                <>
                  <input type="number" placeholder="리뷰 수" min={0} value={entries[ch]?.reviewCount || ''} onChange={(e) => updateEntry(ch, 'reviewCount', Number(e.target.value) || undefined)} style={{ ...inputStyle, width: 80, marginBottom: 0 }} />
                  <input type="number" placeholder="별점" min={0} max={5} step={0.1} value={entries[ch]?.starRating || ''} onChange={(e) => updateEntry(ch, 'starRating', Number(e.target.value) || undefined)} style={{ ...inputStyle, width: 70, marginBottom: 0 }} />
                </>
              )}
              <input placeholder="메모" value={entries[ch]?.note || ''} onChange={(e) => updateEntry(ch, 'note', e.target.value)} style={{ flex: 1, minWidth: 100, ...inputStyle, marginBottom: 0 }} />
            </div>
          </div>
        );
      })}

      <label style={labelStyle}>메모</label>
      <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="전체 메모 (선택)" style={{ ...inputStyle, minHeight: 40, resize: 'vertical' }} />

      <label style={labelStyle}>이미지 첨부</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {images.map((url, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
            <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} style={{
              position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%',
              background: '#ef4444', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', lineHeight: '18px', padding: 0,
            }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} id="snapshot-file" />
        <label htmlFor="snapshot-file" style={{
          padding: '5px 12px', borderRadius: 6, border: '1px dashed #cbd5e1', background: '#f8fafc',
          color: '#475569', fontSize: 11, cursor: 'pointer',
        }}>파일 선택</label>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          {uploading ? '업로드 중...' : 'Ctrl+V로 캡처 붙여넣기 가능'}
        </span>
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving || selectedChannels.size === 0} style={{
          padding: '8px 20px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>{saving ? '저장 중...' : '저장'}</button>
        <button onClick={() => setOpen(false)} style={{
          padding: '8px 16px', borderRadius: 6, border: '1px solid #d1d5db', background: '#fff', color: '#475569', fontSize: 13, cursor: 'pointer',
        }}>취소</button>
      </div>
    </div>
  );
}

/* ── Snapshot Card ── */
function SnapshotCard({ snapshot, onDelete }: { snapshot: SeoSnapshot; onDelete: () => void }) {
  const grouped: Record<string, SnapshotEntry[]> = {};
  snapshot.entries.forEach((e) => {
    const groupLabel = e.channel.includes('search') || e.channel.includes('image') ? '검색엔진' : (e.channel.includes('map') || e.channel.includes('place') ? '지도' : 'SNS');
    if (!grouped[groupLabel]) grouped[groupLabel] = [];
    grouped[groupLabel].push(e);
  });

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{snapshot.date}</span>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>🗑️</button>
      </div>
      {Object.entries(grouped).map(([group, entries]) => (
        <div key={group} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>{group}</div>
          {entries.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: '#475569', padding: '3px 0', paddingLeft: 8 }}>
              <strong>{CHANNEL_LABEL[e.channel]}:</strong> {formatEntry(e)}
            </div>
          ))}
        </div>
      ))}
      {snapshot.images && snapshot.images.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {snapshot.images.map((url, i) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <img src={url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #e2e8f0' }} />
            </a>
          ))}
        </div>
      )}
      {snapshot.memo && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>{snapshot.memo}</div>}
    </div>
  );
}

/* ── Tab 1: Snapshot Timeline ── */
function SnapshotTimeline({ siteId, snapshots, onRefresh }: { siteId: string; snapshots: SeoSnapshot[]; onRefresh: () => void }) {
  const handleDelete = async (id: string) => {
    await deleteSeoSnapshot({ siteId, snapshotId: id });
    onRefresh();
  };

  return (
    <div>
      <AddSnapshotForm siteId={siteId} onSaved={onRefresh} />
      {snapshots.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
          아직 기록된 스냅샷이 없습니다.<br />위 버튼을 눌러 첫 검색 결과를 기록하세요.
        </div>
      ) : (
        snapshots.map((s) => <SnapshotCard key={s.id} snapshot={s} onDelete={() => handleDelete(s.id)} />)
      )}
    </div>
  );
}

/* ── Tab 2: SEO Health Check ── */
function SeoHealthCheck({ snippets }: { snippets: HeadSnippets }) {
  const navigate = useNavigate();

  const checks = [
    { label: '기본 SEO', items: [
      { name: 'index.html', done: false, hint: 'SEO 검증에서 확인', link: '/site/seo' },
      { name: 'robots.txt', done: false, hint: 'SEO 검증에서 확인', link: '/site/seo' },
      { name: 'sitemap.xml', done: false, hint: 'SEO 검증에서 확인', link: '/site/seo' },
      { name: 'title 태그', done: false, hint: 'SEO 검증에서 확인', link: '/site/seo' },
      { name: 'meta description', done: false, hint: 'SEO 검증에서 확인', link: '/site/seo' },
    ]},
    { label: 'OG 태그 설정', items: [
      { name: 'og:title', done: !!snippets.ogTitle, link: '/site/seo' },
      { name: 'og:description', done: !!snippets.ogDescription, link: '/site/seo' },
      { name: 'og:image', done: !!snippets.ogImage, link: '/site/seo' },
      { name: 'og:type', done: !!snippets.ogType, link: '/site/seo' },
    ]},
    { label: '검색엔진 등록', items: [
      { name: 'Google Search Console', done: !!snippets.gscMeta, link: '/site/seo' },
      { name: 'Naver 웹마스터', done: !!snippets.naverMeta, link: '/site/seo' },
    ]},
    { label: '분석 도구 연동', items: [
      { name: 'GA4', done: !!snippets.ga4Id, link: '/analytics' },
      { name: 'GTM', done: !!snippets.gtmId, link: '/analytics' },
      { name: 'Meta Pixel', done: !!snippets.metaPixelId, link: '/analytics' },
      { name: 'Kakao Pixel', done: !!snippets.kakaoPixelId, link: '/analytics' },
    ]},
  ];

  const allItems = checks.flatMap((c) => c.items);
  const doneCount = allItems.filter((i) => i.done).length;
  const total = allItems.length;
  const basicSeoNote = '파일 업로드 후 SEO 검증 페이지에서 확인하세요';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <ProgressRing value={doneCount} max={total} size={64} strokeWidth={5} color={doneCount === total ? '#22c55e' : '#2563eb'} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{total}개 중 {doneCount}개 완료</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>SEO 최적화 진행률 {Math.round((doneCount / total) * 100)}%</div>
        </div>
      </div>

      {checks.map((section) => (
        <div key={section.label} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{section.label}</div>
          {section.label === '기본 SEO' && (
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontStyle: 'italic' }}>{basicSeoNote}</div>
          )}
          {section.items.map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={statusDot(item.done)} />
                <span style={{ fontSize: 13, color: item.done ? '#166534' : '#475569' }}>{item.name}</span>
              </div>
              {!item.done && item.link && (
                <button onClick={() => navigate(item.link!)} style={{
                  fontSize: 11, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer',
                }}>설정하기 →</button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Tab 3: External Tools ── */
const EXTERNAL_TOOLS = [
  { name: 'Google Search Console', url: 'https://search.google.com/search-console', desc: '구글 검색 성과 분석', bg: '#4285f4' },
  { name: 'PageSpeed Insights', url: 'https://pagespeed.web.dev/', desc: '페이지 속도 측정', bg: '#34a853' },
  { name: 'Mobile Friendly Test', url: 'https://search.google.com/test/mobile-friendly', desc: '모바일 최적화 테스트', bg: '#ea4335' },
  { name: 'Rich Results Test', url: 'https://search.google.com/test/rich-results', desc: '구조화 데이터 검증', bg: '#fbbc05' },
  { name: 'Naver Search Advisor', url: 'https://searchadvisor.naver.com/', desc: '네이버 검색 등록/분석', bg: '#03cf5d' },
  { name: 'Naver Webmaster Tools', url: 'https://webmastertool.naver.com/', desc: '네이버 웹마스터 도구', bg: '#03cf5d' },
  { name: 'Bing Webmaster', url: 'https://www.bing.com/webmasters/', desc: 'Bing 검색엔진 등록', bg: '#008373' },
  { name: 'Schema Validator', url: 'https://validator.schema.org/', desc: 'Schema.org 마크업 검증', bg: '#475569' },
  { name: 'W3C HTML Validator', url: 'https://validator.w3.org/', desc: 'HTML 표준 준수 확인', bg: '#005a9c' },
];

function ExternalTools() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
      {EXTERNAL_TOOLS.map((tool) => (
        <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" style={{
          ...cardStyle, textDecoration: 'none', display: 'block', transition: 'box-shadow 0.2s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: tool.bg, flexShrink: 0 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{tool.name}</div>
          </div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{tool.desc}</div>
          <div style={{ fontSize: 11, color: '#2563eb', marginTop: 6 }}>바로가기 ↗</div>
        </a>
      ))}
    </div>
  );
}

/* ── Main Page ── */
export function SeoStatusPage({ siteId }: { siteId: string }) {
  const [tab, setTab] = useState<Tab>('snapshot');
  const [snapshots, setSnapshots] = useState<SeoSnapshot[]>([]);
  const [snippets, setSnippets] = useState<HeadSnippets>({});
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    if (!siteId) return;
    Promise.all([
      getSeoSnapshots(siteId).catch(() => ({ snapshots: [] })),
      getSiteSettings(siteId).catch(() => ({ headSnippets: {} })),
    ]).then(([snapData, settingsData]) => {
      setSnapshots(snapData.snapshots || []);
      setSnippets(settingsData.headSnippets || {});
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [siteId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>불러오는 중...</div>;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
        <button style={tabBtnStyle(tab === 'snapshot')} onClick={() => setTab('snapshot')}>검색 결과 스냅샷</button>
        <button style={tabBtnStyle(tab === 'health')} onClick={() => setTab('health')}>SEO 건강 체크</button>
        <button style={tabBtnStyle(tab === 'tools')} onClick={() => setTab('tools')}>외부 도구</button>
      </div>

      {tab === 'snapshot' && <SnapshotTimeline siteId={siteId} snapshots={snapshots} onRefresh={loadData} />}
      {tab === 'health' && <SeoHealthCheck snippets={snippets} />}
      {tab === 'tools' && <ExternalTools />}
    </div>
  );
}
