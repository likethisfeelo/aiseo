import { useState, useEffect } from 'react';
import { adminGetCourseInquiries } from '../../api';

interface ServiceSnapshot {
  id: string;
  code: string;
  name: string;
  price: number;
  priceLabel: string;
}

interface CourseInquiry {
  inquiryId: string;
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  memo?: string;
  source?: string;
  kakaoConsent?: boolean;
  selectedServices: string[];
  servicesSnapshot?: ServiceSnapshot[];
  totalPrice?: number;
  status?: string;
}

export function CourseInquiryAdminPage() {
  const [items, setItems] = useState<CourseInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminGetCourseInquiries()
      .then((data: { inquiries: CourseInquiry[]; count: number }) => {
        setItems(data.inquiries || []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatServices = (item: CourseInquiry) => {
    if (item.servicesSnapshot && item.servicesSnapshot.length > 0) {
      return item.servicesSnapshot
        .map((s) => `${s.code ? s.code + ' ' : ''}${s.name}`)
        .join(', ');
    }
    return (item.selectedServices || []).join(', ');
  };

  const formatPrice = (n?: number) =>
    Number.isFinite(n) && (n as number) > 0 ? `${(n as number).toLocaleString('ko-KR')}원` : '-';

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>수강/상담 문의 관리 (Course)</h1>
      <p style={styles.subtitle}>총 {items.length}건의 문의</p>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}

      {!loading && !error && items.length === 0 && (
        <p style={styles.msg}>아직 접수된 문의가 없습니다.</p>
      )}

      {items.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>신청일시</th>
                <th style={styles.th}>이름</th>
                <th style={styles.th}>연락처</th>
                <th style={styles.th}>카카오 ID</th>
                <th style={styles.th}>선택 서비스</th>
                <th style={styles.th}>합계</th>
                <th style={styles.th}>메모</th>
                <th style={styles.th}>상태</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.inquiryId} style={styles.tr}>
                  <td style={styles.td}>{formatDate(item.createdAt)}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{item.name}</td>
                  <td style={styles.td}>{item.phone}</td>
                  <td style={styles.td}>{item.email || '-'}</td>
                  <td style={{ ...styles.td, whiteSpace: 'normal', maxWidth: 280 }}>
                    {formatServices(item)}
                  </td>
                  <td style={styles.td}>{formatPrice(item.totalPrice)}</td>
                  <td style={{ ...styles.td, whiteSpace: 'normal', maxWidth: 240 }}>
                    {item.memo || '-'}
                  </td>
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
    maxWidth: 1200,
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
