import { useEffect, useState, useCallback, type FormEvent } from 'react';
import {
  adminListUsers,
  adminGrantPaidMember,
  adminRevokePaidMember,
  type AdminUserRow,
} from '../../api';

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [busyUser, setBusyUser] = useState<string | null>(null);

  const load = useCallback(async (opts?: { append?: boolean; token?: string; search?: string }) => {
    const append = !!opts?.append;
    if (append) setLoadingMore(true); else setLoading(true);
    setError('');
    try {
      const data = await adminListUsers({
        search: opts?.search ?? appliedSearch,
        paginationToken: opts?.token,
      });
      setUsers((prev) => append ? [...prev, ...data.users] : data.users);
      setNextToken(data.nextToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : '사용자 목록을 불러오지 못했습니다.');
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [appliedSearch]);

  useEffect(() => { load(); }, [load]);

  const onSubmitSearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    load({ search: search.trim() });
  };

  const togglePaid = async (u: AdminUserRow) => {
    setBusyUser(u.username);
    setError('');
    try {
      if (u.isPaid) {
        await adminRevokePaidMember(u.username);
      } else {
        await adminGrantPaidMember(u.username);
      }
      setUsers((prev) => prev.map((row) => row.username === u.username
        ? { ...row, isPaid: !u.isPaid, groups: u.isPaid
          ? row.groups.filter((g) => g !== 'paid_member')
          : [...row.groups, 'paid_member'] }
        : row));
    } catch (e) {
      setError(e instanceof Error ? e.message : '등급 변경에 실패했습니다.');
    } finally {
      setBusyUser(null);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>회원 등급 관리</h1>
      <p style={styles.subtitle}>유료 회원(paid_member) 그룹을 관리합니다. 일반 회원은 가입 후 안내 페이지로 이동하며, paid_member로 승급하면 서비스에 접근할 수 있습니다.</p>

      <form onSubmit={onSubmitSearch} style={styles.searchRow}>
        <input
          type="text"
          placeholder="이메일로 검색 (앞부분 일치)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <button type="submit" style={styles.searchBtn} disabled={loading}>
          검색
        </button>
        {appliedSearch && (
          <button
            type="button"
            style={styles.clearBtn}
            onClick={() => { setSearch(''); setAppliedSearch(''); load({ search: '' }); }}
          >
            전체 보기
          </button>
        )}
      </form>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.msg}>불러오는 중...</div>
      ) : users.length === 0 ? (
        <div style={styles.msg}>사용자가 없습니다.</div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>이메일</th>
                <th style={styles.th}>이름</th>
                <th style={styles.th}>가입일</th>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>그룹</th>
                <th style={styles.th}>등급</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.username} style={styles.tr}>
                  <td style={styles.td}>{u.email || '-'}</td>
                  <td style={styles.td}>{u.name || '-'}</td>
                  <td style={styles.td}>{formatDate(u.createdAt)}</td>
                  <td style={styles.td}>
                    <span style={u.enabled ? styles.statusOk : styles.statusOff}>
                      {u.enabled ? u.status || 'CONFIRMED' : 'DISABLED'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {u.groups.length > 0 ? (
                      <span style={styles.groupTags}>
                        {u.groups.map((g) => (
                          <span key={g} style={g === 'admin' ? styles.tagAdmin : styles.tagPaid}>{g}</span>
                        ))}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={styles.td}>
                    <button
                      type="button"
                      style={u.isPaid ? styles.btnRevoke : styles.btnGrant}
                      onClick={() => togglePaid(u)}
                      disabled={busyUser === u.username}
                    >
                      {busyUser === u.username
                        ? '처리 중…'
                        : u.isPaid ? '유료 해제' : '유료 승급'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nextToken && (
        <div style={styles.moreRow}>
          <button
            type="button"
            style={styles.searchBtn}
            disabled={loadingMore}
            onClick={() => load({ append: true, token: nextToken })}
          >
            {loadingMore ? '불러오는 중…' : '더 보기'}
          </button>
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
  title: {
    fontSize: 22,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  searchRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    maxWidth: 360,
    padding: '8px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    background: '#fff',
  },
  searchBtn: {
    padding: '8px 18px',
    background: '#2563eb',
    color: '#fff',
    border: 0,
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  clearBtn: {
    padding: '8px 14px',
    background: '#fff',
    color: '#475569',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 13,
    marginBottom: 12,
  },
  msg: {
    fontSize: 14,
    color: '#666',
    padding: '40px 0',
    textAlign: 'center' as const,
  },
  tableWrap: {
    overflowX: 'auto',
    border: '1px solid var(--border)',
    borderRadius: 10,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 13,
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 14px',
    background: 'var(--bg-soft)',
    fontWeight: 600,
    color: '#555',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  },
  tr: { borderBottom: '1px solid var(--border)' },
  td: {
    padding: '12px 14px',
    color: '#1f2937',
    verticalAlign: 'middle' as const,
  },
  statusOk: {
    fontSize: 11,
    fontWeight: 600,
    color: '#059669',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: 6,
    padding: '2px 8px',
  },
  statusOff: {
    fontSize: 11,
    fontWeight: 600,
    color: '#b91c1c',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 6,
    padding: '2px 8px',
  },
  groupTags: { display: 'inline-flex', gap: 4, flexWrap: 'wrap' as const },
  tagPaid: {
    fontSize: 11,
    fontWeight: 600,
    color: '#6d28d9',
    background: '#f5f3ff',
    border: '1px solid #ddd6fe',
    borderRadius: 6,
    padding: '2px 8px',
  },
  tagAdmin: {
    fontSize: 11,
    fontWeight: 600,
    color: '#0369a1',
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: 6,
    padding: '2px 8px',
  },
  btnGrant: {
    padding: '6px 14px',
    background: '#6366f1',
    color: '#fff',
    border: 0,
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnRevoke: {
    padding: '6px 14px',
    background: '#fff',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  moreRow: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: 18,
  },
};
