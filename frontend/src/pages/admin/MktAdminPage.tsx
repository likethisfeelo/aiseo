import { useState, useEffect } from 'react';
import { adminGetConsultations } from '../../api';

interface Consultation {
  consultationId: string;
  createdAt: string;
  name: string;
  phone: string;
  contentConfirmed: boolean;
  selectedServices: string[];
  businessRegistered: string;
  specialIndustry: string;
  kakaoConsent: boolean;
}

const SERVICE_LABELS: Record<string, string> = {
  free: '바로배포+SEO(무료)',
  content_check: '콘텐츠점검(10만)',
  ai_consulting: 'AI컨설팅(20만)',
};

const BUSINESS_LABELS: Record<string, string> = {
  registered: '있음',
  not_registered: '없음',
  preparing: '준비 중',
};

const INDUSTRY_LABELS: Record<string, string> = {
  oneday_class: '원데이클래스',
  pet: '반려동물',
  handmade: '수제작',
  custom: '맞춤제작',
  kids: '키즈',
  none: '해당없음',
};

export function MktAdminPage() {
  const [items, setItems] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminGetConsultations()
      .then((data: { consultations: Consultation[]; count: number }) => {
        setItems(data.consultations || []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>배포교육 상담신청 관리</h1>
      <p style={styles.subtitle}>총 {items.length}건의 상담신청</p>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}

      {!loading && !error && items.length === 0 && (
        <p style={styles.msg}>아직 접수된 상담신청이 없습니다.</p>
      )}

      {items.length > 0 && (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>신청일시</th>
                <th style={styles.th}>이름</th>
                <th style={styles.th}>연락처</th>
                <th style={styles.th}>서비스</th>
                <th style={styles.th}>사업자</th>
                <th style={styles.th}>업종</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.consultationId} style={styles.tr}>
                  <td style={styles.td}>{formatDate(item.createdAt)}</td>
                  <td style={{ ...styles.td, fontWeight: 500 }}>{item.name}</td>
                  <td style={styles.td}>{item.phone}</td>
                  <td style={styles.td}>
                    {(item.selectedServices || []).map(s => SERVICE_LABELS[s] || s).join(', ')}
                  </td>
                  <td style={styles.td}>{BUSINESS_LABELS[item.businessRegistered] || item.businessRegistered}</td>
                  <td style={styles.td}>{INDUSTRY_LABELS[item.specialIndustry] || item.specialIndustry}</td>
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
    maxWidth: 1100, margin: '0 auto', padding: '40px 24px',
    fontFamily: 'var(--font-ko)',
  },
  title: {
    fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4,
  },
  subtitle: {
    fontSize: 13, color: '#888', marginBottom: 24,
  },
  msg: {
    fontSize: 14, color: '#666', padding: '40px 0', textAlign: 'center',
  },
  tableWrap: {
    overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10,
  },
  table: {
    width: '100%', borderCollapse: 'collapse' as const, fontSize: 13,
  },
  th: {
    textAlign: 'left' as const, padding: '12px 14px', background: 'var(--bg-soft)',
    fontWeight: 600, color: '#555', borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap' as const,
  },
  tr: {
    borderBottom: '1px solid var(--border-soft)',
  },
  td: {
    padding: '11px 14px', color: '#333', whiteSpace: 'nowrap' as const,
  },
};
