import { useState, useEffect } from 'react';
import {
  adminListBlogCategories,
  adminCreateBlogCategory,
  adminUpdateBlogCategory,
  adminDeleteBlogCategory,
} from '../../api';

interface BlogCategory {
  slug: string;
  name: string;
  order: number;
  createdAt?: string;
}

const SLUG_RE = /^[a-z0-9-]+$/;

export function BlogCategoriesAdminPage() {
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newSlug, setNewSlug] = useState('');
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState<string>('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = (await adminListBlogCategories()) as { categories: BlogCategory[] };
      setItems(data.categories || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '카테고리 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const slug = newSlug.trim().toLowerCase();
    const name = newName.trim();
    const order = newOrder.trim() ? Number(newOrder) : undefined;
    setCreateError('');

    if (!slug || !SLUG_RE.test(slug)) {
      setCreateError('Slug 는 영문 소문자·숫자·하이픈만 가능합니다.');
      return;
    }
    if (!name) {
      setCreateError('이름은 필수입니다.');
      return;
    }

    setCreating(true);
    try {
      await adminCreateBlogCategory({ slug, name, order });
      setNewSlug('');
      setNewName('');
      setNewOrder('');
      await load();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : '생성 실패');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (cat: BlogCategory) => {
    setEditingSlug(cat.slug);
    setEditName(cat.name);
    setEditOrder(String(cat.order ?? ''));
    setEditError('');
  };

  const cancelEdit = () => {
    setEditingSlug(null);
    setEditName('');
    setEditOrder('');
    setEditError('');
  };

  const handleSaveEdit = async (slug: string) => {
    const name = editName.trim();
    const order = editOrder.trim() ? Number(editOrder) : undefined;
    setEditError('');

    if (!name) {
      setEditError('이름은 필수입니다.');
      return;
    }

    setEditSaving(true);
    try {
      await adminUpdateBlogCategory(slug, { name, order });
      cancelEdit();
      await load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : '수정 실패');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!window.confirm(`카테고리 "${slug}" 를 삭제하시겠습니까?\n(이 카테고리를 사용하는 글의 분류 표시에 영향이 갑니다.)`)) {
      return;
    }
    try {
      await adminDeleteBlogCategory(slug);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : '삭제 실패');
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>블로그 카테고리 관리</h1>
      <p style={styles.subtitle}>총 {items.length}개의 카테고리</p>

      {/* Create form */}
      <div style={styles.createBox}>
        <div style={styles.createTitle}>새 카테고리 추가</div>
        <div style={styles.createRow}>
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value.toLowerCase())}
            placeholder="slug (예: tutorials)"
            style={{ ...styles.input, flex: '0 0 200px' }}
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="표시 이름 (예: 튜토리얼)"
            style={{ ...styles.input, flex: 1 }}
          />
          <input
            value={newOrder}
            onChange={(e) => setNewOrder(e.target.value)}
            placeholder="순서"
            type="number"
            style={{ ...styles.input, flex: '0 0 90px' }}
          />
          <button onClick={handleCreate} disabled={creating} style={styles.primaryBtn}>
            {creating ? '추가 중...' : '추가'}
          </button>
        </div>
        {createError && <p style={styles.errMsg}>{createError}</p>}
      </div>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}

      {!loading && !error && items.length === 0 && (
        <p style={styles.msg}>아직 등록된 카테고리가 없습니다.</p>
      )}

      {items.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Slug</th>
                <th style={styles.th}>이름</th>
                <th style={styles.th}>순서</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((cat) => {
                const isEditing = editingSlug === cat.slug;
                return (
                  <tr key={cat.slug} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                      {cat.slug}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ ...styles.input, marginBottom: 0 }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{cat.name}</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {isEditing ? (
                        <input
                          value={editOrder}
                          onChange={(e) => setEditOrder(e.target.value)}
                          type="number"
                          style={{ ...styles.input, marginBottom: 0, width: 80 }}
                        />
                      ) : (
                        cat.order ?? '-'
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(cat.slug)}
                            disabled={editSaving}
                            style={{ ...styles.smallBtn, background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
                          >
                            {editSaving ? '저장 중...' : '저장'}
                          </button>
                          <button onClick={cancelEdit} style={styles.smallBtn}>
                            취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(cat)} style={styles.smallBtn}>
                            편집
                          </button>
                          <button
                            onClick={() => handleDelete(cat.slug)}
                            style={{ ...styles.smallBtn, color: 'var(--danger)', borderColor: 'var(--danger-soft)' }}
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {editError && <p style={{ ...styles.errMsg, marginTop: 8 }}>{editError}</p>}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '40px 24px',
    fontFamily: 'var(--font-ko)',
  },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
  createBox: {
    background: 'var(--bg-soft)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  createTitle: { fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 },
  createRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  input: {
    padding: 8,
    border: '1px solid var(--border-strong)',
    borderRadius: 6,
    fontSize: 13,
    boxSizing: 'border-box' as const,
    marginBottom: 0,
  },
  primaryBtn: {
    padding: '9px 18px',
    border: 'none',
    borderRadius: 6,
    background: 'var(--primary)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  smallBtn: {
    padding: '6px 12px',
    border: '1px solid var(--border-strong)',
    background: '#fff',
    borderRadius: 6,
    fontSize: 12,
    cursor: 'pointer',
    marginLeft: 6,
  },
  msg: { fontSize: 14, color: '#666', padding: '24px 0', textAlign: 'center' },
  errMsg: { fontSize: 12, color: 'var(--danger)', marginTop: 8, marginBottom: 0 },
  tableWrap: { border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: {
    textAlign: 'left' as const,
    padding: '12px 14px',
    background: 'var(--bg-soft)',
    fontWeight: 600,
    color: '#555',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  },
  tr: { borderBottom: '1px solid var(--border-soft)' },
  td: { padding: '11px 14px', color: '#333', verticalAlign: 'middle' as const },
};
