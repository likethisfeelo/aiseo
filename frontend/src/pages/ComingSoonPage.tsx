interface Props {
  title: string;
  description: string;
  icon?: string;
}

export function ComingSoonPage({ title, description, icon = '🚧' }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: 'var(--font-ko)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 24 }}>{description}</p>
        <div style={{ padding: '12px 20px', borderRadius: 10, background: 'var(--bg-soft)', border: '1px solid var(--border)', display: 'inline-block' }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>출시 예정</span>
        </div>
      </div>
    </div>
  );
}
