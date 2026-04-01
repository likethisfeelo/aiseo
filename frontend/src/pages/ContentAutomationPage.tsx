export function ContentAutomationPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'Noto Sans KR', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 520, padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
          콘텐츠 자동화 교육 준비 중
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8, marginBottom: 28 }}>
          AI를 활용한 SEO 블로그 글 자동 생성, SNS 콘텐츠 발행,<br />
          리뷰 관리 자동화 등 콘텐츠 마케팅의 모든 것을 준비하고 있습니다.
        </p>

        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: '24px 28px', textAlign: 'left', marginBottom: 28,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 16 }}>
            교육에서 배울 수 있는 것
          </div>
          {[
            'AI 블로그 글 자동 생성 (ChatGPT/Claude 활용)',
            'SEO 최적화된 콘텐츠 작성 노하우',
            'SNS 콘텐츠 일괄 발행 자동화',
            '고객 리뷰 수집 및 답변 자동화',
            '네이버 블로그 / 인스타그램 콘텐츠 전략',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: '#475569' }}>
              <span style={{ color: '#2563eb', fontSize: 14 }}>✓</span>
              {item}
            </div>
          ))}
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', borderRadius: 12,
          padding: '20px 24px', marginBottom: 28,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>
            곧 만나보실 수 있어요
          </div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
            현재 교육 콘텐츠를 제작 중입니다.<br />
            아래 버튼을 눌러 사전 신청하시면 오픈 시 가장 먼저 안내드립니다.
          </div>
        </div>

        <button
          onClick={() => window.open('https://forms.gle/placeholder', '_blank')}
          style={{
            padding: '14px 40px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.3)'; }}
        >
          콘텐츠 자동화 교육 사전 신청 →
        </button>

        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 12 }}>
          신청 시 이메일로 오픈 알림을 보내드립니다
        </div>
      </div>
    </div>
  );
}
