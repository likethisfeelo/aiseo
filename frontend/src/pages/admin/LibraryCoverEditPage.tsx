import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminGetLibraryCover,
  adminCreateLibraryCover,
  adminUpdateLibraryCover,
  adminReorderLibraryCoverChapters,
  adminListLibraryCovers,
  adminListLibraryPosts,
} from '../../api';

interface Chapter {
  slug: string;
  title?: string;
  tag?: string;
  readMinutes?: number;
  sortOrder?: number;
  missing?: boolean;
}

interface CoverFull {
  slug: string;
  title?: string;
  description?: string;
  tag?: string;
  sortOrder?: number;
  isPublished?: boolean;
}

interface PostRow {
  slug: string;
  title?: string;
}

const SLUG_RE = /^[a-z0-9-]+$/;

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export function LibraryCoverEditPage() {
  const navigate = useNavigate();
  const params = useParams<{ slug?: string }>();
  const isEditMode = !!params.slug;

  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [sortOrder, setSortOrder] = useState('9999');
  const [isPublished, setIsPublished] = useState(false);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [allPosts, setAllPosts] = useState<PostRow[]>([]);
  const [addPickerSlug, setAddPickerSlug] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const postsRes = (await adminListLibraryPosts()) as { posts: PostRow[] };
        if (!cancelled) setAllPosts(postsRes.posts || []);

        if (isEditMode && params.slug) {
          const data = (await adminGetLibraryCover(params.slug)) as { cover: CoverFull; chapters: Chapter[] };
          if (cancelled) return;
          const c = data.cover || ({} as CoverFull);
          setSlug(c.slug || params.slug);
          setSlugTouched(true);
          setTitle(c.title || '');
          setDescription(c.description || '');
          setTag(c.tag || '');
          setSortOrder(String(c.sortOrder ?? 9999));
          setIsPublished(!!c.isPublished);
          setChapters(data.chapters || []);
        } else {
          // 새 표지 — 기존 표지의 max sortOrder + 1 로 기본값. 카탈로그
          // 정렬에서 자연스럽게 맨 끝으로 들어가게 함 (이전엔 9999 라
          // 직관 안 됨).
          try {
            const coversRes = (await adminListLibraryCovers()) as { covers: Array<{ sortOrder?: number }> };
            const list = coversRes.covers || [];
            const maxOrder = list.reduce((m, c) => {
              const n = Number(c.sortOrder);
              return Number.isFinite(n) && n < 9999 && n > m ? n : m;
            }, 0);
            if (!cancelled) setSortOrder(String(maxOrder + 1));
          } catch {
            // 실패해도 9999 기본값 유지 — 막힘 없이 폼은 열림.
          }
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

  const saveMeta = async () => {
    setError(''); setInfo('');
    if (!title.trim()) { setError('제목은 필수입니다.'); return; }
    if (!SLUG_RE.test(slug)) { setError('Slug 는 영문 소문자·숫자·하이픈만 가능합니다.'); return; }
    const payload = {
      slug,
      title,
      description,
      tag,
      sortOrder: Number(sortOrder) || 9999,
      isPublished,
    };
    setSaving(true);
    try {
      if (isEditMode && params.slug) {
        await adminUpdateLibraryCover(params.slug, payload);
        setInfo('표지 정보가 저장되었습니다.');
      } else {
        await adminCreateLibraryCover(payload);
        navigate(`/admin/library/covers/${encodeURIComponent(slug)}/edit`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally { setSaving(false); }
  };

  // ── Chapter drag-reorder (HTML5 native DnD) ──
  const dragIdx = useRef<number | null>(null);

  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (i: number) => {
    const from = dragIdx.current;
    dragIdx.current = null;
    if (from === null || from === i) return;
    setChapters((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
  };

  const moveChapter = (i: number, dir: -1 | 1) => {
    const target = i + dir;
    if (target < 0 || target >= chapters.length) return;
    setChapters((prev) => {
      const next = [...prev];
      [next[i], next[target]] = [next[target], next[i]];
      return next;
    });
  };

  const removeChapter = (i: number) => setChapters((prev) => prev.filter((_, idx) => idx !== i));

  const addChapter = () => {
    if (!addPickerSlug) return;
    if (chapters.some((c) => c.slug === addPickerSlug)) {
      setError('이미 이 표지에 포함된 포스트입니다.');
      return;
    }
    const p = allPosts.find((pp) => pp.slug === addPickerSlug);
    if (!p) return;
    setChapters((prev) => [...prev, { slug: p.slug, title: p.title || p.slug }]);
    setAddPickerSlug('');
  };

  const saveChapters = async () => {
    if (!isEditMode || !params.slug) {
      setError('먼저 표지 정보를 저장하세요.');
      return;
    }
    setError(''); setInfo('');
    setSavingOrder(true);
    try {
      await adminReorderLibraryCoverChapters(params.slug, chapters.map((c) => c.slug));
      setInfo('챕터 순서가 저장되었습니다.');
    } catch (e) {
      setError(e instanceof Error ? e.message : '챕터 순서 저장 실패');
    } finally { setSavingOrder(false); }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>불러오는 중...</div>;
  }

  const availablePosts = allPosts.filter((p) => !chapters.some((c) => c.slug === p.slug));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{isEditMode ? '표지 편집' : '새 표지'}</h1>
          <p style={styles.subtitle}>
            {isEditMode ? `편집 중: /library/${params.slug}/` : '새로운 라이브러리 표지를 만듭니다.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/library/covers')} style={styles.secondaryBtn}>← 목록</button>
          <button onClick={saveMeta} disabled={saving} style={styles.primaryBtn}>{saving ? '저장 중...' : '표지 정보 저장'}</button>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {info  && <div style={styles.infoBox}>{info}</div>}

      <div style={styles.section}>
        <div style={styles.sectionTitle}>기본 정보</div>
        <label style={styles.label}>제목 *</label>
        <input value={title} onChange={(e) => handleTitleChange(e.target.value)} style={styles.input} placeholder="예: 성공사례" />

        <label style={styles.label}>Slug * (URL 식별자)</label>
        <input
          value={slug}
          onChange={(e) => { setSlug(e.target.value.toLowerCase()); setSlugTouched(true); }}
          style={{ ...styles.input, fontFamily: 'monospace' }}
          placeholder="case-studies"
          disabled={isEditMode}
        />

        <label style={styles.label}>설명 (표지 카드 부제)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} style={{ ...styles.input, resize: 'vertical' }} />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={styles.label}>카테고리</label>
            <select value={tag} onChange={(e) => setTag(e.target.value)} style={styles.input}>
              <option value="">— 선택 —</option>
              <option value="성공사례">성공사례</option>
              <option value="SEO전략">SEO전략</option>
            </select>
            <p style={{ fontSize: 11, color: '#888', marginTop: -8, marginBottom: 12 }}>
              카탈로그 페이지의 탭 필터가 이 값으로 매칭됩니다.
            </p>
          </div>
          <div style={{ flex: '0 0 120px' }}>
            <label style={styles.label}>표시 순서</label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={styles.input} />
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-primary)', marginTop: 8 }}>
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
          공개 (체크해야 라이브러리에 노출)
        </label>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>챕터 ({chapters.length})</div>
        {!isEditMode && (
          <p style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
            새 표지를 먼저 저장한 뒤 챕터를 추가할 수 있습니다.
          </p>
        )}
        {isEditMode && (
          <>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
              드래그 또는 ▲/▼ 로 순서를 변경한 뒤 <strong>챕터 순서 저장</strong> 을 누르면 적용됩니다.
            </p>

            <div style={styles.chapterList}>
              {chapters.length === 0 && <p style={{ ...styles.msg, padding: 16 }}>아직 챕터가 없습니다. 아래에서 추가하세요.</p>}
              {chapters.map((c, i) => (
                <div
                  key={c.slug}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(i)}
                  style={{ ...styles.chapterRow, opacity: c.missing ? 0.5 : 1 }}
                >
                  <div style={styles.chapterIdx}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.title || c.slug}
                      {c.missing && <span style={{ marginLeft: 6, color: 'var(--danger)', fontSize: 11 }}>(삭제됨)</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>{c.slug}</div>
                  </div>
                  <button onClick={() => moveChapter(i, -1)} style={styles.iconBtn} title="위로">▲</button>
                  <button onClick={() => moveChapter(i, +1)} style={styles.iconBtn} title="아래로">▼</button>
                  <button onClick={() => removeChapter(i)} style={{ ...styles.iconBtn, color: 'var(--danger)' }} title="제거">×</button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center' }}>
              <select value={addPickerSlug} onChange={(e) => setAddPickerSlug(e.target.value)} style={{ ...styles.input, marginBottom: 0, flex: 1 }}>
                <option value="">— 추가할 포스트 선택 —</option>
                {availablePosts.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.title || p.slug} ({p.slug})</option>
                ))}
              </select>
              <button onClick={addChapter} disabled={!addPickerSlug} style={styles.smallBtn}>+ 추가</button>
              <button onClick={saveChapters} disabled={savingOrder} style={styles.primaryBtn}>
                {savingOrder ? '저장 중...' : '챕터 순서 저장'}
              </button>
            </div>
          </>
        )}
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
  infoBox: { background: 'var(--success-soft)', border: '1px solid var(--success-soft)', color: 'var(--success-dark)', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 16 },
  section: { background: '#fff', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  input: { width: '100%', padding: 8, border: '1px solid var(--border-strong)', borderRadius: 6, fontSize: 13, boxSizing: 'border-box' as const, marginBottom: 12, fontFamily: 'inherit' },
  primaryBtn: { padding: '9px 18px', border: 'none', borderRadius: 6, background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  secondaryBtn: { padding: '9px 18px', border: '1px solid var(--border-strong)', background: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' },
  smallBtn: { padding: '8px 14px', border: '1px solid var(--border-strong)', background: '#fff', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' },
  iconBtn: { padding: '4px 8px', border: '1px solid var(--border-strong)', background: '#fff', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)', marginLeft: 4 },
  msg: { fontSize: 13, color: '#888', textAlign: 'center' as const },
  chapterList: { border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-soft)', overflow: 'hidden' },
  chapterRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#fff', borderBottom: '1px solid var(--border-soft)', cursor: 'grab' },
  chapterIdx: { width: 28, height: 28, borderRadius: 14, background: 'var(--bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' },
};
