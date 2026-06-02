import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminListLibraryCovers, adminDeleteLibraryCover } from '../../api';

interface CoverRow {
  slug: string;
  title: string;
  description?: string;
  tag?: string;
  sortOrder?: number;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function LibraryCoversAdminPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<CoverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = (await adminListLibraryCovers()) as { covers: CoverRow[]; count: number };
      setItems(data.covers || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '표지 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (slug: string, title: string) => {
    if (!window.confirm(`표지 "${title}" 을(를) 삭제합니다.\n해당 표지의 챕터 매핑도 모두 사라집니다. (포스트 자체는 유지)`)) return;
    try {
      await adminDeleteLibraryCover(slug);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>라이브러리 표지 관리</h1>
          <p style={styles.subtitle}>총 {items.length}개 · 발행 {items.filter((c) => c.isPublished).length} · 비공개 {items.filter((c) => !c.isPublished).length}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/library/posts')} style={styles.secondaryBtn}>
            포스트 관리 →
          </button>
          <button onClick={() => navigate('/admin/library/covers/new')} style={styles.primaryBtn}>
            + 새 표지
          </button>
        </div>
      </div>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}

      {!loading && !error && items.length === 0 && (
        <p style={styles.msg}>아직 표지가 없습니다. <strong>+ 새 표지</strong> 로 시작하세요.</p>
      )}

      {items.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>순서</th>
                <th style={styles.th}>제목 / Slug</th>
                <th style={styles.th}>태그</th>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>설명</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.slug} style={styles.tr}>
                  <td style={{ ...styles.td, width: 60 }}>{c.sortOrder ?? 9999}</td>
                  <td style={{ ...styles.td, maxWidth: 320 }}>
                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{c.title || '(제목 없음)'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2 }}>/library/{c.slug}/</div>
                  </td>
                  <td style={styles.td}>{c.tag || '-'}</td>
                  <td style={styles.td}>
                    <span style={{
                      display: 'inline-block', padding: '3px 8px', borderRadius: 10,
                      fontSize: 11, fontWeight: 600,
                      background: c.isPublished ? 'var(--success-soft)' : 'var(--warning-soft)',
                      color: c.isPublished ? 'var(--success-dark)' : 'var(--warning-dark)',
                    }}>
                      {c.isPublished ? '발행' : '비공개'}
                    </span>
                  </td>
                  <td style={{ ...styles.td, maxWidth: 420, color: '#666' }}>
                    {c.description ? c.description.slice(0, 90) + (c.description.length > 90 ? '…' : '') : '—'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' as const }}>
                    <button
                      onClick={() => navigate(`/admin/library/covers/${encodeURIComponent(c.slug)}/edit`)}
                      style={styles.smallBtn}
                    >편집</button>
                    <button
                      onClick={() => handleDelete(c.slug, c.title || c.slug)}
                      style={{ ...styles.smallBtn, color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}
                    >삭제</button>
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
