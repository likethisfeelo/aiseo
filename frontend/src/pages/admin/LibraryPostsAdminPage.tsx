import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminListLibraryPosts, adminDeleteLibraryPost } from '../../api';

// 공개 reader 는 apex 도메인. dev / prod 분기.
const PUBLIC_LIBRARY_BASE =
  typeof window !== 'undefined' && window.location.hostname.startsWith('site.dev.')
    ? 'https://dev.aiseo.tips'
    : 'https://aiseo.tips';

interface PostRow {
  slug: string;
  title?: string;
  tag?: string;
  readMinutes?: number;
  canonicalCoverSlug?: string;
  isPublished?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

type Filter = 'all' | 'published' | 'draft';

export function LibraryPostsAdminPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const data = (await adminListLibraryPosts()) as { posts: PostRow[]; count: number };
      setItems(data.posts || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '포스트 목록 로드 실패');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'published') return items.filter((p) => p.isPublished);
    return items.filter((p) => !p.isPublished);
  }, [items, filter]);

  const counts = useMemo(() => ({
    all: items.length,
    published: items.filter((p) => p.isPublished).length,
    draft: items.filter((p) => !p.isPublished).length,
  }), [items]);

  const handleDelete = async (slug: string, title: string) => {
    if (!window.confirm(`"${title}" 포스트를 삭제하시겠습니까?\n복구 불가. 표지 매핑도 함께 제거됩니다.`)) return;
    try {
      await adminDeleteLibraryPost(slug);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>라이브러리 포스트 관리</h1>
          <p style={styles.subtitle}>총 {items.length}개 · 발행 {counts.published} · 비공개 {counts.draft}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/library/covers')} style={styles.secondaryBtn}>표지 관리 →</button>
          <button onClick={() => navigate('/admin/library/posts/new')} style={styles.primaryBtn}>+ 새 포스트</button>
        </div>
      </div>

      <div style={styles.tabs}>
        {(['all', 'published', 'draft'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...styles.tab, ...(filter === f ? styles.tabActive : {}) }}>
            {f === 'all' ? '전체' : f === 'published' ? '발행' : '비공개'} ({counts[f]})
          </button>
        ))}
      </div>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}

      {!loading && !error && filtered.length === 0 && <p style={styles.msg}>표시할 포스트가 없습니다.</p>}

      {filtered.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>제목</th>
                <th style={styles.th}>태그</th>
                <th style={styles.th}>대표 표지</th>
                <th style={styles.th}>읽기 시간</th>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>수정일</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.slug} style={styles.tr}>
                  <td style={{ ...styles.td, maxWidth: 360 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.title || '(제목 없음)'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>/{p.slug}</div>
                  </td>
                  <td style={styles.td}>{p.tag || '-'}</td>
                  <td style={styles.td}>
                    {p.canonicalCoverSlug ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.canonicalCoverSlug}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={styles.td}>{p.readMinutes ? `${p.readMinutes}분` : '-'}</td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 10,
                      fontSize: 11, fontWeight: 600,
                      background: p.isPublished ? 'var(--success-soft)' : 'var(--warning-soft)',
                      color: p.isPublished ? 'var(--success-dark)' : 'var(--warning-dark)',
                    }}>
                      {p.isPublished ? '발행' : '비공개'}
                    </span>
                  </td>
                  <td style={styles.td}>{formatDate(p.updatedAt || p.createdAt)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' as const }}>
                    {p.isPublished && p.canonicalCoverSlug && (
                      <a
                        href={`${PUBLIC_LIBRARY_BASE}/library/${encodeURIComponent(p.canonicalCoverSlug)}/${encodeURIComponent(p.slug)}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ ...styles.smallBtn, textDecoration: 'none', display: 'inline-block' }}
                        title="공개 리더 페이지에서 보기 (새 창)"
                      >보기 ↗</a>
                    )}
                    <button onClick={() => navigate(`/admin/library/posts/${encodeURIComponent(p.slug)}/edit`)} style={styles.smallBtn}>편집</button>
                    <button onClick={() => handleDelete(p.slug, p.title || p.slug)} style={{ ...styles.smallBtn, color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px', fontFamily: 'var(--font-ko)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  tabs: { display: 'flex', gap: 6, marginBottom: 16 },
  tab: { padding: '8px 14px', border: '1px solid var(--border)', background: '#fff', borderRadius: 8, fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 500 },
  tabActive: { background: 'var(--text-primary)', color: '#fff', borderColor: 'var(--text-primary)' },
  primaryBtn: { padding: '9px 18px', border: 'none', borderRadius: 6, background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  secondaryBtn: { padding: '9px 18px', border: '1px solid var(--border-strong)', background: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' },
  smallBtn: { padding: '6px 12px', border: '1px solid var(--border-strong)', background: '#fff', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginLeft: 6 },
  msg: { fontSize: 14, color: '#666', padding: '40px 0', textAlign: 'center' },
  tableWrap: { border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { textAlign: 'left' as const, padding: '12px 14px', background: 'var(--bg-soft)', fontWeight: 600, color: '#555', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' as const },
  tr: { borderBottom: '1px solid var(--border-soft)' },
  td: { padding: '11px 14px', color: '#333', verticalAlign: 'middle' as const, whiteSpace: 'nowrap' as const },
};
