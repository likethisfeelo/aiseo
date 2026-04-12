import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import '../landing.css';
import { getBlogPosts, getBlogCategories } from '../../api';
import { useSubPageNav } from './useSubPageNav';

interface BlogPostCard {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  publishedAt?: string;
  thumbnailUrl?: string;
}

interface BlogCategory {
  slug: string;
  name: string;
  order?: number;
}

interface ListResponse {
  posts: BlogPostCard[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [posts, setPosts] = useState<BlogPostCard[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Shared landing-nav → scrolled transition + mobile hamburger.
  useSubPageNav();

  // Load categories once
  useEffect(() => {
    getBlogCategories()
      .then((data: { categories: BlogCategory[] }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  // Load posts when filter/page changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getBlogPosts({ category: category || undefined, page })
      .then((data: ListResponse) => {
        if (cancelled) return;
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '글을 불러오지 못했습니다.');
        setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, page]);

  // Scroll to top on filter/page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, page]);

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999)),
    [categories],
  );

  const setCategory = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set('category', next);
    else params.delete('category');
    params.delete('page');
    setSearchParams(params);
  };

  const setPage = (next: number) => {
    const params = new URLSearchParams(searchParams);
    if (next > 1) params.set('page', String(next));
    else params.delete('page');
    setSearchParams(params);
  };

  const categoryName = (slug?: string) => {
    if (!slug) return '';
    const found = categories.find((c) => c.slug === slug);
    return found?.name || slug;
  };

  return (
    <>
      {/* NAV — mirrors PublicSubPage */}
      <nav id="mainNav" className="landing-nav">
        <div className="nav-inner">
          <a href="/" className="nav-logo">AISEO</a>
          <div className="nav-links">
            <a href="/course2026">수강안내</a>
            <a href="/support2026">지원서비스</a>
            <a href="/events2026">이벤트</a>
            <a href="/blog" className="active">블로그</a>
          </div>
          <div className="nav-cta">
            <a href="/?auth=login" className="btn-ghost">로그인</a>
            <a href="/?auth=login" className="btn-primary">지금 시작하기</a>
          </div>
          <button className="nav-hamburger" id="navHamburger" aria-label="메뉴 열기">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      <div className="nav-mobile-menu" id="navMobileMenu">
        <nav className="nmm-links">
          <a href="/course2026" className="nmm-link">수강안내</a>
          <a href="/support2026" className="nmm-link">지원서비스</a>
          <a href="/events2026" className="nmm-link">이벤트</a>
          <a href="/blog" className="nmm-link">블로그</a>
        </nav>
        <div className="nmm-cta">
          <a href="/?auth=login" className="nmm-btn-ghost">로그인</a>
          <a href="/?auth=login" className="nmm-btn-primary">지금 시작하기</a>
        </div>
      </div>

      {/* Header */}
      <section style={styles.header}>
        <div style={styles.headerInner}>
          <div className="section-eyebrow" style={{ marginBottom: 16 }}>BLOG</div>
          <h1 style={styles.title}>블로그</h1>
          <p style={styles.subtitle}>
            AI 웹사이트와 검색 노출에 관한 인사이트, 사용 가이드, 사례 연구
          </p>
        </div>
      </section>

      {/* Category filter */}
      {sortedCategories.length > 0 && (
        <div style={styles.filterBar}>
          <div style={styles.filterInner}>
            <button
              onClick={() => setCategory('')}
              style={{
                ...styles.filterPill,
                ...(category === '' ? styles.filterPillActive : {}),
              }}
            >
              전체
            </button>
            {sortedCategories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug)}
                style={{
                  ...styles.filterPill,
                  ...(category === c.slug ? styles.filterPillActive : {}),
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main style={styles.main}>
        {loading && <div style={styles.message}>불러오는 중...</div>}
        {error && <div style={{ ...styles.message, color: '#c0392b' }}>{error}</div>}

        {!loading && !error && posts.length === 0 && (
          <div style={styles.message}>
            {category
              ? `'${categoryName(category)}' 카테고리의 글이 아직 없습니다.`
              : '아직 작성된 글이 없습니다.'}
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <>
            <div style={styles.resultMeta}>
              {category ? `${categoryName(category)} · ` : ''}총 {total}개 글
            </div>
            <div style={styles.grid}>
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${encodeURIComponent(p.slug)}`}
                  style={styles.cardLink}
                >
                  <article style={styles.card}>
                    {p.thumbnailUrl ? (
                      <div
                        style={{
                          ...styles.thumb,
                          backgroundImage: `url(${p.thumbnailUrl})`,
                        }}
                      />
                    ) : (
                      <div style={{ ...styles.thumb, ...styles.thumbPlaceholder }}>
                        <span>AISEO</span>
                      </div>
                    )}
                    <div style={styles.cardBody}>
                      {p.category && (
                        <div style={styles.cardCategory}>{categoryName(p.category)}</div>
                      )}
                      <h2 style={styles.cardTitle}>{p.title || '(제목 없음)'}</h2>
                      {p.excerpt && <p style={styles.cardExcerpt}>{p.excerpt}</p>}
                      <div style={styles.cardMeta}>
                        <span>{formatDate(p.publishedAt)}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={styles.pagination}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  style={{
                    ...styles.pageBtn,
                    ...(page <= 1 ? styles.pageBtnDisabled : {}),
                  }}
                >
                  ← 이전
                </button>
                <span style={styles.pageInfo}>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  style={{
                    ...styles.pageBtn,
                    ...(page >= totalPages ? styles.pageBtnDisabled : {}),
                  }}
                >
                  다음 →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ minHeight: 'auto', padding: '48px 40px' }}>
        <div className="hero-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }}></div>
        <div className="footer-inner">
          <div className="footer-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
            <span>&copy; 2026 AISEO. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 24 }}>
              <a href="#">개인정보처리방침</a>
              <a href="#">이용약관</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    paddingTop: 140,
    paddingBottom: 60,
    textAlign: 'center' as const,
    background: '#fafaf8',
    borderBottom: '1px solid #ececea',
  },
  headerInner: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '0 24px',
  },
  title: {
    fontFamily: 'var(--font-ko)',
    fontSize: 'clamp(36px, 5vw, 56px)',
    fontWeight: 800,
    letterSpacing: -2,
    color: 'var(--text-primary)',
    lineHeight: 1.15,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--text-muted)',
    lineHeight: 1.6,
  },
  filterBar: {
    background: '#fff',
    borderBottom: '1px solid #ececea',
    position: 'sticky' as const,
    top: 64,
    zIndex: 10,
  },
  filterInner: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
    overflowX: 'auto' as const,
  },
  filterPill: {
    padding: '8px 16px',
    border: '1px solid #e0dfd8',
    background: '#fff',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    color: '#64748b',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    fontFamily: 'inherit',
  },
  filterPillActive: {
    background: '#1f2937',
    color: '#fff',
    borderColor: '#1f2937',
  },
  main: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '48px 24px 80px',
  },
  message: {
    textAlign: 'center' as const,
    fontSize: 15,
    color: '#64748b',
    padding: '80px 0',
  },
  resultMeta: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 24,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 28,
  },
  cardLink: {
    textDecoration: 'none',
    color: 'inherit',
    display: 'block',
  },
  card: {
    background: '#fff',
    border: '1px solid #ececea',
    borderRadius: 14,
    overflow: 'hidden',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  thumb: {
    width: '100%',
    aspectRatio: '16 / 9',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#f8f7f4',
  },
  thumbPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cbd5e1',
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 1,
    fontFamily: 'var(--font-ko)',
  },
  cardBody: {
    padding: '20px 22px 22px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: 600,
    color: '#2563eb',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: 'var(--font-ko)',
    fontSize: 19,
    fontWeight: 700,
    color: '#1a1a18',
    lineHeight: 1.4,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  cardExcerpt: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 1.6,
    marginBottom: 16,
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  cardMeta: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 'auto',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 60,
  },
  pageBtn: {
    padding: '10px 20px',
    border: '1px solid #d1d5db',
    background: '#fff',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: '#475569',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  pageBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  pageInfo: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: 500,
    minWidth: 60,
    textAlign: 'center' as const,
  },
};
