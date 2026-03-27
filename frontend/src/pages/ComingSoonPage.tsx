interface Props {
  title: string;
  description: string;
  icon?: string;
}

export function ComingSoonPage({ title, description, icon = '🚧' }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: "'Noto Sans KR', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>{description}</p>
        <div style={{ padding: '12px 20px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'inline-block' }}>
          <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>출시 예정</span>
        </div>
      </div>
    </div>
  );
}
