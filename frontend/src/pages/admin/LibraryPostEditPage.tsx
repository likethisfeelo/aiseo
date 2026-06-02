import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminGetLibraryPost,
  adminCreateLibraryPost,
  adminUpdateLibraryPost,
  adminListLibraryCovers,
} from '../../api';

interface CoverRow {
  slug: string;
  title?: string;
  isPublished?: boolean;
}

interface PostFull {
  slug: string;
  title?: string;
  tag?: string;
  author?: string;
  publishedAt?: string;
  readMinutes?: number;
  lead?: string;
  bodyHtml?: string;
  canonicalCoverSlug?: string;
  seoMeta?: {
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  isPublished?: boolean;
  coverSlugs?: string[];
}

const SLUG_RE = /^[a-z0-9-]+$/;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const isoToLocal = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function LibraryPostEditPage() {
  const navigate = useNavigate();
  const params = useParams<{ slug?: string }>();
  const isEditMode = !!params.slug;

  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');
  const [author, setAuthor] = useState('AISEO');
  const [readMinutes, setReadMinutes] = useState('4');
  const [publishedAtLocal, setPublishedAtLocal] = useState('');
  const [lead, setLead] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoOgTitle, setSeoOgTitle] = useState('');
  const [seoOgDescription, setSeoOgDescription] = useState('');
  const [seoOgImage, setSeoOgImage] = useState('');

  const [covers, setCovers] = useState<CoverRow[]>([]);
  const [assignedCovers, setAssignedCovers] = useState<string[]>([]);
  const [canonicalCoverSlug, setCanonicalCoverSlug] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const coversRes = (await adminListLibraryCovers()) as { covers: CoverRow[] };
        if (cancelled) return;
        setCovers(coversRes.covers || []);

