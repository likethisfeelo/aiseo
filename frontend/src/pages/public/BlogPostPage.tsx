import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import '../landing.css';
import { getBlogPost, getBlogPosts, getBlogCategories } from '../../api';

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
  publishedAt?: string;
  viewCount?: number;
  author?: string;
}

interface BlogPostCard {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
}

interface BlogCategory {
  slug: string;
  name: string;
}

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || '';

  const [post, setPost] = useState<BlogPostFull | null>(null);
  const [related, setRelated] = useState<BlogPostCard[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Nav scrolled state + hamburger (mirrors PublicSubPage)
  useEffect(() => {
    const nav = document.getElementById('mainNav');
    nav?.classList.add('scrolled');

    const btn = document.getElementById('navHamburger');
    const menu = document.getElementById('navMobileMenu');
    const hamburgerHandler = () => {
      if (!btn || !menu) return;
      const isOpen = menu.classList.toggle('open');
      btn.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    if (btn) btn.addEventListener('click', hamburgerHandler);
    const closeMenu = () => {
      menu?.classList.remove('open');
      btn?.classList.remove('open');
      document.body.style.overflow = '';
    };
    menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

    return () => {
      if (btn) btn.removeEventListener('click', hamburgerHandler);
      document.body.style.overflow = '';
    };
  }, []);

  // Load categories once
  useEffect(() => {
    getBlogCategories()
      .then((data: { categories: BlogCategory[] }) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  // Load post + related when slug changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPost(null);
    setRelated([]);
    window.scrollTo({ top: 0, behavior: 'auto' });

    if (!slug) {
      setError('잘못된 글 주소입니다.');
      setLoading(false);
      return;
    }

    getBlogPost(slug)
      .then((data: { post: BlogPostFull }) => {
        if (cancelled) return;
        setPost(data.post);

        // Load related posts: same category, exclude current
        if (data.post?.category) {
          getBlogPosts({ category: data.post.category })
            .then((listData: { posts: BlogPostCard[] }) => {
              if (cancelled) return;
              const others = (listData.posts || [])
                .filter((p) => p.slug !== data.post.slug)
                .slice(0, 3);
              setRelated(others);
            })
            .catch(() => {});
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '글을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const categoryName = useMemo(() => {
    if (!post?.category) return '';
    return categories.find((c) => c.slug === post.category)?.name || post.category;
  }, [post, categories]);

  // OG/SEO metadata (React 19 native hoisting)
  const metaTitle = post?.metaTitle || post?.title || '블로그';
  const metaDescription = post?.metaDescription || post?.excerpt || '';
  const ogImage = post?.ogImageUrl || post?.thumbnailUrl || '';
  const pageTitle = post ? `${metaTitle} — AISEO 블로그` : 'AISEO 블로그';

  return (
    <>
      {/* React 19 native head metadata */}
      <title>{pageTitle}</title>
      {metaDescription && <meta name="description" content={metaDescription} />}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={metaTitle} />
      {metaDescription && <meta property="og:description" content={metaDescription} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      {metaDescription && <meta name="twitter:description" content={metaDescription} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* NAV — mirrors PublicSubPage */}
      <nav id="mainNav" className="scrolled">
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

      {loading && <div style={styles.message}>불러오는 중...</div>}

      {!loading && error && (
        <div style={styles.errorWrap}>
          <div style={styles.errorTitle}>글을 찾을 수 없습니다</div>
          <div style={styles.errorBody}>{error}</div>
          <Link to="/blog" style={styles.errorBackBtn}>← 블로그 목록으로</Link>
        </div>
      )}

      {!loading && !error && post && (
        <article style={styles.article}>
          {/* Breadcrumb */}
          <div style={styles.breadcrumb}>
            <Link to="/blog" style={styles.breadcrumbLink}>블로그</Link>
            {categoryName && (
              <>
                <span style={styles.breadcrumbSep}>›</span>
                <Link
                  to={`/blog?category=${encodeURIComponent(post.category || '')}`}
                  style={styles.breadcrumbLink}
                >
                  {categoryName}
                </Link>
              </>
            )}
          </div>

          {/* Header */}
          <header style={styles.postHeader}>
            {categoryName && <div style={styles.categoryLabel}>{categoryName}</div>}
            <h1 style={styles.postTitle}>{post.title || '(제목 없음)'}</h1>
            {post.excerpt && <p style={styles.postExcerpt}>{post.excerpt}</p>}
            <div style={styles.postMeta}>
              <span>{formatDate(post.publishedAt)}</span>
              <span style={styles.metaDot}>·</span>
              <span>조회수 {(post.viewCount ?? 0).toLocaleString()}</span>
              {post.author && (
                <>
                  <span style={styles.metaDot}>·</span>
                  <span>{post.author}</span>
                </>
              )}
            </div>
          </header>

          {/* Hero image */}
          {post.thumbnailUrl && (
            <div style={styles.heroImageWrap}>
              <img src={post.thumbnailUrl} alt={post.title || ''} style={styles.heroImage} />
            </div>
          )}

          {/* Body — server-sanitized HTML, shared .blog-content CSS */}
          <div
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: post.body || '' }}
          />


          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={styles.tagsWrap}>
              {post.tags.map((t) => (
                <Link
                  key={t}
                  to={`/blog?tag=${encodeURIComponent(t)}`}
                  style={styles.tagChip}
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {/* Back to list */}
          <div style={styles.backWrap}>
            <Link to="/blog" style={styles.backBtn}>← 블로그 목록</Link>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <section style={styles.relatedSection}>
              <h2 style={styles.relatedTitle}>관련 글</h2>
              <div style={styles.relatedGrid}>
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    to={`/blog/${encodeURIComponent(r.slug)}`}
                    style={styles.relatedCardLink}
                  >
                    <div style={styles.relatedCard}>
                      {r.thumbnailUrl ? (
                        <div
                          style={{
                            ...styles.relatedThumb,
                            backgroundImage: `url(${r.thumbnailUrl})`,
                          }}
                        />
                      ) : (
                        <div style={{ ...styles.relatedThumb, ...styles.relatedThumbPlaceholder }}>
                          AISEO
                        </div>
                      )}
                      <div style={styles.relatedBody}>
                        <h3 style={styles.relatedCardTitle}>{r.title}</h3>
                        <div style={styles.relatedDate}>{formatDate(r.publishedAt)}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      )}

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
  message: {
    textAlign: 'center' as const,
    fontSize: 15,
    color: '#64748b',
    padding: '200px 24px',
  },
  errorWrap: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '160px 24px 80px',
    textAlign: 'center' as const,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a18',
    marginBottom: 12,
    fontFamily: 'var(--font-ko)',
  },
  errorBody: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
  },
  errorBackBtn: {
    display: 'inline-block',
    padding: '12px 28px',
    background: '#1f2937',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 600,
  },
  article: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '120px 24px 60px',
  },
  breadcrumb: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbLink: {
    color: '#64748b',
    textDecoration: 'none',
  },
  breadcrumbSep: {
    color: '#cbd5e1',
  },
  postHeader: {
    marginBottom: 36,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: '#2563eb',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  postTitle: {
    fontFamily: 'var(--font-ko)',
    fontSize: 'clamp(28px, 4vw, 40px)',
    fontWeight: 800,
    lineHeight: 1.25,
    color: '#1a1a18',
    letterSpacing: -1,
    marginBottom: 18,
  },
  postExcerpt: {
    fontSize: 17,
    lineHeight: 1.6,
    color: '#475569',
    marginBottom: 20,
  },
  postMeta: {
    fontSize: 13,
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  metaDot: {
    color: '#cbd5e1',
  },
  heroImageWrap: {
    marginBottom: 40,
    borderRadius: 14,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  tagsWrap: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 8,
    marginTop: 48,
    paddingTop: 24,
    borderTop: '1px solid #ececea',
  },
  tagChip: {
    padding: '6px 14px',
    background: '#f8f7f4',
    border: '1px solid #e0dfd8',
    borderRadius: 999,
    fontSize: 12,
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: 500,
  },
  backWrap: {
    marginTop: 40,
    textAlign: 'center' as const,
  },
  backBtn: {
    display: 'inline-block',
    padding: '12px 24px',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    color: '#475569',
  },
  relatedSection: {
    marginTop: 80,
    paddingTop: 48,
    borderTop: '1px solid #ececea',
  },
  relatedTitle: {
    fontFamily: 'var(--font-ko)',
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a18',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  relatedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 20,
  },
  relatedCardLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  relatedCard: {
    background: '#fff',
    border: '1px solid #ececea',
    borderRadius: 12,
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  relatedThumb: {
    width: '100%',
    aspectRatio: '16 / 9',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#f8f7f4',
  },
  relatedThumbPlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#cbd5e1',
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 1,
  },
  relatedBody: {
    padding: '14px 16px 18px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  relatedCardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1a1a18',
    lineHeight: 1.4,
    marginBottom: 8,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  relatedDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 'auto',
  },
};

