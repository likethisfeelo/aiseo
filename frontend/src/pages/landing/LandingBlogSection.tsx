import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBlogFeatured } from '../../api';

interface FeaturedPost {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  thumbnailUrl?: string;
}

// Fallback gradient class cycled when a post has no thumbnailUrl.
// Matches the decorative styles defined in landing.css (.blog-thumb-1..4).
const FALLBACK_THUMB_CLASSES = ['blog-thumb-1', 'blog-thumb-2', 'blog-thumb-3', 'blog-thumb-4'];

export function LandingBlogSection() {
  const [posts, setPosts] = useState<FeaturedPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBlogFeatured()
      .then((data: { posts: FeaturedPost[] }) => {
        if (cancelled) return;
        setPosts(data.posts || []);
      })
      .catch(() => {
        if (cancelled) return;
        setPosts([]);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the entire section while loading or when there are no featured posts
  // yet. Prevents a flash of empty content on the marketing page during launch.
  if (!loaded || posts.length === 0) return null;

  return (
    <section className="blog-section" id="blog">
      <div className="blog-head">
        <span className="blog-head-title">SEO 인사이트 &amp; 가이드</span>
        <Link to="/blog" className="blog-all-btn">모든 아티클 보기 →</Link>
      </div>
      <div className="blog-grid">
        {posts.map((post, i) => {
          const hasThumb = !!post.thumbnailUrl;
          const fallbackClass = FALLBACK_THUMB_CLASSES[i % FALLBACK_THUMB_CLASSES.length];
          return (
            <Link
              key={post.slug}
              to={`/blog/${encodeURIComponent(post.slug)}`}
              className="blog-card"
              style={{ textDecoration: 'none' }}
            >
              <div className="blog-thumb">
                <div
                  className={`blog-thumb-inner${hasThumb ? '' : ` ${fallbackClass}`}`}
                  style={
                    hasThumb
                      ? {
                          backgroundImage: `url(${post.thumbnailUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }
                      : undefined
                  }
                >
                  {post.category && (
                    <div className="blog-thumb-tag">{post.category.toUpperCase()}</div>
                  )}
                </div>
              </div>
              <p className="blog-card-title">{post.title || '(제목 없음)'}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
