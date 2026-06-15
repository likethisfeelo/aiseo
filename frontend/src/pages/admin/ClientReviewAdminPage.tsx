import { useEffect, useMemo, useState } from 'react';
import { adminListClientStickers, adminToggleClientStickerCheck, adminUpsertClientProject } from '../../api';
import type { ClientSticker, ClientStickerType } from '../../api';

const TYPE_LABELS: Record<ClientStickerType, string> = {
  explanation: '설명 요청',
  adjust: '조정 또는 확인 필요',
  'date-change': '날짜 변경',
  discussion: '협의 필요',
};

type TypeFilter = '' | ClientStickerType;
type CheckFilter = '' | 'unchecked' | 'checked';

export function ClientReviewAdminPage() {
  const [projectId, setProjectId] = useState('stork');
  const [items, setItems] = useState<ClientSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('');
  const [checkFilter, setCheckFilter] = useState<CheckFilter>('');

  // 프로젝트 생성/비밀번호 설정 폼
  const [pwOpen, setPwOpen] = useState(false);
  const [pwProjectId, setPwProjectId] = useState('stork');
  const [pwName, setPwName] = useState('STORK 작업 일정');
  const [pwValue, setPwValue] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const savePassword = async () => {
    if (!pwProjectId.trim() || !pwValue) { setPwMsg('프로젝트 ID와 비밀번호를 입력해주세요.'); return; }
    setPwSaving(true);
    setPwMsg('');
    try {
      await adminUpsertClientProject({ projectId: pwProjectId.trim(), projectName: pwName.trim(), password: pwValue });
      setPwMsg(`저장 완료 — "${pwProjectId.trim()}" 프로젝트 비밀번호가 설정되었습니다.`);
      setPwValue('');
    } catch (e) {
      setPwMsg('저장 실패: ' + (e as Error).message);
    } finally {
      setPwSaving(false);
    }
  };

  const reload = (pid: string) => {
    setLoading(true);
    setError('');
    adminListClientStickers(pid)
      .then((data) => setItems(data.stickers || []))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload(projectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (typeFilter && it.type !== typeFilter) return false;
      if (checkFilter === 'checked' && !it.adminChecked) return false;
      if (checkFilter === 'unchecked' && it.adminChecked) return false;
      return true;
    });
  }, [items, typeFilter, checkFilter]);

  const toggleCheck = async (s: ClientSticker, checked: boolean) => {
    setItems((prev) => prev.map((x) => (x.stickerId === s.stickerId ? { ...x, adminChecked: checked } : x)));
    try {
      await adminToggleClientStickerCheck({ projectId, stickerId: s.stickerId, checked });
    } catch (e) {
      // 실패 시 롤백
      setItems((prev) => prev.map((x) => (x.stickerId === s.stickerId ? { ...x, adminChecked: !checked } : x)));
      setError((e as Error).message);
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>클라이언트 검토 요청 관리</h1>
      <p style={styles.subtitle}>
        총 {items.length}건 · 필터 {filtered.length}건 · 미확인 {items.filter((i) => !i.adminChecked).length}건
      </p>

      <div style={styles.pwBox}>
        <button onClick={() => setPwOpen((v) => !v)} style={styles.pwToggle}>
          {pwOpen ? '▼' : '▶'} 프로젝트 비밀번호 설정
        </button>
        {pwOpen && (
          <div style={styles.pwInner}>
            <p style={styles.pwHelp}>
              클라이언트 전용 링크(<code>site.aiseo.tips/client/&lt;프로젝트ID&gt;</code>) 접속 비밀번호를
              설정/변경합니다. 같은 프로젝트 ID로 다시 저장하면 비밀번호가 교체됩니다.
            </p>
            <div style={styles.pwRow}>
              <input value={pwProjectId} onChange={(e) => setPwProjectId(e.target.value)} placeholder="프로젝트 ID (예: stork)" style={styles.select} />
              <input value={pwName} onChange={(e) => setPwName(e.target.value)} placeholder="프로젝트 이름" style={styles.select} />
              <input value={pwValue} onChange={(e) => setPwValue(e.target.value)} type="text" placeholder="새 비밀번호" style={styles.select} />
              <button onClick={savePassword} disabled={pwSaving} style={styles.btn}>{pwSaving ? '저장 중...' : '저장'}</button>
            </div>
            {pwMsg && <p style={{ ...styles.pwHelp, color: pwMsg.startsWith('저장 완료') ? 'var(--accent-deep, #6b4fb8)' : 'var(--danger)' }}>{pwMsg}</p>}
          </div>
        )}
      </div>

      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>
          프로젝트
          <span style={{ display: 'flex', gap: 6 }}>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && reload(projectId)}
              style={styles.select}
              placeholder="stork"
            />
            <button onClick={() => reload(projectId)} style={styles.btn}>조회</button>
          </span>
        </label>
        <label style={styles.filterLabel}>
          요청 유형
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as TypeFilter)} style={styles.select}>
            <option value="">전체</option>
            <option value="explanation">{TYPE_LABELS.explanation}</option>
            <option value="adjust">{TYPE_LABELS.adjust}</option>
            <option value="date-change">{TYPE_LABELS['date-change']}</option>
            <option value="discussion">{TYPE_LABELS.discussion}</option>
          </select>
        </label>
        <label style={styles.filterLabel}>
          확인 상태
          <select value={checkFilter} onChange={(e) => setCheckFilter(e.target.value as CheckFilter)} style={styles.select}>
            <option value="">전체</option>
            <option value="unchecked">미확인</option>
            <option value="checked">확인 완료</option>
          </select>
        </label>
      </div>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}
      {!loading && !error && filtered.length === 0 && <p style={styles.msg}>해당 조건의 요청이 없습니다.</p>}

      {filtered.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>확인</th>
                <th style={styles.th}>요청 유형</th>
                <th style={styles.th}>요청 위치</th>
                <th style={styles.th}>메모</th>
                <th style={styles.th}>희망 날짜</th>
                <th style={styles.th}>작성자</th>
                <th style={styles.th}>작성 시각</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.stickerId} style={{ ...styles.tr, opacity: item.adminChecked ? 0.5 : 1 }}>
                  <td style={styles.td}>
                    <input
                      type="checkbox"
                      checked={!!item.adminChecked}
                      onChange={(e) => toggleCheck(item, e.target.checked)}
                      style={{ cursor: 'pointer', width: 16, height: 16 }}
                    />
                  </td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{TYPE_LABELS[item.type] || item.type}</td>
                  <td style={styles.td}>{item.itemLabel || item.itemId}</td>
                  <td style={{ ...styles.td, whiteSpace: 'normal', maxWidth: 320 }}>{item.memo || '-'}</td>
                  <td style={styles.td}>{item.desiredDate || '-'}</td>
                  <td style={styles.td}>{item.authorName || '익명'}</td>
                  <td style={styles.td}>{formatDate(item.createdAt)}</td>
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
  page: { maxWidth: 1400, margin: '0 auto', padding: '40px 24px', fontFamily: 'var(--font-ko)' },
  title: { fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888', marginBottom: 16 },
  pwBox: { border: '1px solid var(--border)', borderRadius: 10, marginBottom: 20, background: 'var(--bg-soft)' },
  pwToggle: { width: '100%', textAlign: 'left' as const, padding: '12px 16px', border: 'none', background: 'none', fontSize: 13, fontWeight: 600, color: '#444', cursor: 'pointer', fontFamily: 'var(--font-ko)' },
  pwInner: { padding: '0 16px 16px' },
  pwHelp: { fontSize: 12, color: '#777', lineHeight: 1.6, margin: '0 0 10px' },
  pwRow: { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'center' },
  filterRow: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, alignItems: 'flex-end' },
  filterLabel: { display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#666' },
  select: { padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13, background: '#fff', minWidth: 140 },
  btn: { padding: '6px 14px', border: 'none', borderRadius: 6, background: 'var(--text-primary)', color: '#fff', fontSize: 13, cursor: 'pointer' },
  msg: { fontSize: 14, color: '#666', padding: '40px 0', textAlign: 'center' },
  tableWrap: { overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { textAlign: 'left' as const, padding: '12px 14px', background: 'var(--bg-soft)', fontWeight: 600, color: '#555', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' as const },
  tr: { borderBottom: '1px solid var(--border-soft)' },
  td: { padding: '11px 14px', color: '#333', whiteSpace: 'nowrap' as const, verticalAlign: 'top' },
};
