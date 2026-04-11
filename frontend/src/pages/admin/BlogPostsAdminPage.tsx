import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminListBlogPosts, adminDeleteBlogPost } from '../../api';

interface BlogPostRow {
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'deleted';
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  featured?: boolean;
  featuredOrder?: number;
  viewCount?: number;
  thumbnailUrl?: string;
}

type Filter = 'all' | 'draft' | 'published' | 'deleted';

const STATUS_LABELS: Record<string, string> = {
  draft: '초안',
  published: '발행',
  deleted: '삭제',
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  draft: { bg: '#fef3c7', fg: '#92400e' },
  published: { bg: '#d1fae5', fg: '#065f46' },
  deleted: { bg: '#fee2e2', fg: '#991b1b' },
};

export function BlogPostsAdminPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = (await adminListBlogPosts()) as { posts: BlogPostRow[]; count: number };
      setItems(data.posts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '글 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((p) => p.status === filter);
  }, [items, filter]);

  const counts = useMemo(() => {
    const c = { all: items.length, draft: 0, published: 0, deleted: 0 };
    for (const p of items) {
      if (p.status === 'draft') c.draft++;
      else if (p.status === 'published') c.published++;
      else if (p.status === 'deleted') c.deleted++;
    }
    return c;
  }, [items]);

  const handleDelete = async (slug: string, title: string) => {
    if (!window.confirm(`"${title}" 을(를) 삭제하시겠습니까?\n(삭제 후 status='deleted' 로 처리됩니다. 복구 가능.)`)) {
      return;
    }
    try {
      await adminDeleteBlogPost(slug);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>블로그 글 관리</h1>
          <p style={styles.subtitle}>총 {items.length}개 · 발행 {counts.published} · 초안 {counts.draft} · 삭제 {counts.deleted}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate('/admin/blog/categories')}
            style={styles.secondaryBtn}
          >
            카테고리 관리
          </button>
          <button
            onClick={() => navigate('/admin/blog/posts/new')}
            style={styles.primaryBtn}
          >
            + 새 글 작성
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={styles.tabs}>
        {(['all', 'published', 'draft', 'deleted'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.tab,
              ...(filter === f ? styles.tabActive : {}),
            }}
          >
            {f === 'all' ? '전체' : STATUS_LABELS[f]} ({counts[f]})
          </button>
        ))}
      </div>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: '#c0392b' }}>오류: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p style={styles.msg}>{filter === 'all' ? '아직 작성된 글이 없습니다.' : `${STATUS_LABELS[filter] || filter} 글이 없습니다.`}</p>
      )}

      {filtered.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>제목</th>
                <th style={styles.th}>카테고리</th>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>Featured</th>
                <th style={styles.th}>조회수</th>
                <th style={styles.th}>발행일</th>
                <th style={styles.th}>수정일</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const sc = STATUS_COLORS[p.status] || STATUS_COLORS.draft;
                return (
                  <tr key={p.slug} style={styles.tr}>
                    <td style={{ ...styles.td, maxWidth: 360 }}>
                      <div style={{ fontWeight: 500, color: '#1a1a18' }}>{p.title || '(제목 없음)'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', marginTop: 2 }}>
                        /{p.slug}
                      </div>
                    </td>
                    <td style={styles.td}>{p.category || '-'}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: 10,
                          fontSize: 11,
                          fontWeight: 600,
                          background: sc.bg,
                          color: sc.fg,
                        }}
                      >
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {p.featured ? (
                        <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ {p.featuredOrder ?? '-'}</span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>{p.viewCount ?? 0}</td>
                    <td style={styles.td}>{formatDate(p.publishedAt)}</td>
                    <td style={styles.td}>{formatDate(p.updatedAt || p.createdAt)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' as const }}>
                      <button
                        onClick={() => navigate(`/admin/blog/posts/${encodeURIComponent(p.slug)}/edit`)}
                        style={styles.smallBtn}
                      >
                        편집
                      </button>
                      {p.status !== 'deleted' && (
                        <button
                          onClick={() => handleDelete(p.slug, p.title || p.slug)}
                          style={{ ...styles.smallBtn, color: '#dc2626', borderColor: '#fecaca' }}
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: 600, color: '#1a1a18', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  tabs: { display: 'flex', gap: 6, marginBottom: 16 },
  tab: {
    padding: '8px 14px',
    border: '1px solid #e2e8f0',
    background: '#fff',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
    color: '#64748b',
    fontWeight: 500,
  },
  tabActive: { background: '#1f2937', color: '#fff', borderColor: '#1f2937' },
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
    marginLeft: 6,
  },
  msg: { fontSize: 14, color: '#666', padding: '40px 0', textAlign: 'center' },
  tableWrap: { border: '1px solid #e0dfd8', borderRadius: 10, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: {
    textAlign: 'left' as const,
    padding: '12px 14px',
    background: '#f8f7f4',
    fontWeight: 600,
    color: '#555',
    borderBottom: '1px solid #e0dfd8',
    whiteSpace: 'nowrap' as const,
  },
  tr: { borderBottom: '1px solid #f0efec' },
  td: { padding: '11px 14px', color: '#333', verticalAlign: 'middle' as const, whiteSpace: 'nowrap' as const },
};
