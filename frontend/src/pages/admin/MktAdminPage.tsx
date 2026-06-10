import { useState, useEffect } from 'react';
import { adminGetConsultations, adminGetB2BConsultations } from '../../api';

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

interface B2BConsultation {
  b2bConsultationId: string;
  createdAt: string;
  company: string;
  contactName: string;
  phone: string;
  industry: string;
  marketingStatus: string;
  memo: string;
  consent: boolean;
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

const MARKETING_STATUS_LABELS: Record<string, string> = {
  none: '거의 안 함',
  partial: '일부 운영',
  outsourced: '외주 진행',
  inhouse: '내부 팀',
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

type Tab = 'b2c' | 'b2b';

export function MktAdminPage() {
  const [tab, setTab] = useState<Tab>('b2c');
  const [items, setItems] = useState<Consultation[]>([]);
  const [b2bItems, setB2bItems] = useState<B2BConsultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      adminGetConsultations()
        .then((data: { consultations: Consultation[] }) => setItems(data.consultations || []))
        .catch((e: Error) => setError(e.message)),
      adminGetB2BConsultations()
        .then((data: { consultations: B2BConsultation[] }) => setB2bItems(data.consultations || []))
        .catch((e: Error) => setError(e.message)),
    ]).finally(() => setLoading(false));
  }, []);

  const tabBtn = (id: Tab, label: string, count: number) => (
    <button
      style={{ ...styles.tab, ...(tab === id ? styles.tabActive : {}) }}
      onClick={() => setTab(id)}
    >
      {label} <span style={styles.tabCount}>{count}</span>
    </button>
  );

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>상담신청 관리</h1>

      <div style={styles.tabRow}>
        {tabBtn('b2c', '배포교육 상담', items.length)}
        {tabBtn('b2b', 'B2B 도입문의', b2bItems.length)}
      </div>

      {loading && <p style={styles.msg}>로딩 중...</p>}
      {error && <p style={{ ...styles.msg, color: 'var(--danger)' }}>오류: {error}</p>}

      {!loading && tab === 'b2c' && (
        items.length === 0 ? (
          <p style={styles.msg}>아직 접수된 상담신청이 없습니다.</p>
        ) : (
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
        )
      )}

      {!loading && tab === 'b2b' && (
        b2bItems.length === 0 ? (
          <p style={styles.msg}>아직 접수된 B2B 도입문의가 없습니다.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>문의일시</th>
                  <th style={styles.th}>회사명</th>
                  <th style={styles.th}>담당자</th>
                  <th style={styles.th}>연락처</th>
                  <th style={styles.th}>업종</th>
                  <th style={styles.th}>마케팅 현황</th>
                  <th style={styles.th}>메모</th>
                </tr>
              </thead>
              <tbody>
                {b2bItems.map(item => (
                  <tr key={item.b2bConsultationId} style={styles.tr}>
                    <td style={styles.td}>{formatDate(item.createdAt)}</td>
                    <td style={{ ...styles.td, fontWeight: 500 }}>{item.company}</td>
                    <td style={styles.td}>{item.contactName}</td>
                    <td style={styles.td}>{item.phone}</td>
                    <td style={styles.td}>{item.industry}</td>
                    <td style={styles.td}>{MARKETING_STATUS_LABELS[item.marketingStatus] || item.marketingStatus || '-'}</td>
                    <td style={{ ...styles.td, whiteSpace: 'normal', maxWidth: 280 }}>{item.memo || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
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
    fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16,
  },
  tabRow: {
    display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)',
  },
  tab: {
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    padding: '10px 14px', fontSize: 14, fontWeight: 500, color: '#888',
    cursor: 'pointer', fontFamily: 'inherit', marginBottom: -1,
  },
  tabActive: {
    color: 'var(--text-primary)', borderBottomColor: 'var(--accent)', fontWeight: 700,
  },
  tabCount: {
    fontSize: 12, color: '#aaa', marginLeft: 4,
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
