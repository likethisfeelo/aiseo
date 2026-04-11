import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  adminGetBlogPost,
  adminCreateBlogPost,
  adminUpdateBlogPost,
  adminListBlogCategories,
} from '../../api';
import { ImageUploader } from '../../components/common/ImageUploader';
import { TagChip } from '../../components/common/TagChip';
import { BlogEditor } from '../../components/common/BlogEditor';

interface BlogPostFull {
  slug: string;
  title?: string;
  excerpt?: string;
  body?: string;
  category?: string;
  tags?: string[];
  thumbnailUrl?: string;
  ogImageUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  status?: 'draft' | 'published' | 'deleted';
  publishedAt?: string;
  featured?: boolean;
  featuredOrder?: number;
}

interface BlogCategory {
  slug: string;
  name: string;
  order?: number;
}

const SLUG_RE = /^[a-z0-9-]+$/;

const isoToLocal = (iso: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const slugifyTitle = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export function BlogPostEditPage() {
  const navigate = useNavigate();
  const params = useParams<{ slug?: string }>();
  const isEditMode = !!params.slug;

  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'deleted'>('draft');
  const [publishedAtLocal, setPublishedAtLocal] = useState('');
  const [featured, setFeatured] = useState(false);
  const [featuredOrder, setFeaturedOrder] = useState<string>('9999');

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Initial load: categories + (edit mode) post
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const catData = (await adminListBlogCategories()) as { categories: BlogCategory[] };
        if (cancelled) return;
        setCategories(catData.categories || []);

        if (isEditMode && params.slug) {
          const postData = (await adminGetBlogPost(params.slug)) as { post: BlogPostFull };
          if (cancelled) return;
          const p = postData.post || ({} as BlogPostFull);
          setSlug(p.slug || params.slug);
          setSlugTouched(true);
          setTitle(p.title || '');
          setExcerpt(p.excerpt || '');
          setBody(p.body || '');
          setCategory(p.category || '');
          setTags(Array.isArray(p.tags) ? p.tags : []);
          setThumbnailUrl(p.thumbnailUrl || '');
          setOgImageUrl(p.ogImageUrl || '');
          setMetaTitle(p.metaTitle || '');
          setMetaDescription(p.metaDescription || '');
          setStatus((p.status as 'draft' | 'published' | 'deleted') || 'draft');
          setPublishedAtLocal(isoToLocal(p.publishedAt || ''));
          setFeatured(!!p.featured);
          setFeaturedOrder(String(p.featuredOrder ?? 9999));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '로드 실패');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, params.slug]);

  // Auto-slug from title in new mode
  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!isEditMode && !slugTouched) {
      setSlug(slugifyTitle(v));
    }
  };

  const handleSlugChange = (v: string) => {
    setSlug(v.toLowerCase());
    setSlugTouched(true);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleSave = async () => {
    setError('');
    if (!title.trim()) {
      setError('제목은 필수입니다.');
      return;
    }
    if (!SLUG_RE.test(slug)) {
      setError('Slug 는 영문 소문자·숫자·하이픈만 가능합니다.');
      return;
    }
    const payload = {
      slug,
      title,
      excerpt,
      body,
      category,
      tags,
      thumbnailUrl,
      ogImageUrl,
      metaTitle,
      metaDescription,
      status,
      featured,
      featuredOrder: Number(featuredOrder) || 9999,
      publishedAt: publishedAtLocal ? new Date(publishedAtLocal).toISOString() : '',
    };
    setSaving(true);
    try {
      if (isEditMode && params.slug) {
        await adminUpdateBlogPost(params.slug, payload);
      } else {
        await adminCreateBlogPost(payload);
      }
      navigate('/admin/blog/posts');
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)),
    [categories],
  );

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>불러오는 중...</div>;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{isEditMode ? '글 편집' : '새 글 작성'}</h1>
          <p style={styles.subtitle}>
            {isEditMode ? `편집 중: /${params.slug}` : '새로운 블로그 글을 작성합니다.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/blog/posts')} style={styles.secondaryBtn}>
            취소
          </button>
          <button onClick={handleSave} disabled={saving} style={styles.primaryBtn}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Section: Meta */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>기본 정보</div>
        <label style={styles.label}>제목 *</label>
        <input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="글 제목"
          style={styles.input}
        />
        <label style={styles.label}>Slug * (URL 식별자)</label>
        <input
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="my-first-post"
          style={{ ...styles.input, fontFamily: 'monospace' }}
        />
        <label style={styles.label}>요약 (목록 카드에 표시)</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="한두 문장으로 글을 요약합니다."
          rows={3}
          style={{ ...styles.input, resize: 'vertical' }}
        />
      </div>

      {/* Section: Category + Tags */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>분류</div>
        <label style={styles.label}>카테고리</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={styles.input}
        >
          <option value="">— 선택 안 함 —</option>
          {sortedCategories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} ({c.slug})
            </option>
          ))}
        </select>

        <label style={styles.label}>태그</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {tags.map((t) => (
            <TagChip key={t} label={t} onRemove={() => removeTag(t)} />
          ))}
          {tags.length === 0 && (
            <span style={{ fontSize: 12, color: '#94a3b8' }}>아직 태그가 없습니다.</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="태그 입력 후 Enter"
            style={{ ...styles.input, marginBottom: 0, flex: 1 }}
          />
          <button onClick={addTag} style={styles.smallBtn}>
            추가
          </button>
        </div>
      </div>

      {/* Section: Body */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>본문</div>
        <BlogEditor value={body} onChange={setBody} />
      </div>

      {/* Section: Images */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>이미지</div>
        <label style={styles.label}>썸네일 (목록 카드)</label>
        <ImageUploader
          siteId="blog"
          currentUrl={thumbnailUrl}
          onUploaded={setThumbnailUrl}
          label="썸네일 업로드"
        />
        {thumbnailUrl && (
          <div style={{ marginTop: 4 }}>
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              style={{ ...styles.input, fontSize: 11, fontFamily: 'monospace' }}
            />
          </div>
        )}

        <label style={{ ...styles.label, marginTop: 16 }}>OG 이미지 (SNS 공유)</label>
        <ImageUploader
          siteId="blog"
          currentUrl={ogImageUrl}
          onUploaded={setOgImageUrl}
          label="OG 이미지 업로드"
        />
        {ogImageUrl && (
          <div style={{ marginTop: 4 }}>
            <input
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              style={{ ...styles.input, fontSize: 11, fontFamily: 'monospace' }}
            />
          </div>
        )}
      </div>

      {/* Section: SEO */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>SEO 메타</div>
        <label style={styles.label}>Meta Title (비우면 제목 사용)</label>
        <input
          value={metaTitle}
          onChange={(e) => setMetaTitle(e.target.value)}
          placeholder="검색 결과에 표시될 제목"
          style={styles.input}
        />
        <label style={styles.label}>Meta Description (비우면 요약 사용)</label>
        <textarea
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          placeholder="검색 결과에 표시될 설명 (150자 권장)"
          rows={2}
          style={{ ...styles.input, resize: 'vertical' }}
        />
      </div>

      {/* Section: Publishing */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>발행 설정</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={styles.label}>상태</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'deleted')}
              style={styles.input}
            >
              <option value="draft">초안</option>
              <option value="published">발행</option>
              <option value="deleted">삭제</option>
            </select>
          </div>
          <div style={{ flex: '1 1 240px' }}>
            <label style={styles.label}>발행일시 (예약 발행 가능)</label>
            <input
              type="datetime-local"
              value={publishedAtLocal}
              onChange={(e) => setPublishedAtLocal(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured (랜딩 페이지 노출)
          </label>
          {featured && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>순서</span>
              <input
                type="number"
                value={featuredOrder}
                onChange={(e) => setFeaturedOrder(e.target.value)}
                style={{ ...styles.input, marginBottom: 0, width: 90 }}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
        <button onClick={() => navigate('/admin/blog/posts')} style={styles.secondaryBtn}>
          취소
        </button>
        <button onClick={handleSave} disabled={saving} style={styles.primaryBtn}>
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '40px 24px',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Noto Sans KR', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  title: { fontSize: 22, fontWeight: 600, color: '#1a1a18', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  errorBox: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    fontSize: 13,
    padding: '10px 14px',
    borderRadius: 8,
    marginBottom: 16,
  },
  section: {
    background: '#fff',
    border: '1px solid #e0dfd8',
    borderRadius: 10,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#334155',
    marginBottom: 12,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    padding: 8,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    fontSize: 13,
    boxSizing: 'border-box' as const,
    marginBottom: 12,
    fontFamily: 'inherit',
  },
  primaryBtn: {
    padding: '9px 18px',
    border: 'none',
    borderRadius: 6,
    background: '#2563eb',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '9px 18px',
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    color: '#475569',
    cursor: 'pointer',
  },
  smallBtn: {
    padding: '6px 12px',
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    color: '#475569',
  },
};