        if (isEditMode && params.slug) {
          const data = (await adminGetLibraryPost(params.slug)) as { post: PostFull };
          if (cancelled) return;
          const p = data.post || ({} as PostFull);
          setSlug(p.slug || params.slug);
          setSlugTouched(true);
          setTitle(p.title || '');
          setTag(p.tag || '');
          setAuthor(p.author || 'AISEO');
          setReadMinutes(String(p.readMinutes ?? 4));
          setPublishedAtLocal(isoToLocal(p.publishedAt || ''));
          setLead(p.lead || '');
          setBodyHtml(p.bodyHtml || '');
          setIsPublished(!!p.isPublished);
          const m = p.seoMeta || {};
          setSeoDescription(m.description || '');
          setSeoKeywords(m.keywords || '');
          setSeoOgTitle(m.ogTitle || '');
          setSeoOgDescription(m.ogDescription || '');
          setSeoOgImage(m.ogImage || '');
          setAssignedCovers(Array.isArray(p.coverSlugs) ? p.coverSlugs : []);
          setCanonicalCoverSlug(p.canonicalCoverSlug || (p.coverSlugs?.[0] ?? ''));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isEditMode, params.slug]);

  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!isEditMode && !slugTouched) setSlug(slugify(v));
  };

  const toggleCover = (cs: string) => {
    setAssignedCovers((prev) => {
      const has = prev.includes(cs);
      const next = has ? prev.filter((x) => x !== cs) : [...prev, cs];
      // canonical 이 빠지면 자동 재선정.
      if (has && canonicalCoverSlug === cs) {
        setCanonicalCoverSlug(next[0] || '');
      }
      if (!has && !canonicalCoverSlug) {
        setCanonicalCoverSlug(cs);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setError('');
    if (!title.trim()) { setError('제목은 필수입니다.'); return; }
    if (!SLUG_RE.test(slug)) { setError('Slug 는 영문 소문자·숫자·하이픈만 가능합니다.'); return; }
    if (assignedCovers.length > 0 && !assignedCovers.includes(canonicalCoverSlug)) {
      setError('대표 표지는 배치된 표지 중 하나여야 합니다.');
      return;
    }

    const payload = {
      slug,
      title,
      tag,
      author,
      readMinutes: Number(readMinutes) || 0,
      publishedAt: publishedAtLocal ? new Date(publishedAtLocal).toISOString() : '',
      lead,
      bodyHtml,
      canonicalCoverSlug,
      seoMeta: {
        description: seoDescription,
        keywords: seoKeywords,
        ogTitle: seoOgTitle,
        ogDescription: seoOgDescription,
        ogImage: seoOgImage,
      },
      isPublished,
      coverSlugs: assignedCovers,
    };
    setSaving(true);
    try {
      if (isEditMode && params.slug) {
        await adminUpdateLibraryPost(params.slug, payload);
      } else {
        await adminCreateLibraryPost(payload);
      }
      navigate('/admin/library/posts');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally { setSaving(false); }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>불러오는 중...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{isEditMode ? '포스트 편집' : '새 포스트'}</h1>
          <p style={styles.subtitle}>
            {isEditMode ? `편집 중: /${params.slug}` : '새 라이브러리 챕터를 작성합니다.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/library/posts')} style={styles.secondaryBtn}>취소</button>
          <button onClick={handleSave} disabled={saving} style={styles.primaryBtn}>{saving ? '저장 중...' : '저장'}</button>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      <div style={styles.section}>
        <div style={styles.sectionTitle}>기본 정보</div>
        <label style={styles.label}>제목 *</label>
        <input value={title} onChange={(e) => handleTitleChange(e.target.value)} style={styles.input} />

        <label style={styles.label}>Slug * (URL 식별자)</label>
        <input
          value={slug}
          onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugTouched(true); }}
          style={{ ...styles.input, fontFamily: 'monospace' }}
          disabled={isEditMode}
        />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={styles.label}>태그</label>
            <input value={tag} onChange={(e) => setTag(e.target.value)} style={styles.input} placeholder="성공사례 / SEO전략" />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={styles.label}>저자</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} style={styles.input} />
          </div>
          <div style={{ flex: '0 0 120px' }}>
            <label style={styles.label}>읽기 시간(분)</label>
            <input type="number" value={readMinutes} onChange={(e) => setReadMinutes(e.target.value)} style={styles.input} />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>미리보기 (Lead) — 게이트 위, 항상 노출</div>
        <textarea value={lead} onChange={(e) => setLead(e.target.value)} rows={4} style={{ ...styles.input, resize: 'vertical' }}
          placeholder="2-3 문장의 도입부. 비회원도 항상 볼 수 있고, 더 읽고 싶게 만드는 훅을 담습니다." />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>본문 HTML — 게이트 대상</div>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          허용 태그: p, h1-6, ul/ol/li, blockquote, code/pre, a, img, table, figure 등. 저장 시 sanitize 됩니다.
        </p>
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          rows={20}
          style={{ ...styles.input, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
          placeholder="<p>...</p><h2>...</h2>"
        />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>표지 배치 (여러 표지에 동시 등장 가능)</div>
        {covers.length === 0 && <p style={{ fontSize: 13, color: '#888' }}>먼저 표지를 만들어 주세요.</p>}
        <div style={styles.coverGrid}>
          {covers.map((c) => {
            const checked = assignedCovers.includes(c.slug);
            const isCanonical = canonicalCoverSlug === c.slug;
            return (
              <label key={c.slug} style={{ ...styles.coverCard, borderColor: checked ? 'var(--primary)' : 'var(--border)' }}>
                <input type="checkbox" checked={checked} onChange={() => toggleCover(c.slug)} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{c.title || c.slug}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{c.slug}</div>
                </div>
                {checked && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <input
                      type="radio"
                      name="canonical-cover"
                      checked={isCanonical}
                      onChange={() => setCanonicalCoverSlug(c.slug)}
                    />
                    canonical
                  </label>
                )}
              </label>
            );
          })}
        </div>
        <p style={{ fontSize: 11, color: '#888', marginTop: 8 }}>
          <strong>대표 표지(canonical)</strong> 는 같은 포스트가 여러 표지에 있을 때 검색엔진이 인덱싱할 단 하나의 URL 을 결정합니다.
        </p>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>SEO 메타</div>
        <label style={styles.label}>Meta Description</label>
        <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} style={{ ...styles.input, resize: 'vertical' }} />

        <label style={styles.label}>Meta Keywords (쉼표 구분)</label>
        <input value={seoKeywords} onChange={(e) => setSeoKeywords(e.target.value)} style={styles.input} />

        <label style={styles.label}>OG Title</label>
        <input value={seoOgTitle} onChange={(e) => setSeoOgTitle(e.target.value)} style={styles.input} />

        <label style={styles.label}>OG Description</label>
        <textarea value={seoOgDescription} onChange={(e) => setSeoOgDescription(e.target.value)} rows={2} style={{ ...styles.input, resize: 'vertical' }} />

        <label style={styles.label}>OG Image URL</label>
        <input value={seoOgImage} onChange={(e) => setSeoOgImage(e.target.value)} style={{ ...styles.input, fontFamily: 'monospace', fontSize: 12 }} placeholder="https://..." />
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>발행</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            공개 (체크해야 라이브러리에 노출)
          </label>
          <div style={{ flex: '1 1 240px' }}>
            <label style={styles.label}>발행일시 (선택)</label>
            <input type="datetime-local" value={publishedAtLocal} onChange={(e) => setPublishedAtLocal(e.target.value)} style={styles.input} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button onClick={() => navigate('/admin/library/posts')} style={styles.secondaryBtn}>취소</button>
        <button onClick={handleSave} disabled={saving} style={styles.primaryBtn}>{saving ? '저장 중...' : '저장'}</button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px', fontFamily: 'var(--font-ko)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  errorBox: { background: 'var(--danger-soft)', border: '1px solid var(--danger-soft)', color: 'var(--danger)', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16 },
  section: { background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  input: { width: '100%', padding: 8, border: '1px solid var(--border-strong)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12, fontFamily: 'inherit' },
  primaryBtn: { padding: '9px 18px', border: 'none', borderRadius: 6, background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  secondaryBtn: { padding: '9px 18px', border: '1px solid var(--border-strong)', background: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' },
  coverGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 },
  coverCard: { display: 'flex', alignItems: 'center', gap: 10, padding: 12, border: '2px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: '#fff', fontSize: 13 },
};
