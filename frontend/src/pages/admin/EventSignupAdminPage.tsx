import { useEffect, useMemo, useState } from 'react';
import { adminGetEventSignups } from '../../api';
import type { EventCode, EventHasSite } from '../../api';

interface EventSignup {
  signupId: string;
  createdAt: string;
  eventCode: EventCode;
  name: string;
  phone: string;
  email?: string;
  industry?: string;
  region?: string;
  hasSite?: EventHasSite | '';
  concern?: string;
  source?: string;
  status?: string;
  kakaoConsent?: boolean;
}

const EVENT_LABELS: Record<EventCode, string> = {
  EVENT_01_FREE: 'EVENT 01 · 무료',
  EVENT_02_PAID: 'EVENT 02 · 검색 전략',
  EVENT_03_PAID: 'EVENT 03 · 콘텐츠 기획',
  EVENT_04_PAID: 'EVENT 04 · 풀패키지',
};

const HAS_SITE_LABEL: Record<string, string> = {
  yes: '있음',
  no: '없음',
  wip: '만드는 중',
  '': '-',
};

const STATUS_OPTIONS = ['', 'new', 'contacted', 'confirmed', 'completed', 'rejected'] as const;

type EventFilter = '' | EventCode;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

export function EventSignupAdminPage() {
  const [items, setItems] = useState<EventSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [eventFilter, setEventFilter] = useState<EventFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  useEffect(() => {
    adminGetEventSignups()
      .then((data: { signups: EventSignup[]; count: number }) => {
        setItems(data.signups || []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (eventFilter && it.eventCode !== eventFilter) return false;
      if (statusFilter && (it.status || 'new') !== statusFilter) return false;
      return true;
    });
  }, [items, eventFilter, statusFilter]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>이벤트 신청 관리 (Events 2026)</h1>
      <p style={styles.subtitle}>
        총 {items.length}건 · 필터 {filtered.length}건
      </p>

      <div style={styles.filterRow}>
        <label style={styles.filterLabel}>
          이벤트
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value as EventFilter)}
            style={styles.select}
          >
            <option value="">전체</option>
            <option value="EVENT_01_FREE">{EVENT_LABELS.EVENT_01_FREE}</option>
            <option value="EVENT_02_PAID">{EVENT_LABELS.EVENT_02_PAID}</option>
            <option value="EVENT_03_PAID">{EVENT_LABELS.EVENT_03_PAID}</option>
            <option value="EVENT_04_PAID">{EVENT_LABELS.EVENT_04_PAID}</option>
          </select>
        </label>
        <label style={styles.filterLabel}>
          상태
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={styles.select}
          >
            <option value="">전체</option>
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="confirmed">confirmed</option>
            <option value="completed">completed</option>
            <option value="rejected">rejected</option>
          </select>
        </label>
      </div>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p style={styles.msg}>해당 조건의 신청이 없습니다.</p>
      )}

      {filtered.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>신청일시</th>
                <th style={styles.th}>이벤트</th>
                <th style={styles.th}>이름</th>
                <th style={styles.th}>연락처</th>
                <th style={styles.th}>이메일</th>
                <th style={styles.th}>업종</th>
                <th style={styles.th}>지역</th>
                <th style={styles.th}>홈피</th>
                <th style={styles.th}>한 줄 고민</th>
                <th style={styles.th}>출처</th>
                <th style={styles.th}>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.signupId} style={styles.tr}>
                  <td style={styles.td}>{formatDate(item.createdAt)}</td>
                  <td style={styles.td}>{EVENT_LABELS[item.eventCode] || item.eventCode}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{item.name}</td>
                  <td style={styles.td}>{item.phone}</td>
                  <td style={styles.td}>{item.email || '-'}</td>
                  <td style={styles.td}>{item.industry || '-'}</td>
                  <td style={styles.td}>{item.region || '-'}</td>
                  <td style={styles.td}>{HAS_SITE_LABEL[item.hasSite || ''] ?? '-'}</td>
                  <td style={{ ...styles.td, whiteSpace: 'normal', maxWidth: 280 }}>
                    {item.concern || '-'}
                  </td>
                  <td style={styles.td}>{item.source || '-'}</td>
                  <td style={styles.td}>{item.status || 'new'}</td>
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
  page: {
    maxWidth: 1400,
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
  },
  filterRow: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  filterLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 12,
    color: '#666',
  },
  select: {
    padding: '6px 10px',
    border: '1px solid var(--border)',
    borderRadius: 6,
    fontSize: 13,
    background: '#fff',
    minWidth: 160,
  },
  msg: {
    fontSize: 14,
    color: '#666',
    padding: '40px 0',
    textAlign: 'center',
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
  tr: {
    borderBottom: '1px solid var(--border-soft)',
  },
  td: {
    padding: '11px 14px',
    color: '#333',
    whiteSpace: 'nowrap' as const,
    verticalAlign: 'top',
  },
};
