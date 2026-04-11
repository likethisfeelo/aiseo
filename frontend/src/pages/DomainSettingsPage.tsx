import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSiteSettings } from '../api';
import { getJson, postJson } from '../api-client.js';

const cardStyle = { padding: 20, borderRadius: 10, background: '#fff', border: '1px solid var(--border)', marginBottom: 16 } as const;
const inputStyle = { width: '100%', padding: 10, border: '1px solid var(--border-strong)', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' as const, marginBottom: 8 };

interface DomainChangeRequest {
  id: string;
  currentSiteId: string;
  requestedSiteId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export function DomainSettingsPage({ siteId }: { siteId: string }) {
  const navigate = useNavigate();
  const [newSiteId, setNewSiteId] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState<'success' | 'error'>('success');
  const [pendingRequest, setPendingRequest] = useState<DomainChangeRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const siteIdValid = /^[a-z0-9-]{3,63}$/.test(newSiteId.trim());
  const RESERVED = ['b2b', 'site', 'admin', 'api', 'www', 'mail', 'app', 'dev', 'staging', 'prod', 'test'];
  const isReserved = RESERVED.includes(newSiteId.trim());

  useEffect(() => {
    if (!siteId) return;
    getJson(`/domain-change?siteId=${encodeURIComponent(siteId)}`)
      .then((data: { request?: DomainChangeRequest }) => {
        if (data.request && data.request.status === 'pending') {
          setPendingRequest(data.request);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleSubmit = async () => {
    const normalized = newSiteId.trim();
    if (!normalized || !siteIdValid || isReserved) return;
    if (normalized === siteId) { setMsg('현재 주소와 동일합니다.'); setMsgType('error'); return; }

    setSending(true);
    setMsg('');
    try {
      const data = await postJson('/domain-change', {
        siteId,
        requestedSiteId: normalized,
        reason: reason.trim(),
      });
      setPendingRequest(data.request);
      setMsg('변경 요청이 접수되었습니다. 관리자 승인 후 반영됩니다.');
      setMsgType('success');
      setNewSiteId('');
      setReason('');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '요청 실패');
      setMsgType('error');
    }
    setSending(false);
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>불러오는 중...</div>;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: 20 }}>
      <button onClick={() => navigate(-1)} style={{
        background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', marginBottom: 16, padding: 0,
      }}>← 뒤로</button>

      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>도메인 설정</h2>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>현재 사이트 주소를 확인하고 변경을 요청할 수 있습니다.</p>

      {/* Current Domain */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>현재 도메인</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{siteId}.aiseo.tips</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
          이 주소는 처음 설정 시 확정되었으며, 변경은 관리자 승인이 필요합니다.
        </div>
      </div>

      {/* Pending Request */}
      {pendingRequest && (
        <div style={{ ...cardStyle, background: 'var(--warning-soft)', borderColor: 'var(--warning-soft)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning-dark)', marginBottom: 8 }}>변경 요청 대기 중</div>
          <div style={{ fontSize: 13, color: 'var(--warning-dark)' }}>
            <strong>요청 주소:</strong> {pendingRequest.requestedSiteId}.aiseo.tips
          </div>
          {pendingRequest.reason && (
            <div style={{ fontSize: 12, color: 'var(--warning-dark)', marginTop: 4 }}>
              <strong>사유:</strong> {pendingRequest.reason}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--warning-dark)', marginTop: 8 }}>
            {new Date(pendingRequest.createdAt).toLocaleDateString('ko-KR')} 요청 · 관리자 승인 대기 중
          </div>
        </div>
      )}

      {/* Change Request Form */}
      {!pendingRequest && (
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>도메인 변경 요청</div>

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>새 도메인 주소</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <input
              value={newSiteId}
              onChange={(e) => setNewSiteId(e.target.value.toLowerCase())}
              placeholder="new-site-id"
              style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
            />
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>.aiseo.tips</span>
          </div>
          {newSiteId.trim() && (
            <div style={{ fontSize: 11, color: !siteIdValid ? 'var(--danger)' : isReserved ? 'var(--danger)' : 'var(--success)', marginBottom: 8 }}>
              {!siteIdValid ? '영문 소문자, 숫자, 하이픈(-) 3~63자만 가능합니다.' : isReserved ? '예약된 주소입니다.' : `https://${newSiteId.trim()}.aiseo.tips`}
            </div>
          )}

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, marginTop: 8 }}>변경 사유 (선택)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="변경이 필요한 이유를 입력해 주세요"
            style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          />

          <button
            onClick={handleSubmit}
            disabled={sending || !siteIdValid || isReserved || newSiteId.trim() === siteId}
            style={{
              width: '100%', padding: 12, borderRadius: 8, border: 'none',
              background: siteIdValid && !isReserved ? 'var(--primary)' : 'var(--border)',
              color: siteIdValid && !isReserved ? '#fff' : 'var(--text-muted)',
              fontSize: 14, fontWeight: 700, cursor: siteIdValid ? 'pointer' : 'default', marginTop: 8,
            }}
          >
            {sending ? '요청 중...' : '변경 요청 제출'}
          </button>
        </div>
      )}

      {msg && (
        <div style={{
          padding: 12, borderRadius: 8, fontSize: 13, marginTop: 8,
          background: msgType === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)',
          color: msgType === 'success' ? 'var(--success-dark)' : 'var(--danger-dark)',
          border: `1px solid ${msgType === 'success' ? 'var(--success-soft)' : 'var(--danger-soft)'}`,
        }}>{msg}</div>
      )}

      <div style={{ marginTop: 24, padding: 16, borderRadius: 8, background: 'var(--bg-soft)', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        <strong>안내사항</strong><br />
        · 도메인 변경은 관리자 승인 후 반영됩니다<br />
        · 변경 전 주소로의 접속은 차단됩니다<br />
        · 기존 검색엔진 노출에 영향이 있을 수 있습니다<br />
        · 이미 사용 중인 주소로는 변경할 수 없습니다
      </div>
    </div>
  );
}
