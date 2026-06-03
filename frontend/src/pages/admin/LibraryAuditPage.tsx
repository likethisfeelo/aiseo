import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminListLibraryAudit } from '../../api';

interface AuditEntry {
  ts: string;
  actor: string;
  actorEmail?: string;
  action: string;
  target?: string;
  summary?: string;
  before?: string;
  after?: string;
}

const ACTION_LABEL: Record<string, { ko: string; color: string }> = {
  'cover.create': { ko: '표지 생성', color: '#16a34a' },
  'cover.update': { ko: '표지 수정', color: '#2563eb' },
  'cover.delete': { ko: '표지 삭제', color: '#dc2626' },
  'cover.reorder': { ko: '챕터 정렬', color: '#9333ea' },
  'post.create': { ko: '포스트 생성', color: '#16a34a' },
  'post.update': { ko: '포스트 수정', color: '#2563eb' },
  'post.delete': { ko: '포스트 삭제', color: '#dc2626' },
};

const formatTs = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export function LibraryAuditPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = (await adminListLibraryAudit(200)) as { entries: AuditEntry[]; count: number };
      setEntries(data.entries || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '감사 로그 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>라이브러리 감사 로그</h1>
          <p style={styles.subtitle}>최근 admin mutation 기록 — 누가 언제 무엇을 바꿨는지. 최신순 {entries.length}건.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/admin/library/covers')} style={styles.secondaryBtn}>표지 관리 →</button>
          <button onClick={() => navigate('/admin/library/posts')} style={styles.secondaryBtn}>포스트 관리 →</button>
          <button onClick={load} style={styles.primaryBtn}>↻ 새로고침</button>
        </div>
      </div>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p style={styles.msg}>아직 기록된 활동이 없습니다.</p>
      )}

      {entries.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>시각</th>
                <th style={styles.th}>액션</th>
                <th style={styles.th}>대상</th>
                <th style={styles.th}>actor</th>
                <th style={styles.th}>요약</th>
                <th style={styles.th}>상세</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const meta = ACTION_LABEL[e.action] || { ko: e.action, color: '#666' };
                const expanded = expandedIdx === i;
                return (
                  <>
                    <tr key={`${e.ts}-${i}`} style={styles.tr}>
                      <td style={{ ...styles.td, whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 11 }}>{formatTs(e.ts)}</td>
                      <td style={styles.td}>
                        <span style={{
                          display: 'inline-block', padding: '3px 8px', borderRadius: 10,
                          fontSize: 11, fontWeight: 600,
                          background: `${meta.color}18`,
                          color: meta.color,
                        }}>{meta.ko}</span>
                      </td>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: 11, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.target || '—'}</td>
                      <td style={{ ...styles.td, fontSize: 11, color: '#666' }}>{e.actorEmail || e.actor || '—'}</td>
                      <td style={{ ...styles.td, maxWidth: 380, color: '#333' }}>{e.summary || '—'}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {(e.before || e.after) && (
                          <button onClick={() => setExpandedIdx(expanded ? null : i)} style={styles.smallBtn}>
                            {expanded ? '닫기' : '+'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr key={`${e.ts}-${i}-detail`}>
                        <td colSpan={6} style={{ ...styles.td, background: 'var(--bg-soft, #f8f9fa)', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 11, fontFamily: 'monospace' }}>
                            <div>
                              <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--danger, #dc2626)' }}>before</div>
                              <pre style={styles.codeBlock}>{e.before || '(없음)'}</pre>
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--success-dark, #16a34a)' }}>after</div>
                              <pre style={styles.codeBlock}>{e.after || '(없음)'}</pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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
  page: { maxWidth: 1300, margin: '0 auto', padding: '40px 24px', fontFamily: 'var(--font-ko)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 16 },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  primaryBtn: { padding: '9px 18px', border: 'none', borderRadius: 6, background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  secondaryBtn: { padding: '9px 18px', border: '1px solid var(--border-strong)', background: '#fff', borderRadius: 6, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' },
  smallBtn: { padding: '4px 10px', border: '1px solid var(--border-strong)', background: '#fff', borderRadius: 4, fontSize: 11, cursor: 'pointer' },
  msg: { fontSize: 14, color: '#666', padding: '40px 0', textAlign: 'center' },
  tableWrap: { border: '1px solid var(--border)', borderRadius: 10, overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '12px 14px', background: 'var(--bg-soft)', fontWeight: 600, color: '#555', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid var(--border-soft)' },
  td: { padding: '11px 14px', color: '#333', verticalAlign: 'top' },
  codeBlock: { background: '#fff', padding: 8, borderRadius: 4, border: '1px solid var(--border)', overflowX: 'auto', maxHeight: 200, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 10 },
};
